import { z } from "zod";
import { anthropic, MODEL_SONNET } from "./anthropic";
import { DRAFT_SYSTEM } from "./prompts";

export const DraftInputSchema = z.object({
  previousFrom: z.string(),
  previousSubject: z.string(),
  // Long quoted emails must never 400. Accept any string and clamp it so a
  // huge forwarded thread degrades gracefully instead of erroring.
  previousBody: z.string().transform((s) => s.slice(0, 8000)),
  intent: z.string().min(1).max(500),
  tone: z.enum(["formal", "casual", "short"]).default("casual"),
});
export type DraftInput = z.infer<typeof DraftInputSchema>;

const DraftOutputSchema = z.object({
  body: z.string().min(1),
  tone: z.enum(["formal", "casual", "short"]),
});
export type DraftOutput = z.infer<typeof DraftOutputSchema>;

export async function generateDraft(input: DraftInput): Promise<DraftOutput> {
  const parsed = DraftInputSchema.parse(input);
  const userContent = [
    `PREVIOUS MESSAGE:`,
    `From: ${parsed.previousFrom}`,
    `Subject: ${parsed.previousSubject}`,
    `Body:`,
    parsed.previousBody,
    ``,
    `USER INTENT: ${parsed.intent}`,
    `TONE: ${parsed.tone}`,
  ].join("\n");

  const res = await anthropic().messages.create({
    model: MODEL_SONNET,
    max_tokens: 600,
    system: [
      { type: "text", text: DRAFT_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const block = res.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    return DraftOutputSchema.parse(JSON.parse(cleaned));
  } catch {
    return { body: cleaned, tone: parsed.tone };
  }
}
