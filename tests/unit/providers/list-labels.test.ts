// Verifies that each provider honors opts.label for INBOX / SENT / STARRED and
// returns an empty result (never falls back to INBOX) for any other label.
// Regression test for the bug where sidebar folders all showed the inbox.
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Gmail: label is passed straight through as labelIds; default is INBOX.
// ---------------------------------------------------------------------------
vi.mock("googleapis", () => {
  const messages = {
    list: vi.fn(),
    get: vi.fn(),
    send: vi.fn(),
    modify: vi.fn(),
    trash: vi.fn(),
    untrash: vi.fn(),
  };
  return {
    google: {
      auth: { OAuth2: class { setCredentials() {} } },
      gmail: () => ({ users: { messages } }),
    },
    __messages: messages,
  };
});

async function gmailMocks() {
  const g = (await import("googleapis")) as unknown as {
    __messages: Record<string, ReturnType<typeof vi.fn>>;
  };
  return g.__messages;
}

describe("GmailProvider honors label", () => {
  beforeEach(async () => {
    const m = await gmailMocks();
    for (const k of Object.keys(m)) m[k].mockReset();
  });

  it("defaults to INBOX when no label is given", async () => {
    const messages = await gmailMocks();
    messages.list.mockResolvedValue({ data: { messages: [] } });
    const { GmailProvider } = await import("@/lib/email/providers/gmail");
    await new GmailProvider("acct", "tok").listMessages();
    expect(messages.list).toHaveBeenCalledWith(
      expect.objectContaining({ labelIds: ["INBOX"] }),
    );
  });

  it.each(["INBOX", "STARRED", "SENT"])("passes %s through as labelIds", async (label) => {
    const messages = await gmailMocks();
    messages.list.mockResolvedValue({ data: { messages: [] } });
    const { GmailProvider } = await import("@/lib/email/providers/gmail");
    await new GmailProvider("acct", "tok").listMessages({ label });
    expect(messages.list).toHaveBeenCalledWith(
      expect.objectContaining({ labelIds: [label] }),
    );
  });
});

// ---------------------------------------------------------------------------
// Graph: label maps to a mailbox folder URL; STARRED adds a flagged filter.
// ---------------------------------------------------------------------------
const graphApi = vi.fn();
vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: () => ({
      api: (url: string) => {
        graphApi(url);
        return { get: async () => ({ value: [] }), post: async () => ({}), patch: async () => ({}) };
      },
    }),
  },
}));

describe("GraphProvider honors label", () => {
  beforeEach(() => graphApi.mockReset());

  it("INBOX hits the inbox folder", async () => {
    const { GraphProvider } = await import("@/lib/email/providers/graph");
    await new GraphProvider("acct", "tok").listMessages({ label: "INBOX" });
    expect(graphApi).toHaveBeenCalledWith(
      expect.stringContaining("/me/mailFolders/inbox/messages"),
    );
  });

  it("SENT hits the sentitems folder", async () => {
    const { GraphProvider } = await import("@/lib/email/providers/graph");
    await new GraphProvider("acct", "tok").listMessages({ label: "SENT" });
    expect(graphApi).toHaveBeenCalledWith(
      expect.stringContaining("/me/mailFolders/sentitems/messages"),
    );
  });

  it("STARRED scopes to inbox with a flagged filter", async () => {
    const { GraphProvider } = await import("@/lib/email/providers/graph");
    await new GraphProvider("acct", "tok").listMessages({ label: "STARRED" });
    const url = graphApi.mock.calls.at(-1)?.[0] as string;
    expect(url).toContain("/me/mailFolders/inbox/messages");
    expect(decodeURIComponent(url)).toContain("flag/flagStatus eq 'flagged'");
  });

  it("returns empty and makes no call for an unservable label", async () => {
    const { GraphProvider } = await import("@/lib/email/providers/graph");
    const r = await new GraphProvider("acct", "tok").listMessages({ label: "DRAFT" });
    expect(r).toEqual({ items: [] });
    expect(graphApi).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// IMAP: INBOX/SENT open mailboxes, STARRED searches flagged, others are empty.
// ---------------------------------------------------------------------------
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: async () => ({}) }) } }));
vi.mock("mailparser", () => ({ simpleParser: async () => ({}) }));

type FakeClient = {
  connect: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  getMailboxLock: ReturnType<typeof vi.fn>;
  mailbox: { exists: number };
  fetch: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
};

let fakeClient: FakeClient;
const openableMailboxes = new Set<string>();

vi.mock("imapflow", () => ({
  ImapFlow: class {
    constructor() {
      return fakeClient as unknown as object;
    }
  },
}));

function makeFakeClient(): FakeClient {
  async function* emptyGen() {}
  return {
    connect: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    getMailboxLock: vi.fn(async (name: string) => {
      if (!openableMailboxes.has(name)) throw new Error(`no mailbox ${name}`);
      fakeClient.mailbox = { exists: 0 };
      return { release: () => {} };
    }),
    mailbox: { exists: 0 },
    fetch: vi.fn(() => emptyGen()),
    search: vi.fn(async () => []),
  };
}

describe("ImapProvider honors label", () => {
  const creds = {
    host: "h", port: 993, secure: true, user: "u", pass: "p",
    smtpHost: "s", smtpPort: 465, smtpSecure: true,
  };

  beforeEach(() => {
    fakeClient = makeFakeClient();
    openableMailboxes.clear();
  });

  it("INBOX opens the INBOX mailbox", async () => {
    openableMailboxes.add("INBOX");
    const { ImapProvider } = await import("@/lib/email/providers/imap");
    await new ImapProvider("acct", creds).listMessages({ label: "INBOX" });
    expect(fakeClient.getMailboxLock).toHaveBeenCalledWith("INBOX");
  });

  it("SENT tries common Sent mailbox names and uses the first that opens", async () => {
    openableMailboxes.add("Sent Messages"); // first candidate "Sent" fails
    const { ImapProvider } = await import("@/lib/email/providers/imap");
    await new ImapProvider("acct", creds).listMessages({ label: "SENT" });
    expect(fakeClient.getMailboxLock).toHaveBeenCalledWith("Sent");
    expect(fakeClient.getMailboxLock).toHaveBeenCalledWith("Sent Messages");
  });

  it("SENT returns empty when no Sent mailbox can be opened", async () => {
    const { ImapProvider } = await import("@/lib/email/providers/imap");
    const r = await new ImapProvider("acct", creds).listMessages({ label: "SENT" });
    expect(r).toEqual({ items: [] });
  });

  it("STARRED searches flagged messages in INBOX", async () => {
    openableMailboxes.add("INBOX");
    fakeClient.search = vi.fn(async () => []);
    const { ImapProvider } = await import("@/lib/email/providers/imap");
    const r = await new ImapProvider("acct", creds).listMessages({ label: "STARRED" });
    expect(fakeClient.getMailboxLock).toHaveBeenCalledWith("INBOX");
    expect(fakeClient.search).toHaveBeenCalledWith({ flagged: true }, { uid: true });
    expect(r).toEqual({ items: [] });
  });

  it("returns empty and never connects for an unservable label", async () => {
    const { ImapProvider } = await import("@/lib/email/providers/imap");
    const r = await new ImapProvider("acct", creds).listMessages({ label: "DRAFT" });
    expect(r).toEqual({ items: [] });
    expect(fakeClient.connect).not.toHaveBeenCalled();
  });
});
