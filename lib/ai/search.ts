import { z } from "zod";
import { anthropic, MODEL_HAIKU } from "./anthropic";
import { SEARCH_QUERY_SYSTEM } from "./prompts";

export const SemanticQuerySchema = z.object({
  subjectKeywords: z.array(z.string()).default([]),
  bodyKeywords: z.array(z.string()).default([]),
  fromContains: z.string().nullable().default(null),
  dateFrom: z.string().nullable().default(null),
  dateTo: z.string().nullable().default(null),
  semanticHint: z.string().default(""),
});
export type SemanticQuery = z.infer<typeof SemanticQuerySchema>;

export async function rewriteQuery(natural: string): Promise<SemanticQuery> {
  const res = await anthropic().messages.create({
    model: MODEL_HAIKU,
    max_tokens: 300,
    system: [
      { type: "text", text: SEARCH_QUERY_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: natural }],
  });
  const block = res.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    return SemanticQuerySchema.parse(JSON.parse(cleaned));
  } catch {
    return SemanticQuerySchema.parse({});
  }
}
