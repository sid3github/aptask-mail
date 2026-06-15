import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import type {
  DraftMessage,
  EmailMessage,
  EmailProvider,
  ListOptions,
  ListResult,
  ModifyOp,
} from "./types";
import { ProviderError } from "./types";

export type ImapCredentials = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
};

// Common server-specific names for the Sent mailbox, in preference order.
const SENT_MAILBOX_CANDIDATES = [
  "Sent",
  "Sent Messages",
  "[Gmail]/Sent Mail",
  "Sent Items",
];

export class ImapProvider implements EmailProvider {
  readonly id = "imap" as const;

  constructor(
    public accountId: string,
    private creds: ImapCredentials,
  ) {}

  /**
   * Acquire a mailbox lock for one of the candidate names, returning the first
   * that opens. Returns null if none can be opened.
   */
  private async lockFirstAvailable(
    c: ImapFlow,
    candidates: string[],
  ): Promise<Awaited<ReturnType<ImapFlow["getMailboxLock"]>> | null> {
    for (const name of candidates) {
      try {
        return await c.getMailboxLock(name);
      } catch {
        // try the next candidate
      }
    }
    return null;
  }

  private async withClient<T>(fn: (c: ImapFlow) => Promise<T>): Promise<T> {
    const c = new ImapFlow({
      host: this.creds.host,
      port: this.creds.port,
      secure: this.creds.secure,
      auth: { user: this.creds.user, pass: this.creds.pass },
      logger: false,
    });
    try {
      await c.connect();
      return await fn(c);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      throw new ProviderError("imap", e.code ?? "ERR", e.message ?? "IMAP error");
    } finally {
      try {
        await c.logout();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Build a canonical message from a fetched IMAP row. `boxLabel` is the
   * normalized label for the mailbox being read (e.g. INBOX, SENT) so the row
   * carries the correct folder label.
   */
  private rowToMessage(msg: FetchMessageObject, boxLabel: string): EmailMessage {
    const env = msg.envelope;
    const flags = Array.from(msg.flags ?? []);
    const unread = !flags.includes("\\Seen");
    const starred = flags.includes("\\Flagged");
    return {
      id: `imap:${this.accountId}:${msg.uid}`,
      accountId: this.accountId,
      threadId: `imap:${this.accountId}:${msg.uid}`,
      from: {
        name: env?.from?.[0]?.name,
        email: env?.from?.[0]?.address ?? "unknown",
      },
      to: (env?.to ?? []).map((a) => ({ name: a.name, email: a.address ?? "" })),
      cc: (env?.cc ?? []).map((a) => ({ name: a.name, email: a.address ?? "" })),
      subject: env?.subject || "(no subject)",
      snippet: "",
      date: new Date(msg.internalDate ?? Date.now()).toISOString(),
      unread,
      starred,
      labels: [boxLabel, ...(unread ? ["UNREAD"] : []), ...(starred ? ["STARRED"] : [])],
      hasAttachments: false,
    };
  }

  async listMessages(opts: ListOptions = {}): Promise<ListResult> {
    const label = opts.label ?? "INBOX";
    // Only INBOX, SENT and STARRED are servable over IMAP; never fall back to
    // INBOX for any other label.
    if (label !== "INBOX" && label !== "SENT" && label !== "STARRED") {
      return { items: [] };
    }

    return this.withClient(async (c) => {
      const limit = opts.limit ?? 25;

      // STARRED: return only \Flagged messages from the INBOX.
      if (label === "STARRED") {
        const lock = await c.getMailboxLock("INBOX");
        try {
          const uids = (await c.search({ flagged: true }, { uid: true })) || [];
          if (uids.length === 0) return { items: [] };
          // Newest first; cap to the requested page size.
          const take = uids.slice(-limit).reverse();
          const items: EmailMessage[] = [];
          for await (const msg of c.fetch(
            take,
            {
              envelope: true,
              flags: true,
              uid: true,
              internalDate: true,
              source: false,
              bodyStructure: false,
            },
            { uid: true },
          )) {
            items.push(this.rowToMessage(msg, "STARRED"));
          }
          items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
          return { items };
        } finally {
          lock.release();
        }
      }

      // INBOX / SENT: sequence-based paginated read of the relevant mailbox.
      const lock =
        label === "SENT"
          ? await this.lockFirstAvailable(c, SENT_MAILBOX_CANDIDATES)
          : await c.getMailboxLock("INBOX");
      // A SENT mailbox may not exist on this server — return empty, not INBOX.
      if (!lock) return { items: [] };
      try {
        const mailbox = c.mailbox && typeof c.mailbox === "object" ? c.mailbox : null;
        const total = mailbox && "exists" in mailbox ? Number(mailbox.exists) : 0;
        if (total === 0) return { items: [] };

        const startCursor = opts.cursor ? Number(opts.cursor) : total;
        const from = Math.max(1, startCursor - limit + 1);
        const to = startCursor;
        const items: EmailMessage[] = [];
        for await (const msg of c.fetch(`${from}:${to}`, {
          envelope: true,
          flags: true,
          uid: true,
          internalDate: true,
          source: false,
          bodyStructure: false,
        })) {
          items.push(this.rowToMessage(msg, label));
        }
        const nextCursor = from > 1 ? String(from - 1) : undefined;
        return { items: items.reverse(), nextCursor };
      } finally {
        lock.release();
      }
    });
  }

  async getMessage(id: string): Promise<EmailMessage> {
    return this.withClient(async (c) => {
      const uid = Number(id.split(":").pop());
      const lock = await c.getMailboxLock("INBOX");
      try {
        const { content } = await c.download(String(uid), undefined, { uid: true });
        const parsed = await simpleParser(content);
        const fromAddr = Array.isArray(parsed.from?.value) ? parsed.from?.value[0] : undefined;
        const toAddrs = Array.isArray(parsed.to)
          ? parsed.to.flatMap((t) => t.value)
          : parsed.to?.value ?? [];
        return {
          id,
          accountId: this.accountId,
          threadId: id,
          from: {
            name: fromAddr?.name,
            email: fromAddr?.address ?? "unknown",
          },
          to: toAddrs.map((a) => ({ name: a.name, email: a.address ?? "" })),
          subject: parsed.subject || "(no subject)",
          snippet: (parsed.text ?? "").slice(0, 140),
          bodyHtml: typeof parsed.html === "string" ? parsed.html : undefined,
          bodyText: parsed.text ?? undefined,
          date: (parsed.date ?? new Date()).toISOString(),
          unread: false,
          starred: false,
          labels: ["INBOX"],
          hasAttachments: (parsed.attachments?.length ?? 0) > 0,
        };
      } finally {
        lock.release();
      }
    });
  }

  async sendMessage(draft: DraftMessage): Promise<{ id: string }> {
    const transport = nodemailer.createTransport({
      host: this.creds.smtpHost,
      port: this.creds.smtpPort,
      secure: this.creds.smtpSecure,
      // When not using implicit TLS (e.g. iCloud on 587), enforce STARTTLS.
      requireTLS: !this.creds.smtpSecure,
      auth: { user: this.creds.user, pass: this.creds.pass },
    });
    const info = await transport.sendMail({
      from: this.creds.user,
      to: draft.to.map((a) => a.email).join(","),
      cc: draft.cc?.map((a) => a.email).join(","),
      bcc: draft.bcc?.map((a) => a.email).join(","),
      subject: draft.subject,
      text: draft.bodyText,
      html: draft.bodyHtml,
    });
    return { id: `imap:${this.accountId}:${info.messageId}` };
  }

  async modifyMessage(id: string, op: ModifyOp): Promise<void> {
    return this.withClient(async (c) => {
      const uid = id.split(":").pop()!;
      const lock = await c.getMailboxLock("INBOX");
      try {
        switch (op.type) {
          case "markRead":
            if (op.read) await c.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            else await c.messageFlagsRemove(uid, ["\\Seen"], { uid: true });
            return;
          case "star":
            if (op.starred) await c.messageFlagsAdd(uid, ["\\Flagged"], { uid: true });
            else await c.messageFlagsRemove(uid, ["\\Flagged"], { uid: true });
            return;
          case "archive":
            await c.messageMove(uid, "Archive", { uid: true }).catch(() => undefined);
            return;
          case "trash":
            await c.messageMove(uid, "Trash", { uid: true }).catch(() => undefined);
            return;
          default:
            return;
        }
      } finally {
        lock.release();
      }
    });
  }

  async search(query: string, limit = 25): Promise<EmailMessage[]> {
    return this.withClient(async (c) => {
      const lock = await c.getMailboxLock("INBOX");
      try {
        const uids = (await c.search({ or: [{ subject: query }, { body: query }] }, { uid: true })) || [];
        const items: EmailMessage[] = [];
        const take = uids.slice(-limit).reverse();
        for (const uid of take) {
          items.push(await this.getMessage(`imap:${this.accountId}:${uid}`));
        }
        return items;
      } finally {
        lock.release();
      }
    });
  }
}
