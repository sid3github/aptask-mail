import { z } from "zod";
import { anthropic, MODEL_HAIKU } from "./anthropic";
import { PRIORITY_SYSTEM } from "./prompts";
import type { AiPriority } from "@/lib/email/providers/types";

export const PriorityInputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
});
export type PriorityInput = z.infer<typeof PriorityInputSchema>;

const PriorityOutputSchema = z.object({
  priority: z.enum(["urgent", "important", "newsletter", "promo", "other"]),
  reason: z.string().max(80),
});
export type PriorityOutput = z.infer<typeof PriorityOutputSchema>;

export async function prioritize(input: PriorityInput): Promise<PriorityOutput> {
  const parsed = PriorityInputSchema.parse(input);
  const userContent = [
    `From: ${parsed.from}`,
    `Subject: ${parsed.subject}`,
    `Snippet: ${parsed.snippet}`,
  ].join("\n");

  const res = await anthropic().messages.create({
    model: MODEL_HAIKU,
    max_tokens: 120,
    system: [
      {
        type: "text",
        text: PRIORITY_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const block = res.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "{}";
  // Strip code fences if model adds them.
  const cleaned = raw.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return PriorityOutputSchema.parse(obj);
  } catch {
    return { priority: "other" as AiPriority, reason: "fallback" };
  }
}
