import { NextResponse } from "next/server";
import { z } from "zod";
import { summarize } from "@/lib/ai/summarize";
import { prioritize } from "@/lib/ai/prioritize";
import { isApiAuthorized } from "@/lib/auth/authorize";

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
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = BatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Local engine — always available, no key required. Compute summary +
  // priority for every item.
  const results = await Promise.all(
    parsed.data.items.map(async (i) => {
      const [summary, p] = await Promise.all([
        summarize({ from: i.from, subject: i.subject, snippet: i.snippet }),
        prioritize({ from: i.from, subject: i.subject, snippet: i.snippet }),
      ]);
      return [i.id, { summary, priority: p.priority, priorityReason: p.reason }] as const;
    }),
  );
  return NextResponse.json({ results: Object.fromEntries(results) });
}
