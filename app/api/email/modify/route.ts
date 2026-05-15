import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";
import type { ModifyOp } from "@/lib/email/providers/types";

export const runtime = "nodejs";

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
  const parsed = ModifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ demo: true });
  }
  try {
    if (session.provider === "google") {
      const p = new GmailProvider(session.user?.email ?? "gmail", session.accessToken);
      await p.modifyMessage(parsed.data.id, parsed.data.op as ModifyOp);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Modify failed" },
      { status: 500 },
    );
  }
}
