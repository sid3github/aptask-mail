import { NextResponse } from "next/server";
import { z } from "zod";
import { rewriteQuery } from "@/lib/ai/search";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

const Body = z.object({ q: z.string().min(1).max(500) });

export async function POST(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const out = await rewriteQuery(parsed.data.q);
  return NextResponse.json(out);
}
