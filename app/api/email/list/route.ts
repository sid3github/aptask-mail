import { NextResponse } from "next/server";
import { z } from "zod";
import { loadInbox } from "@/lib/email/load";
import { isApiAuthorized } from "@/lib/auth/authorize";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  label: z.enum(["INBOX", "STARRED", "SENT"]).optional(),
});

export async function GET(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const r = await loadInbox(parsed.data.limit ?? 25, parsed.data.label ?? "INBOX");
    return NextResponse.json({ items: r.messages, accounts: r.accounts, demo: r.isDemo });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "list failed" },
      { status: 500 },
    );
  }
}
