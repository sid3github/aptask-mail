# CLAUDE.md — InboxIQ

> Universal AI-first email client. Built with Claude Code, multi-agent workflow,
> specs-driven development.

This file is loaded automatically by Claude Code at the start of every session.
It is the single source of truth for project conventions.

---

## 1. Mission

Build a **mobile-first PWA** that lets a user manage Gmail, Office 365 and
IMAP (Yahoo / AOL) accounts from a single unified inbox, with AI baked in for
summaries, smart reply drafts, prioritization and semantic search.

The product is called **InboxIQ**.

---

## 2. Non-negotiable principles

1. **Specs before code.** Every feature lives in `docs/specs/` before a line of
   implementation is written. If you can't point at a spec, you don't have
   permission to ship the code.
2. **AI is the experience, not a sidebar.** Summaries, prioritization and
   drafts must be visible in the primary email list, not hidden behind a
   "+ AI" button.
3. **Mobile first.** All layouts are designed at 375 px first, then scaled up.
4. **No secrets in the repo.** Use `.env.local` for local dev and Vercel env
   vars for production. `.env.example` is the contract.
5. **Provider abstraction.** All providers (Gmail / Graph / IMAP) implement
   the same `EmailProvider` interface in `lib/email/providers/types.ts`.
6. **Type-safe boundaries.** Every API route validates input with `zod`.
7. **Tests gate merges.** Vitest unit tests must pass; smoke E2E covers the
   inbox render path.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC + serverless API routes in one repo |
| Language | TypeScript strict | Type safety across provider boundary |
| Styling | Tailwind v4 + custom design tokens | Fast, mobile-first, low CSS payload |
| Auth | Auth.js v5 (next-auth beta) | Multi-provider OAuth out of the box |
| AI | Local engine — rule-based priority + extractive summaries + template drafts (`lib/ai/`) | Zero-cost, no API key, works offline; see `docs/specs/03-local-ai-engine.md` |
| Email APIs | `googleapis`, `@microsoft/microsoft-graph-client`, `imapflow` | Official SDKs |
| Storage (server) | Encrypted IMAP creds in Vercel KV (fallback to env for demo) | Keep secrets off disk |
| Storage (client) | IndexedDB via custom thin wrapper | Offline inbox cache |
| PWA | Serwist | Modern, type-safe service worker |
| Tests | Vitest + Playwright | Fast unit + smoke E2E |
| Deploy | Vercel | Required by assignment |

---

## 4. Repo layout

```
app/                   Next.js App Router pages and API routes
  (auth)/login         OAuth entry
  (app)/inbox          Unified inbox shell
  (app)/compose        Compose / reply / forward
  api/auth/[...nextauth]  Auth.js handler
  api/email/*          Provider-agnostic email endpoints
  api/ai/*             Local AI endpoints (summary, priority, draft, search)
components/
  ui/                  shadcn-style primitives
  email/               EmailRow, MessageView, ComposeForm, ProviderBadge
  ai/                  SummaryChip, PriorityBadge, DraftPanel
  layout/              AppShell, MobileNav, AccountSwitcher
lib/
  email/providers/     gmail.ts, graph.ts, imap.ts, types.ts
  email/normalize.ts   Provider response -> canonical EmailMessage
  ai/                  Local engine: prioritize, summarize, draft, search
  auth/                Auth.js config + token refresh
  db/                  IndexedDB wrapper (client) + KV wrapper (server)
docs/
  specs/               One markdown file per feature
  decisions/           ADR-style decision records
  architecture.md      The one-page architecture diagram + flow
  workflow.md          The "how we used Claude Code" writeup
.claude/
  agents/              Subagent definitions
  skills/              Reusable skill prompts
  hooks/               Pre-commit / pre-edit hooks
  commands/            Slash commands
tests/
  unit/                Vitest specs colocated by feature
  e2e/                 Playwright smoke tests
public/
  manifest.webmanifest, icons/   PWA installability
```

---

## 5. Canonical data model

All providers normalize to:

```ts
// lib/email/providers/types.ts
type EmailMessage = {
  id: string;              // provider-prefixed: "gmail:abc123"
  accountId: string;
  threadId: string;
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  cc?: { name?: string; email: string }[];
  subject: string;
  snippet: string;
  bodyHtml?: string;
  bodyText?: string;
  date: string;            // ISO 8601
  unread: boolean;
  starred: boolean;
  labels: string[];        // normalized: INBOX, SENT, ARCHIVE, TRASH, custom...
  hasAttachments: boolean;
  ai?: {
    summary?: string;       // 1-line, cached
    priority?: "urgent" | "important" | "newsletter" | "promo" | "other";
    priorityReason?: string;
  };
};
```

Providers translate their native models to/from this. UI **never** consumes
native provider types.

---

## 6. Workflow rules for Claude

1. **Start every session by reading the handoff memory.** Path:
   `~/.claude/projects/-Users-siddharthpadwal-Documents-sid-aptask-assignment/memory/session_handoff_current.md`.
   If it doesn't exist, this is session 1.
2. **End every session by writing/updating that handoff file.** Capture:
   current phase, last completed task, next task, files touched, decisions,
   env state, deploy URL, blockers.
3. **Before writing code for a new feature**, write or update its spec in
   `docs/specs/`. Specs are short — purpose, user story, API contract, edge
   cases, test plan.
4. **Use the right subagent.** See `.claude/agents/`:
   - `email-provider-expert` for anything in `lib/email/providers/*`
   - `ui-designer` for components in `components/`
   - `ai-prompt-engineer` for `lib/ai/*`
   - `test-writer` for adding test coverage
5. **Run lint + typecheck + tests before claiming a task is done.**
   `npm run check` runs all three.

---

## 7. Commands

```bash
npm run dev          # Next.js dev server on http://localhost:3000
npm run build        # Production build
npm run start        # Run production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest in CI mode
npm run test:watch   # Vitest watch
npm run test:e2e     # Playwright
npm run check        # lint + typecheck + test (the merge gate)
```

---

## 8. Environment variables

See `.env.example`. The app **must** start with no providers configured
(shows a setup screen). Each provider becomes available when its env vars
are set.

| Var | Required? | Purpose |
|---|---|---|
| `AUTH_SECRET` | yes | Auth.js session encryption |
| `NEXTAUTH_URL` | prod | Auth.js callback base URL |
| `GOOGLE_CLIENT_ID` / `_SECRET` | for Gmail | OAuth |
| `AZURE_AD_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | for O365 | OAuth |
| `IMAP_ENCRYPTION_KEY` | for IMAP | 32-byte AES key for credential storage |

---

## 9. Security baseline

- IMAP passwords are AES-256-GCM encrypted before persistence.
- OAuth refresh tokens are stored in Auth.js JWT cookie (httpOnly, secure).
- All API routes validate input with `zod`.
- HTML email bodies are sanitized server-side with DOMPurify before reaching
  the client.
- No `dangerouslySetInnerHTML` without DOMPurify.

---

## 10. What "done" means for this assignment

A deliverable is done when:

1. The spec exists in `docs/specs/`.
2. The code compiles and `npm run check` is green.
3. The feature is visibly working on the deployed Vercel URL.
4. There is at least one unit test covering the happy path.
5. The session handoff memory has been updated.
