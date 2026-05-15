import type { EmailAddress } from "./types";

const ADDR_REGEX = /(?:"?([^"<]+)"?\s)?<?([^\s<>,;]+@[^\s<>,;]+)>?/g;

export function parseAddressList(input: string | undefined | null): EmailAddress[] {
  if (!input) return [];
  const out: EmailAddress[] = [];
  for (const m of input.matchAll(ADDR_REGEX)) {
    const name = m[1]?.trim().replace(/^"|"$/g, "") || undefined;
    const email = m[2]?.trim();
    if (email) out.push({ name, email });
  }
  return out;
}

export function textFromBase64(b64url: string): string {
  return Buffer.from(b64url.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

export function htmlFromBase64(b64url: string): string {
  return textFromBase64(b64url);
}

export function snippet(text: string, max = 140): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}
