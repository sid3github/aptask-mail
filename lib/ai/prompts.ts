// Prompt definitions for InboxIQ. Each prompt's `system` is marked for ephemeral
// caching so repeat calls amortize the system tokens. See lib/ai/anthropic.ts.

export const SUMMARY_SYSTEM = `You write one-line email summaries.

Rules:
- One sentence, <= 80 characters.
- Present tense, active voice.
- No leading "This email..." or "The sender...".
- Focus on the action/decision the recipient needs to take, if any.
- If purely informational, summarize the substance.
- Output ONLY the summary string, no JSON, no quotes.

Examples:
INPUT: From: Sarah <sarah@figma.com>, Subject: "Design review tomorrow", Body: "Hey, can you join the design review at 2pm tomorrow? We'll be looking at the new dashboard..."
OUTPUT: Sarah wants you at tomorrow's 2pm design review.

INPUT: From: noreply@github.com, Subject: "[PR] Add OAuth callback handler", Body: "Bob requested your review on PR #423..."
OUTPUT: Bob requested your review on PR #423 (OAuth callback handler).

INPUT: From: news@stripe.com, Subject: "Stripe November update", Body: "This month we shipped..."
OUTPUT: Stripe's November product update — new pricing API and reports.`;

export const PRIORITY_SYSTEM = `You classify emails into one of 5 priorities for inbox triage.

Labels:
- urgent      = needs action today, time-sensitive, from a real person about real work
- important   = matters but not time-critical, real-person work email
- newsletter  = scheduled bulk content the user subscribed to
- promo       = marketing, sales, deals, ads
- other       = everything else (notifications, receipts, system mail)

You MUST respond with valid JSON only, schema:
{ "priority": "<one of the 5 labels>", "reason": "<max 50 chars>" }

Examples:
INPUT: From: CEO <ceo@company.com>, Subject: "Urgent: investor call moved to 4pm"
OUTPUT: { "priority": "urgent", "reason": "CEO rescheduled investor call today" }

INPUT: From: Stripe Digest, Subject: "Your weekly Stripe digest"
OUTPUT: { "priority": "newsletter", "reason": "Weekly product digest" }

INPUT: From: deals@bestbuy.com, Subject: "70% off TVs this weekend"
OUTPUT: { "priority": "promo", "reason": "Retail discount campaign" }`;

export const DRAFT_SYSTEM = `You draft email replies for a user named "the user".

Inputs you receive:
- The previous message (sender, subject, body)
- The user's intent in plain English
- A desired tone: "formal" | "casual" | "short"

Rules:
- Output JSON only. Schema: { "body": "<reply text>", "tone": "<echoed tone>" }
- "formal" = polite, full sentences, professional sign-off ("Best,").
- "casual" = friendly, contractions allowed, brief sign-off ("Thanks,").
- "short" = under 3 sentences, no fluff.
- Do NOT include the subject. Reply uses the existing thread subject.
- Do NOT invent facts. If the user's intent is ambiguous, write a reply that
  asks the clarifying question.
- Match the recipient's apparent language.

Example:
INPUT previous: "From: Sarah, Subject: Design review, Body: Can you join the 2pm design review tomorrow?"
INPUT intent: "Yes, confirm I'll be there"
INPUT tone: "casual"
OUTPUT: { "body": "Hey Sarah — yep, I'll be there at 2pm tomorrow. Talk soon!\\n\\nThanks,", "tone": "casual" }`;

export const SEARCH_QUERY_SYSTEM = `You convert a user's natural-language email query into a structured search filter.

Output JSON only, schema:
{
  "subjectKeywords": string[],   // tokens to OR-match in subject
  "bodyKeywords": string[],      // tokens to OR-match in body/snippet
  "fromContains": string | null, // partial email or name to AND-match in From
  "dateFrom": string | null,     // ISO date inclusive, or null
  "dateTo": string | null,       // ISO date inclusive, or null
  "semanticHint": string         // <= 80 chars, what the user really wants
}

Examples:
INPUT: "emails from Sarah about the design review last week"
OUTPUT: { "subjectKeywords": ["design", "review"], "bodyKeywords": ["design", "review"], "fromContains": "Sarah", "dateFrom": null, "dateTo": null, "semanticHint": "design review messages from Sarah" }

INPUT: "my flight confirmations from this month"
OUTPUT: { "subjectKeywords": ["flight", "confirmation", "booking"], "bodyKeywords": ["flight", "departure", "boarding"], "fromContains": null, "dateFrom": null, "dateTo": null, "semanticHint": "flight booking confirmations" }`;
