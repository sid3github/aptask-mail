import { NextResponse } from "next/server";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { summarize, SummaryInputSchema } from "@/lib/ai/summarize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = SummaryInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!hasAnthropicKey()) {
    return NextResponse.json(
      { summary: `${parsed.data.from}: ${parsed.data.subject}` },
      { status: 200 },
    );
  }
  try {
    const summary = await summarize(parsed.data);
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI summarize failed" },
      { status: 500 },
    );
  }
}
