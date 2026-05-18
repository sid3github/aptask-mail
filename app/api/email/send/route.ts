import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveProviders } from "@/lib/email/load";

export const runtime = "nodejs";

const AddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const SendSchema = z.object({
  accountId: z.string().optional(),
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
  const { providers, isDemo } = await resolveProviders();
  if (isDemo) {
    return NextResponse.json({ demo: true, id: `demo:${Date.now()}` });
  }
  // Resolve which provider sends: explicit accountId wins, else infer from inReplyToMessageId, else first available.
  let chosen = providers[0];
  if (parsed.data.accountId) {
    chosen = providers.find((p) => p.account.id === parsed.data.accountId) ?? chosen;
  } else if (parsed.data.inReplyToMessageId) {
    const prefix = parsed.data.inReplyToMessageId.split(":")[0];
    chosen = providers.find((p) => p.account.provider === prefix) ?? chosen;
  }
  if (!chosen) {
    return NextResponse.json({ error: "No connected account to send from" }, { status: 400 });
  }
  try {
    const r = await chosen.provider.sendMessage({
      accountId: chosen.account.id,
      to: parsed.data.to,
      cc: parsed.data.cc,
      bcc: parsed.data.bcc,
      subject: parsed.data.subject,
      bodyText: parsed.data.bodyText,
      bodyHtml: parsed.data.bodyHtml,
      threadId: parsed.data.threadId,
      inReplyToMessageId: parsed.data.inReplyToMessageId,
    });
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 },
    );
  }
}
