import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";
import { DEMO_MESSAGES } from "@/lib/email/demo-data";

export const runtime = "nodejs";

const QuerySchema = z.object({
  label: z.string().optional(),
  query: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ items: DEMO_MESSAGES, demo: true });
  }
  try {
    if (session.provider === "google") {
      const p = new GmailProvider(session.user?.email ?? "gmail", session.accessToken);
      const r = await p.listMessages(parsed.data);
      return NextResponse.json(r);
    }
    return NextResponse.json({ items: [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
