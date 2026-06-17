import { NextResponse } from "next/server";
import { summarize, SummaryInputSchema } from "@/lib/ai/summarize";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = SummaryInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const summary = await summarize(parsed.data);
  return NextResponse.json({ summary });
}
