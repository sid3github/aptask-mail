import { NextResponse } from "next/server";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { generateDraft, DraftInputSchema } from "@/lib/ai/draft";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI draft failed" },
      { status: 500 },
    );
  }
}
