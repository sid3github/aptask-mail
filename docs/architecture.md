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
│   │   server-rendered HTML  +  fetch()  +  localStorage AI cache  │    │
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

1. User opens `/inbox`. The page is a server component (`dynamic =
   "force-dynamic"`) that calls `loadInbox(limit, label)` in `lib/email/load.ts`.
2. `resolveProviders()` reads the request's signed-in state — the Auth.js
   session (Google or Microsoft) and/or the encrypted IMAP cookie — and builds
   one `EmailProvider` per linked account. If none are configured it falls back
   to the bundled demo mailbox.
3. `loadInbox` calls `provider.listMessages({ limit, label })` on every
   provider in parallel (`Promise.allSettled`, so one failing account never
   blocks the others), normalizes each to `EmailMessage[]`, and merges them
   by date. The merged list is server-rendered into the initial HTML — there
   is **no** per-account `/api/email/list` fetch on first paint.
4. The client component `EmailListEnriched` hydrates over that HTML. For any
   message lacking an `ai` block, it POSTs a batch to `/api/ai/enrich-batch`;
   results patch the rows in place (skeleton → summary + priority badge).
5. AI verdicts are cached in **`localStorage`** (`inboxiq:ai-cache:v2`) keyed by
   message id, plus an in-memory session map, so each message is enriched at
   most once per session and folder switches never re-trigger a shimmer.
   Messages themselves are **not** cached client-side — there is no IndexedDB.
6. "Load more" calls `/api/email/list?limit=…&label=…` for a larger page; the
   same loader runs server-side and the new rows go through the cache + enrich
   path above.

## Request flow: "summarize + prioritize a row"

1. `EmailListEnriched` posts `{ items: [{ id, from, subject, snippet }, …] }`
   (≤25 per batch) to `/api/ai/enrich-batch`.
2. The route validates with zod. With no `ANTHROPIC_API_KEY` it returns
   `{ unavailable: true }` markers and the UI degrades cleanly — the row simply
   renders without an AI card, never a fake summary or an error string.
3. With a key, each item runs `summarize()` and `prioritize()` in parallel
   (Claude Haiku 4.5, **cached system prompt** via `cache_control: ephemeral`).
   Output is zod-validated; any per-item failure (rate limit, billing) is
   swallowed into an `unavailable` marker, never surfaced to the client.
4. Real summaries are written to `localStorage`; subsequent loads of the same
   message read the cached verdict instead of calling the API again.

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
- OAuth access/refresh tokens stored inside the JWT, never exposed to the client.
- IMAP credentials (host, port, user, password, SMTP info) are AES-256-GCM
  encrypted with `IMAP_ENCRYPTION_KEY` and kept in an **httpOnly cookie**
  (`iq_imap`), decrypted server-side per request in `lib/auth/imap-session.ts`.
  There is no database or Vercel KV — the encrypted cookie *is* the store.
- Every API route validates input with `zod` before touching a provider.
- Email HTML bodies are sanitized server-side with DOMPurify
  (`lib/email/providers/sanitize.ts`, jsdom-backed) at the provider
  normalize boundary, where scripts, inline event handlers and other XSS
  vectors are stripped. `MessageView` then renders that already-sanitized
  HTML via `dangerouslySetInnerHTML` inside a contained, light-background
  "letter" card (not an iframe) so it looks intentional on any app theme.

## Deployment

- Single Vercel project, App Router, no separate backend.
- Free tier: 100 GB-hours/month is enough for an assignment demo.
- Environment variables managed in Vercel dashboard (mirror `.env.example`).
- Preview deployments per branch; production = `main`.
