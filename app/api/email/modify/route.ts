import { NextResponse } from "next/server";
import { z } from "zod";
import type { ModifyOp } from "@/lib/email/providers/types";
import { providerForMessageId } from "@/lib/email/load";
import { isApiAuthorized } from "@/lib/auth/authorize";

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
  if (!(await isApiAuthorized())) {
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
