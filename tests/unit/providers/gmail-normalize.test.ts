import { describe, it, expect, vi, beforeEach } from "vitest";

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

async function loadProvider() {
  const mod = await import("@/lib/email/providers/gmail");
  return mod.GmailProvider;
}

async function getMocks() {
  const g = (await import("googleapis")) as unknown as {
    __messages: Record<string, ReturnType<typeof vi.fn>>;
  };
  return g.__messages;
}

beforeEach(async () => {
  const m = await getMocks();
  for (const k of Object.keys(m)) m[k].mockReset();
});

describe("GmailProvider.listMessages", () => {
  it("normalizes a metadata response", async () => {
    const messages = await getMocks();
    messages.list.mockResolvedValue({ data: { messages: [{ id: "abc" }] } });
    messages.get.mockResolvedValue({
      data: {
        id: "abc",
        threadId: "thr1",
        snippet: "Hi there",
        internalDate: String(Date.UTC(2026, 4, 1, 10, 0)),
        labelIds: ["INBOX", "UNREAD"],
        payload: {
          headers: [
            { name: "From", value: "Sarah <sarah@x.com>" },
            { name: "To", value: "you@x.com" },
            { name: "Subject", value: "Hello" },
          ],
        },
      },
    });

    const Provider = await loadProvider();
    const p = new Provider("acct", "token");
    const r = await p.listMessages({ limit: 1 });
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      id: "gmail:abc",
      accountId: "acct",
      from: { email: "sarah@x.com" },
      subject: "Hello",
      unread: true,
    });
  });

  it("throws TokenExpiredError on 401", async () => {
    const messages = await getMocks();
    messages.list.mockRejectedValue({ code: 401, message: "expired" });
    const Provider = await loadProvider();
    const p = new Provider("acct", "token");
    await expect(p.listMessages()).rejects.toThrow(/expired/i);
  });
});
