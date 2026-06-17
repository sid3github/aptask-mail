import { NextResponse } from "next/server";
import { generateDraft, DraftInputSchema } from "@/lib/ai/draft";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = DraftInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const out = await generateDraft(parsed.data);
  return NextResponse.json(out);
}
