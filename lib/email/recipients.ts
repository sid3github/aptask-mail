import type { EmailAddress } from "./providers/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Parse a free-text recipient field ("a@b.com, Name <c@d.com>; …") into
// canonical addresses. Tolerant of commas/semicolons, dedupes by email,
// and drops anything that isn't a plausible address.
export function parseRecipients(input: string): EmailAddress[] {
  const out: EmailAddress[] = [];
  const seen = new Set<string>();
  for (const raw of input.split(/[,;]+/)) {
    const part = raw.trim();
    if (!part) continue;
    const angle = part.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
    const name = angle ? angle[1].trim() : "";
    const email = (angle ? angle[2] : part).trim();
    if (!EMAIL.test(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name ? { name, email } : { email });
  }
  return out;
}
