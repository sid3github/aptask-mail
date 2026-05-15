import { NextResponse } from "next/server";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { prioritize, PriorityInputSchema } from "@/lib/ai/prioritize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = PriorityInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!hasAnthropicKey()) {
    return NextResponse.json({ priority: "other", reason: "ai-disabled" });
  }
  try {
    const out = await prioritize(parsed.data);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI prioritize failed" },
      { status: 500 },
    );
  }
}
