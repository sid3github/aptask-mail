import { google, gmail_v1 } from "googleapis";
import type {
  Attachment,
  DraftMessage,
  EmailMessage,
  EmailProvider,
  ListOptions,
  ListResult,
  ModifyOp,
} from "./types";
import { TokenExpiredError, ProviderError } from "./types";
import { parseAddressList, htmlFromBase64, textFromBase64 } from "./parse";
import { sanitizeHtml } from "./sanitize";
import { buildMimeMessage } from "../mime";

const LABEL_MAP: Record<string, string> = {
  INBOX: "INBOX",
  SENT: "SENT",
  DRAFT: "DRAFT",
  ARCHIVE: "ARCHIVE",
  TRASH: "TRASH",
  SPAM: "SPAM",
  STARRED: "STARRED",
  UNREAD: "UNREAD",
  IMPORTANT: "IMPORTANT",
};

function makeClient(accessToken: string): gmail_v1.Gmail {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

function header(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function walkParts(
  payload: gmail_v1.Schema$MessagePart | undefined,
  out: { text?: string; html?: string; hasAttachments: boolean; attachments: Attachment[] },
): void {
  if (!payload) return;
  const mime = payload.mimeType ?? "";
  if (payload.filename && payload.body?.attachmentId) {
    out.hasAttachments = true;
    out.attachments.push({
      id: payload.body.attachmentId,
      filename: payload.filename,
      contentType: payload.mimeType ?? "application/octet-stream",
      size: payload.body.size ?? 0,
    });
  }
  if (mime === "text/plain" && payload.body?.data) {
    out.text = textFromBase64(payload.body.data);
  } else if (mime === "text/html" && payload.body?.data) {
    out.html = htmlFromBase64(payload.body.data);
  }
  for (const p of payload.parts ?? []) walkParts(p, out);
}

function normalize(
  msg: gmail_v1.Schema$Message,
  accountId: string,
): EmailMessage {
  const headers = msg.payload?.headers ?? [];
  const labels = msg.labelIds ?? [];
  const out = {
    text: undefined as string | undefined,
    html: undefined as string | undefined,
    hasAttachments: false,
    attachments: [] as Attachment[],
  };
  walkParts(msg.payload, out);

  return {
    id: `gmail:${msg.id}`,
    accountId,
    threadId: msg.threadId ?? msg.id ?? "",
    from: parseAddressList(header(headers, "From"))[0] ?? { email: "unknown" },
    to: parseAddressList(header(headers, "To")),
    cc: parseAddressList(header(headers, "Cc")),
    subject: header(headers, "Subject") || "(no subject)",
    snippet: msg.snippet ?? "",
    bodyHtml: sanitizeHtml(out.html),
    bodyText: out.text,
    date: new Date(Number(msg.internalDate ?? Date.now())).toISOString(),
    unread: labels.includes("UNREAD"),
    starred: labels.includes("STARRED"),
    labels: labels.map((l) => LABEL_MAP[l] ?? l),
    hasAttachments: out.hasAttachments,
    ...(out.attachments.length > 0 ? { attachments: out.attachments } : {}),
  };
}

export class GmailProvider implements EmailProvider {
  readonly id = "gmail" as const;
  private gmail: gmail_v1.Gmail;

  constructor(public accountId: string, accessToken: string) {
    this.gmail = makeClient(accessToken);
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const e = err as { code?: number; status?: number; message?: string };
      const status = e.code ?? e.status;
      if (status === 401) throw new TokenExpiredError();
      throw new ProviderError("gmail", String(status ?? "ERR"), e.message ?? "Gmail call failed");
    }
  }

  async listMessages(opts: ListOptions = {}): Promise<ListResult> {
    return this.run(async () => {
      const label = opts.label ?? "INBOX";
      const list = await this.gmail.users.messages.list({
        userId: "me",
        labelIds: [label],
        q: opts.query,
        maxResults: opts.limit ?? 25,
        pageToken: opts.cursor,
      });
      const ids = list.data.messages ?? [];
      if (ids.length === 0) return { items: [], nextCursor: list.data.nextPageToken ?? undefined };

      const batch = await Promise.all(
        ids.map((m) =>
          this.gmail.users.messages.get({
            userId: "me",
            id: m.id!,
            format: "metadata",
            metadataHeaders: ["From", "To", "Cc", "Subject", "Date"],
          }),
        ),
      );
      return {
        items: batch.map((r) => normalize(r.data, this.accountId)),
        nextCursor: list.data.nextPageToken ?? undefined,
      };
    });
  }

  async getMessage(id: string): Promise<EmailMessage> {
    return this.run(async () => {
      const native = id.replace(/^gmail:/, "");
      const res = await this.gmail.users.messages.get({ userId: "me", id: native, format: "full" });
      return normalize(res.data, this.accountId);
    });
  }

  async getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<{ filename: string; contentType: string; data: Buffer }> {
    return this.run(async () => {
      const native = messageId.replace(/^gmail:/, "");
      const [att, msg] = await Promise.all([
        this.gmail.users.messages.attachments.get({
          userId: "me",
          messageId: native,
          id: attachmentId,
        }),
        this.gmail.users.messages.get({ userId: "me", id: native, format: "full" }),
      ]);
      const data = Buffer.from(att.data.data ?? "", "base64url");

      // Walk the message parts to recover the filename/contentType for this id.
      let filename = "attachment";
      let contentType = "application/octet-stream";
      const visit = (payload: gmail_v1.Schema$MessagePart | undefined): boolean => {
        if (!payload) return false;
        if (payload.body?.attachmentId === attachmentId) {
          filename = payload.filename || filename;
          contentType = payload.mimeType ?? contentType;
          return true;
        }
        for (const p of payload.parts ?? []) {
          if (visit(p)) return true;
        }
        return false;
      };
      visit(msg.data.payload);

      return { filename, contentType, data };
    });
  }

  async sendMessage(draft: DraftMessage): Promise<{ id: string }> {
    return this.run(async () => {
      const raw = Buffer.from(buildMimeMessage(draft))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const res = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: { raw, threadId: draft.threadId },
      });
      return { id: `gmail:${res.data.id}` };
    });
  }

  async modifyMessage(id: string, op: ModifyOp): Promise<void> {
    return this.run(async () => {
      const native = id.replace(/^gmail:/, "");
      switch (op.type) {
        case "addLabel":
          await this.gmail.users.messages.modify({ userId: "me", id: native, requestBody: { addLabelIds: [op.label] } });
          return;
        case "removeLabel":
          await this.gmail.users.messages.modify({ userId: "me", id: native, requestBody: { removeLabelIds: [op.label] } });
          return;
        case "markRead":
          await this.gmail.users.messages.modify({
            userId: "me",
            id: native,
            requestBody: op.read ? { removeLabelIds: ["UNREAD"] } : { addLabelIds: ["UNREAD"] },
          });
          return;
        case "star":
          await this.gmail.users.messages.modify({
            userId: "me",
            id: native,
            requestBody: op.starred ? { addLabelIds: ["STARRED"] } : { removeLabelIds: ["STARRED"] },
          });
          return;
        case "archive":
          await this.gmail.users.messages.modify({ userId: "me", id: native, requestBody: { removeLabelIds: ["INBOX"] } });
          return;
        case "trash":
          await this.gmail.users.messages.trash({ userId: "me", id: native });
          return;
        case "untrash":
          await this.gmail.users.messages.untrash({ userId: "me", id: native });
          return;
      }
    });
  }

  async search(query: string, limit = 25): Promise<EmailMessage[]> {
    const res = await this.listMessages({ query, limit });
    return res.items;
  }
}
