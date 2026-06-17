// Small text utilities shared by the local AI engine. No external calls.

export function parseFrom(from: string): { name: string; email: string } {
  const angle = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (angle) return { name: angle[1].trim(), email: angle[2].trim().toLowerCase() };
  if (from.includes("@")) return { name: "", email: from.trim().toLowerCase() };
  return { name: from.trim(), email: "" };
}

export function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
