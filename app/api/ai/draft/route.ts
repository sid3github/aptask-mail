import { NextResponse } from "next/server";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { generateDraft, DraftInputSchema } from "@/lib/ai/draft";
import { auth } from "@/lib/auth/config";
import { readImapAccount } from "@/lib/auth/imap-session";

export const runtime = "nodejs";

// Gate AI routes so an unauthenticated caller cannot use us as an open Claude
// billing/prompt proxy. Allowed when: an Auth.js session exists, OR an IMAP
// account cookie exists, OR we're outside production (local demo).
async function isAuthorized(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const session = await auth();
  if (session) return true;
  const imap = await readImapAccount();
  return imap !== null;
}

export async function POST(req: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = DraftInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!hasAnthropicKey()) {
    return NextResponse.json({
      body: `Hi,\n\nThanks for your email. ${parsed.data.intent}\n\nBest,`,
      tone: parsed.data.tone ?? "casual",
    });
  }
  try {
    const out = await generateDraft(parsed.data);
    return NextResponse.json(out);
  } catch {
    // Sanitize provider errors (billing, rate limit, etc.) into one friendly line.
    return NextResponse.json(
      { error: "AI is temporarily unavailable. Please try again in a moment." },
      { status: 503 },
    );
  }
}
