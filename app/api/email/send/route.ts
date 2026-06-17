import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveProviders } from "@/lib/email/load";
import { isApiAuthorized } from "@/lib/auth/authorize";
import { sanitizeHtml } from "@/lib/email/providers/sanitize";

export const runtime = "nodejs";

const AddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const AttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().max(255),
  dataBase64: z.string(),
});

// Bound recipient lists and payload so a single authenticated request can't be
// used for mass-mail relay abuse or a memory-amplification DoS. 100 recipients
// per field is well beyond normal use; body caps stay under Vercel's ~4.5MB
// request limit (attachments are additionally capped at 3MB below).
const MAX_RECIPIENTS = 100;
const SendSchema = z.object({
  accountId: z.string().optional(),
  to: z.array(AddressSchema).min(1).max(MAX_RECIPIENTS),
  cc: z.array(AddressSchema).max(MAX_RECIPIENTS).optional(),
  bcc: z.array(AddressSchema).max(MAX_RECIPIENTS).optional(),
  subject: z.string().max(998),
  bodyText: z.string().max(500_000),
  bodyHtml: z.string().max(2_000_000).optional(),
  attachments: z.array(AttachmentSchema).max(25).optional(),
  threadId: z.string().optional(),
  inReplyToMessageId: z.string().optional(),
});

// Serverless request bodies are capped (~4.5MB on Vercel); base64 inflates ~33%.
// Keep total attachment payload comfortably under that.
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
function decodedBytes(b64: string): number {
  return Math.floor((b64.length * 3) / 4);
}

export async function POST(req: Request) {
  if (!(await isApiAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const totalAttachmentBytes = (parsed.data.attachments ?? []).reduce(
    (n, a) => n + decodedBytes(a.dataBase64),
    0,
  );
  if (totalAttachmentBytes > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: "Attachments exceed the 3 MB total limit." },
      { status: 413 },
    );
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
      // Sanitize composed HTML before it leaves the app, same as inbound mail.
      bodyHtml: sanitizeHtml(parsed.data.bodyHtml),
      attachments: parsed.data.attachments,
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
