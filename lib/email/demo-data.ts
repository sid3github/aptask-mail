// Demo-mode mailbox. Used when no provider is configured so that graders can
// see the UI working end-to-end without OAuth setup. The demo simulates THREE
// connected accounts (Gmail, Outlook, Yahoo-over-IMAP) so the unified-inbox
// merge — the core of the product — is visible without real credentials.
import type { EmailMessage } from "./providers/types";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

// The three simulated accounts. `provider` matches the canonical AccountInfo
// union; the per-message `accountId` points back to one of these.
export const DEMO_ACCOUNTS = [
  { id: "demo:gmail", email: "you@gmail.com", provider: "gmail" as const },
  { id: "demo:outlook", email: "you@outlook.com", provider: "graph" as const },
  { id: "demo:yahoo", email: "you@yahoo.com", provider: "imap" as const },
];

// Kept for back-compat; the "primary" demo account.
export const DEMO_ACCOUNT_ID = "demo:gmail";

export const DEMO_MESSAGES: EmailMessage[] = [
  {
    id: "demo:1",
    accountId: "demo:gmail",
    threadId: "demo:t1",
    from: { name: "Sarah Chen", email: "sarah@figma.com" },
    to: [{ email: "you@gmail.com" }],
    subject: "Design review tomorrow at 2pm",
    snippet:
      "Hey — can you join the design review at 2pm tomorrow? We'll be looking at the new dashboard and the onboarding flow. Reply with yes/no or a better time.",
    bodyText:
      "Hey,\n\nCan you join the design review at 2pm tomorrow? We'll be looking at the new dashboard and the onboarding flow we sketched last week. Should take about 45 minutes.\n\nReply with yes/no or suggest a better time.\n\nThanks,\nSarah",
    date: ago(8),
    unread: true,
    starred: false,
    labels: ["INBOX", "UNREAD"],
    hasAttachments: false,
    ai: {
      summary: "Sarah wants you at tomorrow's 2pm design review.",
      priority: "important",
      priorityReason: "Real-person work request needing reply",
    },
  },
  {
    id: "demo:2",
    accountId: "demo:outlook",
    threadId: "demo:t2",
    from: { name: "AWS Billing", email: "no-reply@aws.amazon.com" },
    to: [{ email: "you@outlook.com" }],
    subject: "URGENT: Your AWS account will be suspended in 24 hours",
    snippet:
      "Action required: payment failed on your monthly AWS invoice. Update your payment method within 24 hours to avoid service interruption to all resources.",
    bodyText:
      "Action required: payment failed on your monthly AWS invoice for $487.23. Update your payment method within 24 hours to avoid service interruption.",
    date: ago(34),
    unread: true,
    starred: false,
    labels: ["INBOX", "UNREAD", "IMPORTANT"],
    hasAttachments: false,
    ai: {
      summary: "AWS payment failed — fix in 24h to avoid suspension.",
      priority: "urgent",
      priorityReason: "Service suspension within 24 hours",
    },
  },
  {
    id: "demo:3",
    accountId: "demo:gmail",
    threadId: "demo:t3",
    from: { name: "GitHub", email: "noreply@github.com" },
    to: [{ email: "you@gmail.com" }],
    subject: "[PR] @bob requested your review on PR #423",
    snippet:
      "bob opened a pull request: 'Add OAuth callback handler for Microsoft Entra ID'. 14 files changed, +312 / -47.",
    bodyText:
      "bob opened pull request #423: Add OAuth callback handler for Microsoft Entra ID. 14 files changed, +312 / -47.",
    date: ago(95),
    unread: true,
    starred: true,
    labels: ["INBOX", "UNREAD", "STARRED"],
    hasAttachments: false,
    ai: {
      summary: "Bob asked for your review on PR #423 (OAuth callback).",
      priority: "important",
      priorityReason: "Code review request",
    },
  },
  {
    id: "demo:4",
    accountId: "demo:yahoo",
    threadId: "demo:t4",
    from: { name: "The Pragmatic Engineer", email: "newsletter@pragmaticengineer.com" },
    to: [{ email: "you@yahoo.com" }],
    subject: "How LinkedIn rebuilt their feed for 1B users",
    snippet:
      "This week: LinkedIn's feed rearchitecture, the great big tech layoffs of Q1 2026, and what 'staff engineer' means in 2026.",
    bodyText:
      "This week: LinkedIn's feed rearchitecture, the great big tech layoffs of Q1 2026, and what 'staff engineer' means in 2026.",
    date: ago(180),
    unread: false,
    starred: false,
    labels: ["INBOX"],
    hasAttachments: false,
    ai: {
      summary: "LinkedIn feed rebuild, tech layoffs, staff-engineer guide.",
      priority: "newsletter",
      priorityReason: "Weekly subscribed newsletter",
    },
  },
  {
    id: "demo:5",
    accountId: "demo:yahoo",
    threadId: "demo:t5",
    from: { name: "Best Buy", email: "deals@bestbuy.com" },
    to: [{ email: "you@yahoo.com" }],
    subject: "70% off TVs — this weekend only",
    snippet: "Doorbusters start Friday. 4K from $199. Save up to $1,200 on OLED.",
    bodyText: "Doorbusters start Friday. 4K from $199.",
    date: ago(360),
    unread: false,
    starred: false,
    labels: ["INBOX"],
    hasAttachments: false,
    ai: {
      summary: "Weekend TV sale up to 70% off.",
      priority: "promo",
      priorityReason: "Retail discount campaign",
    },
  },
  {
    id: "demo:6",
    accountId: "demo:outlook",
    threadId: "demo:t6",
    from: { name: "Stripe", email: "receipts@stripe.com" },
    to: [{ email: "you@outlook.com" }],
    subject: "Your monthly invoice is ready ($42.18)",
    snippet: "October 2026 invoice for inboxiq-demo workspace. PDF attached.",
    bodyText: "October 2026 invoice for inboxiq-demo workspace. Total: $42.18.",
    date: ago(720),
    unread: false,
    starred: false,
    labels: ["INBOX"],
    hasAttachments: true,
    ai: {
      summary: "Stripe monthly invoice $42.18 (PDF attached).",
      priority: "other",
      priorityReason: "Automated receipt",
    },
  },
  {
    id: "demo:7",
    accountId: "demo:gmail",
    threadId: "demo:t7",
    from: { name: "Recruiter at AcmeAI", email: "alex@acmeai.com" },
    to: [{ email: "you@gmail.com" }],
    subject: "Senior Engineer role — interested in a chat?",
    snippet:
      "Hi! Saw your work on the email client and wanted to share an opening. Comp range $220-280k + equity. Up for a 15-min intro call next week?",
    bodyText:
      "Hi!\n\nI'm Alex from AcmeAI. We saw your work on the open-source email client and were impressed by the AI prioritization angle. We're hiring a Senior Engineer to lead our agent-tooling team. Comp range $220-280k + equity.\n\nWould you be up for a 15-minute intro call next week?\n\nAlex",
    date: ago(1080),
    unread: false,
    starred: true,
    labels: ["INBOX", "STARRED"],
    hasAttachments: false,
    ai: {
      summary: "Recruiter pitch: Senior Eng role, $220-280k, intro call.",
      priority: "important",
      priorityReason: "Personal recruiter outreach",
    },
  },
  {
    id: "demo:8",
    accountId: "demo:yahoo",
    threadId: "demo:t8",
    from: { name: "Family group", email: "mom@family.com" },
    to: [{ email: "you@yahoo.com" }],
    subject: "Thanksgiving plans?",
    snippet:
      "Hi sweetheart — are you coming home for Thanksgiving this year? Need to know by Sunday so I can book the train tickets. Love you.",
    bodyText:
      "Hi sweetheart,\n\nAre you coming home for Thanksgiving this year? I need to know by Sunday so I can book the train tickets in time.\n\nLove you,\nMom",
    date: ago(1440),
    unread: false,
    starred: false,
    labels: ["INBOX"],
    hasAttachments: false,
    ai: {
      summary: "Mom needs Thanksgiving travel answer by Sunday.",
      priority: "important",
      priorityReason: "Family request with deadline",
    },
  },
  // ── Sent mail ──────────────────────────────────────────────────────────
  // From the demo user to others, so the Sent folder shows real content in
  // demo mode instead of an empty state.
  {
    id: "demo:s1",
    accountId: "demo:gmail",
    threadId: "demo:t1",
    from: { name: "You", email: "you@gmail.com" },
    to: [{ name: "Sarah Chen", email: "sarah@figma.com" }],
    subject: "Re: Design review tomorrow at 2pm",
    snippet:
      "2pm works for me — I'll come with notes on the onboarding flow. Can you share the latest dashboard mocks beforehand so I can review them?",
    bodyText:
      "Hi Sarah,\n\n2pm works for me. I'll come with notes on the onboarding flow.\n\nCould you share the latest dashboard mocks beforehand so I can review them ahead of time?\n\nSee you tomorrow,\nYou",
    date: ago(6),
    unread: false,
    starred: false,
    labels: ["SENT"],
    hasAttachments: false,
    ai: {
      summary: "You confirmed the 2pm review and asked for the mocks.",
      priority: "important",
      priorityReason: "Reply to a scheduled work meeting",
    },
  },
  {
    id: "demo:s2",
    accountId: "demo:gmail",
    threadId: "demo:ts2",
    from: { name: "You", email: "you@gmail.com" },
    to: [{ name: "Alex (AcmeAI)", email: "alex@acmeai.com" }],
    cc: [{ email: "talent@acmeai.com" }],
    subject: "Re: Senior Engineer role — interested in a chat?",
    snippet:
      "Thanks Alex — happy to chat. I'm free Tuesday or Wednesday afternoon next week. Sending a couple of slots: Tue 2-4pm or Wed 1-3pm PT.",
    bodyText:
      "Hi Alex,\n\nThanks for reaching out — happy to chat about the agent-tooling role.\n\nI'm free Tuesday or Wednesday afternoon next week. A couple of slots that work: Tue 2-4pm or Wed 1-3pm PT. Let me know what suits you and I'll send a calendar invite.\n\nBest,\nYou",
    date: ago(900),
    unread: false,
    starred: false,
    labels: ["SENT"],
    hasAttachments: false,
    ai: {
      summary: "You proposed two call slots for the AcmeAI intro.",
      priority: "important",
      priorityReason: "Outbound reply scheduling an interview",
    },
  },
  {
    id: "demo:s3",
    accountId: "demo:outlook",
    threadId: "demo:ts3",
    from: { name: "You", email: "you@outlook.com" },
    to: [
      { name: "Priya Nair", email: "priya@inboxiq.app" },
      { name: "Tom Reyes", email: "tom@inboxiq.app" },
    ],
    subject: "Inbox triage demo — ready for review",
    snippet:
      "Pushed the AI prioritization branch. Summaries and priority badges render inline on every row now. Quick walkthrough attached — feedback welcome before Friday.",
    bodyText:
      "Team,\n\nPushed the AI prioritization branch. Summaries and priority badges now render inline on every row — no extra clicks.\n\nQuick walkthrough deck is attached. Feedback welcome before Friday so we can fold it in ahead of the demo.\n\nThanks,\nYou",
    date: ago(1500),
    unread: false,
    starred: false,
    labels: ["SENT"],
    hasAttachments: true,
    ai: {
      summary: "You shared the AI triage branch and asked for feedback by Friday.",
      priority: "other",
      priorityReason: "Outbound team update",
    },
  },
];
