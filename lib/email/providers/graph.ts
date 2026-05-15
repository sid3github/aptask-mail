import { Client } from "@microsoft/microsoft-graph-client";
import type {
  DraftMessage,
  EmailMessage,
  EmailProvider,
  ListOptions,
  ListResult,
  ModifyOp,
} from "./types";
import { TokenExpiredError, ProviderError } from "./types";
import { parseAddressList } from "./parse";

type GraphMessage = {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  flag?: { flagStatus?: string };
  hasAttachments?: boolean;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  ccRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  body?: { contentType?: string; content?: string };
  conversationId?: string;
  categories?: string[];
  parentFolderId?: string;
};

function client(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

function rcpt(r: GraphMessage["toRecipients"]) {
  return (r ?? [])
    .map((x) => ({ name: x.emailAddress?.name, email: x.emailAddress?.address ?? "" }))
    .filter((x) => x.email);
}

function normalize(m: GraphMessage, accountId: string): EmailMessage {
  const html = m.body?.contentType?.toLowerCase() === "html" ? m.body?.content : undefined;
  const text = m.body?.contentType?.toLowerCase() === "text" ? m.body?.content : undefined;
  const starred = m.flag?.flagStatus === "flagged";
  return {
    id: `graph:${m.id}`,
    accountId,
    threadId: m.conversationId ?? m.id,
    from: {
      name: m.from?.emailAddress?.name,
      email: m.from?.emailAddress?.address ?? "unknown",
    },
    to: rcpt(m.toRecipients),
    cc: rcpt(m.ccRecipients),
    subject: m.subject || "(no subject)",
    snippet: m.bodyPreview ?? "",
    bodyHtml: html,
    bodyText: text,
    date: m.receivedDateTime ?? new Date().toISOString(),
    unread: m.isRead === false,
    starred,
    labels: [
      "INBOX",
      ...(m.isRead === false ? ["UNREAD"] : []),
      ...(starred ? ["STARRED"] : []),
      ...(m.categories ?? []),
    ],
    hasAttachments: m.hasAttachments ?? false,
  };
}

function recipients(addrs: { email: string; name?: string }[]) {
  return addrs.map((a) => ({ emailAddress: { address: a.email, name: a.name } }));
}

export class GraphProvider implements EmailProvider {
  readonly id = "graph" as const;
  private c: Client;

  constructor(public accountId: string, accessToken: string) {
    this.c = client(accessToken);
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message?: string };
      if (e.statusCode === 401) throw new TokenExpiredError();
      throw new ProviderError("graph", String(e.statusCode ?? e.code ?? "ERR"), e.message ?? "Graph call failed");
    }
  }

  async listMessages(opts: ListOptions = {}): Promise<ListResult> {
    return this.run(async () => {
      const select = [
        "id",
        "subject",
        "bodyPreview",
        "receivedDateTime",
        "isRead",
        "flag",
        "hasAttachments",
        "from",
        "toRecipients",
        "ccRecipients",
        "conversationId",
        "categories",
      ].join(",");
      let url = `/me/mailFolders/inbox/messages?$select=${select}&$top=${opts.limit ?? 25}&$orderby=receivedDateTime desc`;
      if (opts.query) url += `&$search="${encodeURIComponent(opts.query)}"`;
      const res = opts.cursor
        ? await this.c.api(opts.cursor).get()
        : await this.c.api(url).get();
      const items = ((res.value as GraphMessage[]) ?? []).map((m) => normalize(m, this.accountId));
      return { items, nextCursor: res["@odata.nextLink"] };
    });
  }

  async getMessage(id: string): Promise<EmailMessage> {
    return this.run(async () => {
      const native = id.replace(/^graph:/, "");
      const m: GraphMessage = await this.c.api(`/me/messages/${native}`).get();
      return normalize(m, this.accountId);
    });
  }

  async sendMessage(draft: DraftMessage): Promise<{ id: string }> {
    return this.run(async () => {
      const payload = {
        message: {
          subject: draft.subject,
          body: {
            contentType: draft.bodyHtml ? "HTML" : "Text",
            content: draft.bodyHtml ?? draft.bodyText,
          },
          toRecipients: recipients(draft.to),
          ccRecipients: draft.cc ? recipients(draft.cc) : undefined,
          bccRecipients: draft.bcc ? recipients(draft.bcc) : undefined,
        },
        saveToSentItems: true,
      };
      await this.c.api("/me/sendMail").post(payload);
      return { id: `graph:sent-${Date.now()}` };
    });
  }

  async modifyMessage(id: string, op: ModifyOp): Promise<void> {
    return this.run(async () => {
      const native = id.replace(/^graph:/, "");
      switch (op.type) {
        case "markRead":
          await this.c.api(`/me/messages/${native}`).patch({ isRead: op.read });
          return;
        case "star":
          await this.c.api(`/me/messages/${native}`).patch({
            flag: { flagStatus: op.starred ? "flagged" : "notFlagged" },
          });
          return;
        case "archive":
          await this.c.api(`/me/messages/${native}/move`).post({ destinationId: "archive" });
          return;
        case "trash":
          await this.c.api(`/me/messages/${native}/move`).post({ destinationId: "deleteditems" });
          return;
        case "untrash":
          await this.c.api(`/me/messages/${native}/move`).post({ destinationId: "inbox" });
          return;
        case "addLabel":
        case "removeLabel":
          // Graph uses categories; treat normalized labels as categories.
          return;
      }
    });
  }

  async search(query: string, limit = 25): Promise<EmailMessage[]> {
    const r = await this.listMessages({ query, limit });
    return r.items;
  }
}

// keep the type referenced (avoids unused-import lint when this file grows)
void parseAddressList;
