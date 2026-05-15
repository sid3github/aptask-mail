import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";

export const runtime = "nodejs";

const AddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const SendSchema = z.object({
  to: z.array(AddressSchema).min(1),
  cc: z.array(AddressSchema).optional(),
  bcc: z.array(AddressSchema).optional(),
  subject: z.string().max(998),
  bodyText: z.string(),
  bodyHtml: z.string().optional(),
  threadId: z.string().optional(),
  inReplyToMessageId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ demo: true, id: `demo:${Date.now()}` });
  }
  try {
    if (session.provider === "google") {
      const p = new GmailProvider(session.user?.email ?? "gmail", session.accessToken);
      const r = await p.sendMessage({
        accountId: session.user?.email ?? "gmail",
        ...parsed.data,
      });
      return NextResponse.json(r);
    }
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 },
    );
  }
}
