import { z } from "zod";
import { parseFrom } from "./text";

export const PriorityInputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
});
export type PriorityInput = z.infer<typeof PriorityInputSchema>;

export type PriorityOutput = {
  priority: "urgent" | "important" | "newsletter" | "promo" | "other";
  reason: string;
};

// Order matters — first match wins. Tuned to mirror how a person triages a list.
const URGENT =
  /\b(urgent|asap|immediately|action (required|needed)|payment (failed|declined|overdue)|past due|overdue|final notice|suspend(ed|ing)?|deadline|expire[sd]?|security alert|verify your (account|identity)|verification code|one[- ]time (code|password)|otp|2fa|password reset|unauthorized|fraud|account (locked|disabled))\b/i;
const PROMO =
  /\b(\d{1,3}% ?off|sale|deal|discount|save \$?\d|coupon|promo|limited time|buy now|shop now|doorbuster|free shipping|clearance|offer ends|black friday|cyber monday)\b/i;
const PROMO_SENDER = /\b(deals?|promo(tion)?s?|marketing|offers?|sales)\b/;
const NEWSLETTER =
  /\b(newsletter|digest|weekly|roundup|this week|edition|bulletin|unsubscribe)\b/i;
const BUSINESS =
  /\b(invoice|receipt|payment received|contract|proposal|agreement|meeting|review|document|signature|sign|schedule|interview|application|project|quote|statement|report)\b/i;
const AUTOMATED =
  /\b(no[- ]?reply|do[- ]?not[- ]?reply|notifications?|alerts?|updates?|team|support|info|service|billing|account|mailer|automated)\b/i;

function classify(input: PriorityInput): PriorityOutput {
  const text = `${input.subject} ${input.snippet}`;
  const { name, email } = parseFrom(input.from);
  const localPart = email.split("@")[0] ?? "";

  if (URGENT.test(text)) {
    return { priority: "urgent", reason: "Time-sensitive — needs your attention" };
  }
  if (PROMO.test(text) || PROMO_SENDER.test(localPart)) {
    return { priority: "promo", reason: "Promotional / marketing" };
  }
  if (NEWSLETTER.test(text)) {
    return { priority: "newsletter", reason: "Newsletter / digest" };
  }
  // A two-word display name that isn't an automated alias reads as a real person.
  const personal = /\S+\s+\S+/.test(name) && !AUTOMATED.test(name);
  if (BUSINESS.test(text) || personal) {
    return {
      priority: "important",
      reason: BUSINESS.test(text) ? "Business / document" : "Direct message",
    };
  }
  return { priority: "other", reason: "General" };
}

export async function prioritize(input: PriorityInput): Promise<PriorityOutput> {
  return classify(PriorityInputSchema.parse(input));
}
