# InboxIQ — Architecture (one page)

> Universal AI-first email client. PWA, three providers, Claude-powered AI.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (PWA)                                 │
│                                                                         │
│  React 19 + Next.js App Router  ──  Tailwind v4  ──  Serwist SW        │
│  ───────────────────────────────────────────────────────────────────   │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐    │
│   │  Inbox UI    │   │  Compose UI  │   │  AI overlays           │    │
│   │  EmailRow    │   │  ComposeForm │   │  SummaryChip           │    │
│   │  MessageView │   │              │   │  PriorityBadge         │    │
│   │  AccountSwch │   │              │   │  DraftPanel            │    │
│   └──────┬───────┘   └──────┬───────┘   └──────────┬─────────────┘    │
│          │                  │                       │                   │
│   ┌──────┴─────────────────┴───────────────────────┴─────────────┐    │
│   │              fetch()  /  IndexedDB cache                     │    │
│   └──────────────────────────┬───────────────────────────────────┘    │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                               │  HTTPS, Auth.js JWT cookie
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVERLESS  (Vercel)                         │
│                                                                         │
│  ┌─────────────────┐  ┌────────────────────┐  ┌─────────────────────┐ │
│  │  /api/auth/*    │  │  /api/email/*      │  │  /api/ai/*          │ │
│  │  Auth.js v5     │  │  list / get / send │  │  summary, draft,    │ │
│  │  Google · MS    │  │  archive / label   │  │  prioritize, search │ │
│  │  IMAP creds     │  │                    │  │                     │ │
│  └────────┬────────┘  └─────────┬──────────┘  └──────────┬──────────┘ │
│           │                     │                         │             │
│           ▼                     ▼                         ▼             │
│   ┌───────────────┐    ┌────────────────┐         ┌──────────────┐    │
│   │ lib/auth      │    │  lib/email/    │         │  lib/ai/     │    │
│   │ token refresh │    │  providers/    │         │  prompts.ts  │    │
│   │ session       │    │  normalize.ts  │         │  cache       │    │
│   └───────────────┘    └────────┬───────┘         └──────┬───────┘    │
└────────────────────────────────┼──────────────────────────┼────────────┘
                                  │                          │
       ┌──────────────────────────┼─────────────┐            │
       │                          │             │            │
       ▼                          ▼             ▼            ▼
┌──────────────┐  ┌────────────────────┐  ┌─────────┐  ┌───────────────┐
│  Gmail API   │  │ Microsoft Graph    │  │  IMAP   │  │  Anthropic    │
│ (googleapis) │  │ (msgraph-client)   │  │ (imap-  │  │  Claude API   │
│              │  │                    │  │  flow)  │  │  Haiku +      │
│              │  │                    │  │ Yahoo / │  │  Sonnet       │
│              │  │                    │  │  AOL    │  │  (cached)     │
└──────────────┘  └────────────────────┘  └─────────┘  └───────────────┘
```

## Request flow: "show my unified inbox"

1. User opens `/inbox`. Server component checks Auth.js session.
2. For each linked account, the page fetches `/api/email/list?accountId=…`.
3. The endpoint resolves the provider for the account, calls
   `provider.listMessages({ cursor, limit })`, normalizes to `EmailMessage[]`.
4. Response is merged by date in the page, dispatched to the client.
5. Client caches the page slice in IndexedDB so a refresh is instant.
6. In parallel, `/api/ai/summarize` is called for messages without cached
   summaries; results stream back and patch the UI.

## Request flow: "summarize this email"

1. Client posts `{ messageId, snippet, body }` to `/api/ai/summarize`.
2. Server calls `messages.create` on Claude Haiku 4.5 with the **cached
   system prompt** (`cache_control: ephemeral`).
3. Response is validated with zod, persisted in the message cache, returned.
4. Subsequent loads of the same message read the cached summary.

## Provider abstraction

All three providers implement:

```ts
interface EmailProvider {
  id: "gmail" | "graph" | "imap";
  listMessages(opts): Promise<{ items: EmailMessage[]; nextCursor?: string }>;
  getMessage(id): Promise<EmailMessage>;
  sendMessage(draft): Promise<{ id: string }>;
  modifyMessage(id, op): Promise<void>;   // archive, label, trash, star
  search(query): Promise<EmailMessage[]>;
}
```

This is the only contract the UI knows. New providers (e.g. Fastmail JMAP)
can be added by implementing the interface — no UI changes required.

## Security

- Auth.js sessions are JWT cookies, httpOnly + secure.
- OAuth refresh tokens stored inside the JWT, never exposed to the client.
- IMAP passwords AES-256-GCM encrypted with `IMAP_ENCRYPTION_KEY` before
  any persistence (server memory only during a request, Vercel KV in prod).
- Every API route validates input with `zod` and authorizes the request
  against the session before touching a provider.
- Email HTML bodies are sanitized server-side with DOMPurify before
  rendering in the iframe-isolated `MessageView`.

## Deployment

- Single Vercel project, App Router, no separate backend.
- Free tier: 100 GB-hours/month is enough for an assignment demo.
- Environment variables managed in Vercel dashboard (mirror `.env.example`).
- Preview deployments per branch; production = `main`.
