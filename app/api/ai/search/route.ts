import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { rewriteQuery, SemanticQuerySchema } from "@/lib/ai/search";

export const runtime = "nodejs";

const Body = z.object({ q: z.string().min(1).max(500) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!hasAnthropicKey()) {
    return NextResponse.json(
      SemanticQuerySchema.parse({
        bodyKeywords: parsed.data.q.split(/\s+/).filter(Boolean),
        subjectKeywords: parsed.data.q.split(/\s+/).filter(Boolean),
        semanticHint: parsed.data.q,
      }),
    );
  }
  try {
    const out = await rewriteQuery(parsed.data.q);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI search rewrite failed" },
      { status: 500 },
    );
  }
}
