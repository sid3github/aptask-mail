import type { DraftMessage, EmailAddress } from "./providers/types";

function addressLine(list?: EmailAddress[]): string | null {
  if (!list || list.length === 0) return null;
  return list.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(", ");
}

// Wrap base64 to 76-char lines per RFC 2045.
function wrapBase64(s: string): string {
  return s
    .replace(/[\r\n]/g, "")
    .replace(/(.{1,76})/g, "$1\r\n")
    .trimEnd();
}

/**
 * Build a raw RFC 2822 message (used by the Gmail provider, which sends a
 * base64url-encoded `raw` string). Produces a simple single-part message, or
 * multipart/mixed when there are attachments. Graph and IMAP build their own
 * payloads and don't use this.
 */
export function buildMimeMessage(
  draft: DraftMessage,
  boundary = "inboxiq_part_boundary_8f3a1c",
): string {
  const lines: string[] = [];
  const to = addressLine(draft.to);
  const cc = addressLine(draft.cc);
  const bcc = addressLine(draft.bcc);
  if (to) lines.push(`To: ${to}`);
  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  lines.push(`Subject: ${draft.subject}`);
  lines.push("MIME-Version: 1.0");

  const bodyType = draft.bodyHtml ? "text/html" : "text/plain";
  const bodyContent = draft.bodyHtml ?? draft.bodyText ?? "";
  const attachments = draft.attachments ?? [];

  if (attachments.length === 0) {
    lines.push(`Content-Type: ${bodyType}; charset=UTF-8`);
    lines.push("");
    lines.push(bodyContent);
    return lines.join("\r\n");
  }

  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");

  // Body part
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: ${bodyType}; charset=UTF-8`);
  lines.push("");
  lines.push(bodyContent);

  // Attachment parts
  for (const a of attachments) {
    const type = a.contentType || "application/octet-stream";
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${type}; name="${a.filename}"`);
    lines.push("Content-Transfer-Encoding: base64");
    lines.push(`Content-Disposition: attachment; filename="${a.filename}"`);
    lines.push("");
    lines.push(wrapBase64(a.dataBase64));
  }
  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}
