import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { summarize } from "@/lib/ai/summarize";
import { prioritize } from "@/lib/ai/prioritize";

export const runtime = "nodejs";

const ItemSchema = z.object({
  id: z.string().min(1),
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
});

const BatchSchema = z.object({
  items: z.array(ItemSchema).min(1).max(25),
});

export async function POST(req: Request) {
  const parsed = BatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // No key configured → AI unavailable. Return empty markers so the UI
  // degrades cleanly (no card, no fake summary, never an error string).
  if (!hasAnthropicKey()) {
    return NextResponse.json({
      results: Object.fromEntries(parsed.data.items.map((i) => [i.id, { unavailable: true }])),
    });
  }

  // Run each item's two calls in parallel, all items in parallel too.
  const results = await Promise.all(
    parsed.data.items.map(async (i) => {
      try {
        const [summary, p] = await Promise.all([
          summarize({ from: i.from, subject: i.subject, snippet: i.snippet }),
          prioritize({ from: i.from, subject: i.subject, snippet: i.snippet }),
        ]);
        return [i.id, { summary, priority: p.priority, priorityReason: p.reason }] as const;
      } catch {
        // Never surface raw provider errors (e.g. billing/rate-limit 400s)
        // to the client. Mark unavailable; the email renders without a card.
        return [i.id, { unavailable: true }] as const;
      }
    }),
  );
  return NextResponse.json({ results: Object.fromEntries(results) });
}
