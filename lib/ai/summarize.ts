import { z } from "zod";
import { collapse } from "./text";

export const SummaryInputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
  body: z.string().optional(),
});
export type SummaryInput = z.infer<typeof SummaryInputSchema>;

const MAX = 140;
// A leading salutation we drop so the summary starts with real content.
const GREETING =
  /^(dear\s+[^,.\n]{0,40}[,.!]?\s+|hi\s+[^,.\n]{0,30}[,!]?\s+|hello[,!]?\s+|hey\s+[^,.\n]{0,30}[,!]?\s+|greetings[,!]?\s+|to whom it may concern[,:]?\s+)/i;

function clean(raw: string): string {
  let s = collapse(raw).replace(/https?:\/\/\S+/gi, "");
  s = collapse(s).replace(GREETING, "").trim();
  return s;
}

function firstSentence(s: string): string {
  for (const part of s.split(/(?<=[.!?])\s+/)) {
    if (part.trim().length >= 20) return part.trim();
  }
  return s;
}

function extract(input: SummaryInput): string {
  const source = (input.body && input.body.trim()) || input.snippet || "";
  let s = clean(source);
  if (s.length === 0) s = collapse(input.subject);
  s = firstSentence(s);
  if (s.length === 0) s = collapse(input.subject);
  if (s.length > MAX) s = `${s.slice(0, MAX - 1).trimEnd()}…`;
  return s;
}

export async function summarize(input: SummaryInput): Promise<string> {
  return extract(SummaryInputSchema.parse(input));
}
