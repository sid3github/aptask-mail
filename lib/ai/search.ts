import { z } from "zod";

export const SemanticQuerySchema = z.object({
  subjectKeywords: z.array(z.string()).default([]),
  bodyKeywords: z.array(z.string()).default([]),
  fromContains: z.string().nullable().default(null),
  dateFrom: z.string().nullable().default(null),
  dateTo: z.string().nullable().default(null),
  semanticHint: z.string().default(""),
});
export type SemanticQuery = z.infer<typeof SemanticQuerySchema>;

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "from", "with",
  "about", "me", "my", "i", "is", "are", "was", "were", "email", "emails",
  "mail", "find", "show", "search", "get", "all", "any", "that", "this",
]);

// Local query parsing — no external model. Pulls keywords and a `from:` hint
// out of a natural query; providers do the actual matching.
export async function rewriteQuery(natural: string): Promise<SemanticQuery> {
  const text = natural.trim();
  const fromMatch = text.match(
    /\bfrom\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+|[A-Za-z][\w'-]*)/i,
  );
  const fromContains = fromMatch ? fromMatch[1] : null;
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  const keywords = Array.from(new Set(tokens)).slice(0, 8);
  return SemanticQuerySchema.parse({
    subjectKeywords: keywords,
    bodyKeywords: keywords,
    fromContains,
    dateFrom: null,
    dateTo: null,
    semanticHint: text,
  });
}
