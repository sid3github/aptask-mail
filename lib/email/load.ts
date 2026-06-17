// Unified loader. Reads which providers are signed in for the current request
// and returns a merged inbox + accounts list. Used by both the server-rendered
// inbox page and the /api/email/list route.
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";
import { GraphProvider } from "@/lib/email/providers/graph";
import { ImapProvider } from "@/lib/email/providers/imap";
import type { EmailMessage, EmailProvider } from "@/lib/email/providers/types";
import { readImapAccount } from "@/lib/auth/imap-session";
import { DEMO_ACCOUNTS, DEMO_MESSAGES } from "@/lib/email/demo-data";

export type AccountInfo = {
  id: string;
  email: string;
  provider: "gmail" | "graph" | "imap" | "demo";
};

export type LoadResult = {
  providers: { account: AccountInfo; provider: EmailProvider }[];
  accounts: AccountInfo[];
  isDemo: boolean;
};

export async function resolveProviders(): Promise<LoadResult> {
  const out: LoadResult["providers"] = [];
  const accounts: AccountInfo[] = [];

  const session = await auth();
  if (session?.accessToken && session.provider === "google") {
    const email = session.user?.email ?? "gmail";
    const acc: AccountInfo = { id: email, email, provider: "gmail" };
    accounts.push(acc);
    out.push({ account: acc, provider: new GmailProvider(email, session.accessToken) });
  } else if (session?.accessToken && session.provider === "microsoft-entra-id") {
    const email = session.user?.email ?? "graph";
    const acc: AccountInfo = { id: email, email, provider: "graph" };
    accounts.push(acc);
    out.push({ account: acc, provider: new GraphProvider(email, session.accessToken) });
  }

  const imap = await readImapAccount();
  if (imap) {
    const acc: AccountInfo = {
      id: imap.accountId,
      email: imap.displayEmail,
      provider: "imap",
    };
    accounts.push(acc);
    out.push({
      account: acc,
      provider: new ImapProvider(imap.accountId, {
        host: imap.host,
        port: imap.port,
        secure: imap.secure,
        user: imap.user,
        pass: imap.pass,
        smtpHost: imap.smtpHost,
        smtpPort: imap.smtpPort,
        smtpSecure: imap.smtpSecure,
      }),
    });
  }

  return { providers: out, accounts, isDemo: out.length === 0 };
}

// Lightweight account list for the persistent app shell (sidebar / account
// switcher). Reads the session + IMAP cookie only — no message fetch — so the
// shell can render instantly and stay mounted across tab navigations. Falls
// back to the simulated demo accounts when nothing is connected.
export async function loadAccounts(): Promise<AccountInfo[]> {
  const r = await resolveProviders();
  return r.isDemo ? DEMO_ACCOUNTS : r.accounts;
}

export async function loadInbox(
  limit = 25,
  label = "INBOX",
): Promise<{
  messages: EmailMessage[];
  accounts: AccountInfo[];
  isDemo: boolean;
}> {
  const r = await resolveProviders();
  if (r.isDemo) {
    // Filter by the requested folder so INBOX never leaks SENT-only messages,
    // then merge by date across the simulated accounts (same as the real path).
    const filtered = DEMO_MESSAGES.filter((m) => m.labels.includes(label)).sort(
      (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
    );
    return { messages: filtered, accounts: DEMO_ACCOUNTS, isDemo: true };
  }
  const settled = await Promise.allSettled(
    r.providers.map(({ provider }) => provider.listMessages({ limit, label })),
  );
  const merged: EmailMessage[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") merged.push(...s.value.items);
  }
  merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { messages: merged.slice(0, limit), accounts: r.accounts, isDemo: false };
}

export async function loadSearch(
  q: string,
  limit = 25,
): Promise<{
  messages: EmailMessage[];
  accounts: AccountInfo[];
  isDemo: boolean;
}> {
  const r = await resolveProviders();
  if (r.isDemo) {
    const needle = q.trim().toLowerCase();
    const matched = needle
      ? DEMO_MESSAGES.filter((m) => {
          const haystack = [
            m.from.name ?? "",
            m.from.email,
            m.subject,
            m.snippet,
            m.ai?.summary ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        })
      : [];
    return { messages: matched.slice(0, limit), accounts: DEMO_ACCOUNTS, isDemo: true };
  }
  const settled = await Promise.allSettled(
    r.providers.map(({ provider }) => provider.search(q, limit)),
  );
  const merged: EmailMessage[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") merged.push(...s.value);
  }
  merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { messages: merged.slice(0, limit), accounts: r.accounts, isDemo: false };
}

export async function providerForMessageId(
  id: string,
): Promise<EmailProvider | null> {
  const r = await resolveProviders();
  if (id.startsWith("gmail:")) return r.providers.find((p) => p.account.provider === "gmail")?.provider ?? null;
  if (id.startsWith("graph:")) return r.providers.find((p) => p.account.provider === "graph")?.provider ?? null;
  if (id.startsWith("imap:")) return r.providers.find((p) => p.account.provider === "imap")?.provider ?? null;
  return null;
}
