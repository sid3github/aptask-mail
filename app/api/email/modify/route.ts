import { NextResponse } from "next/server";
import { z } from "zod";
import type { ModifyOp } from "@/lib/email/providers/types";
import { providerForMessageId } from "@/lib/email/load";
import { auth } from "@/lib/auth/config";
import { readImapAccount } from "@/lib/auth/imap-session";

export const runtime = "nodejs";

// Reject unauthenticated callers in production. Allowed when: an Auth.js
// session exists, OR an IMAP account cookie exists, OR we're outside
// production (local demo).
async function isAuthorized(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const session = await auth();
  if (session) return true;
  const imap = await readImapAccount();
  return imap !== null;
}

const ModifySchema = z.object({
  id: z.string().min(1),
  op: z.union([
    z.object({ type: z.literal("addLabel"), label: z.string() }),
    z.object({ type: z.literal("removeLabel"), label: z.string() }),
    z.object({ type: z.literal("markRead"), read: z.boolean() }),
    z.object({ type: z.literal("star"), starred: z.boolean() }),
    z.object({ type: z.literal("archive") }),
    z.object({ type: z.literal("trash") }),
    z.object({ type: z.literal("untrash") }),
  ]),
});

export async function POST(req: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = ModifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const provider = await providerForMessageId(parsed.data.id);
  if (!provider) {
    return NextResponse.json({ error: "No provider for this message" }, { status: 400 });
  }
  try {
    await provider.modifyMessage(parsed.data.id, parsed.data.op as ModifyOp);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Modify failed" },
      { status: 500 },
    );
  }
}
