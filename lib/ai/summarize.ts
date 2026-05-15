import { z } from "zod";
import { anthropic, MODEL_HAIKU } from "./anthropic";
import { SUMMARY_SYSTEM } from "./prompts";

export const SummaryInputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
  body: z.string().optional(),
});
export type SummaryInput = z.infer<typeof SummaryInputSchema>;

const MAX_BODY = 1500;

export async function summarize(input: SummaryInput): Promise<string> {
  const parsed = SummaryInputSchema.parse(input);
  const userContent = [
    `From: ${parsed.from}`,
    `Subject: ${parsed.subject}`,
    `Snippet: ${parsed.snippet}`,
    parsed.body ? `Body: ${parsed.body.slice(0, MAX_BODY)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await anthropic().messages.create({
    model: MODEL_HAIKU,
    max_tokens: 80,
    system: [
      {
        type: "text",
        text: SUMMARY_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text.trim() : "";
  return text.slice(0, 120);
}
