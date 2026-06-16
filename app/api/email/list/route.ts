import { NextResponse } from "next/server";
import { z } from "zod";
import { loadInbox } from "@/lib/email/load";
import { auth } from "@/lib/auth/config";
import { readImapAccount } from "@/lib/auth/imap-session";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  label: z.enum(["INBOX", "STARRED", "SENT"]).optional(),
});

// Reject unauthenticated callers in production. Allowed when: an Auth.js
// session exists, OR an IMAP account cookie exists, OR we're outside
// production (local demo serves sample data with no account).
async function isAuthorized(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const session = await auth();
  if (session) return true;
  const imap = await readImapAccount();
  return imap !== null;
}

export async function GET(req: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const r = await loadInbox(parsed.data.limit ?? 25, parsed.data.label ?? "INBOX");
    return NextResponse.json({ items: r.messages, accounts: r.accounts, demo: r.isDemo });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "list failed" },
      { status: 500 },
    );
  }
}
