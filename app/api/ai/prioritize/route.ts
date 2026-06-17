import { NextResponse } from "next/server";
import { prioritize, PriorityInputSchema } from "@/lib/ai/prioritize";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = PriorityInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const out = await prioritize(parsed.data);
  return NextResponse.json(out);
}
