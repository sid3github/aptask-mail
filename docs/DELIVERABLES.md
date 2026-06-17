# InboxIQ — Deliverables

> AI-first universal email client (Gmail · Outlook · any IMAP) in one
> AI-triaged inbox. Built as a mobile-ready PWA with disciplined Claude Code.

**Live demo:** `https://aptask-assignment-mu.vercel.app` &nbsp;·&nbsp; **Source:** this repo &nbsp;·&nbsp; **Runs locally with zero setup** (boots straight into a demo inbox).

```bash
npm install && npm run dev      # → http://localhost:3000  (demo mode, no keys needed)
npm run check                   # lint + typecheck + 67 tests (the merge gate)
```

To connect real accounts, copy `.env.example` → `.env.local` and fill in
`AUTH_SECRET` + Google/Microsoft OAuth (and `IMAP_ENCRYPTION_KEY` for IMAP).

---

## Deliverables checklist

| # | Deliverable | Where |
|---|---|---|
| 1 | **Live Vercel URL** | `https://aptask-assignment-mu.vercel.app` |
| 2 | **CLAUDE.md** (agent operating manual) | [`/CLAUDE.md`](../CLAUDE.md) |
| 3 | **UI / UX** | §1 below |
| 4 | **Architecture** | §2 below · full: [`docs/architecture.md`](architecture.md) |
| 5 | **Claude Code discipline** | §3 below · full: [`docs/workflow.md`](workflow.md) |
| 6 | **Testing** | §4 below |

---

## 1 · UI / UX

**Product wedge — *read before you read it*.** The AI does the triage on every
message *before* you open it, so the inbox is scannable at a glance.

- **One unified inbox.** Gmail, Outlook (Graph) and IMAP merged by date, each
  row tagged with its source provider. Switching account/folder never changes
  the mental model.
- **AI on every row, inline.** A one-line summary + a priority badge
  (urgent / important / newsletter / promo / other) render *in the list* as it
  loads — no clicks, no side panels. Rows skeleton → fill as enrichment lands,
  cached so a row is only ever enriched once.
- **AI compose & reply.** "Write with AI" turns a short intent into a real,
  tone-aware email (formal / casual / short). "Draft reply" with no intent
  **reads the message you're replying to**, classifies it (meeting, question,
  request, announcement, …) and answers on-topic — every email gets a different,
  grounded reply, fully locally.
- **Calm, fast navigation.** A persistent app shell (sidebar/search never
  rebuild), instant per-tab loading spinners, and a global top progress bar make
  provider latency legible instead of frozen.
- **Safe reading.** Email HTML renders in a sandboxed, auto-height iframe with
  remote images blocked by default (no tracking pixels until you opt in).
- **Design system.** Warm editorial palette with one confident accent, a
  distinctive display serif (Fraunces) paired with a grotesque body (Hanken),
  automatic light + dark. The marketing landing is an expressive editorial
  "broadsheet"; the signed-in app stays deliberately utilitarian and quiet.
- **Mobile-ready PWA.** Installable, bottom tab-bar on phones, safe-area insets,
  ≥44px touch targets.
- **Accessible.** Keyboard focus rings on every control, `prefers-reduced-motion`
  honored, ARIA labels on icon buttons, AA-contrast tokens.

## 2 · Architecture

Next.js 16 App Router (Node runtime) on Vercel — no separate backend, no
database. The core is a **provider abstraction**: Gmail, Microsoft Graph and
IMAP each implement one `EmailProvider` interface, so the UI is written once
against a normalized `EmailMessage` and new providers slot in without UI
changes. The inbox is server-rendered (providers fetched in parallel,
`Promise.allSettled` so one bad account never blocks the rest) and the client
hydrates AI enrichment over it. The **AI engine is 100% local** (`lib/ai/*`) —
rule-based priority + extractive summaries + a template/NLG draft engine — so
there is no API key, no external LLM, and no per-message cost. Sessions are
encrypted JWT / cookie only (no DB). → **[Full diagram + request flows:
`docs/architecture.md`](architecture.md)**

## 3 · Claude Code discipline

Every feature ran the same loop: **spec → agent → code → check**.

- **Specs-first.** A short markdown spec (`docs/specs/`) defined purpose, API
  contract, edge cases and a test plan *before* code — catching scope cuts early.
- **Specialized subagents** (`.claude/agents/`) own a single area
  (provider / UI / AI / tests) so work is delegated to the right context.
- **Hooks as guardrails.** `post-edit.sh` formats on save; `pre-commit.sh` runs
  the full `npm run check` gate so nothing lands red.
- **Slash commands** `/spec` and `/check` encode the workflow.
- **Memory / session-handoff** keeps multi-session context coherent.

→ **[Full writeup: `docs/workflow.md`](workflow.md)** · operating manual:
[`CLAUDE.md`](../CLAUDE.md)

## 4 · Testing

- **67 tests across 14 files, all green.** Run with `npm test`; the full gate is
  `npm run check` (ESLint + `tsc --noEmit` + Vitest).
- **Unit (Vitest):** provider normalization (Gmail/Graph/IMAP), label filtering,
  HTML **sanitization / XSS**, MIME + recipient parsing, the **local AI engine**
  (priority, summarize, draft across tones — robust to phrasing variants),
  demo-data integrity, and components (EmailRow, EmailFrame, RichTextEditor,
  EmailListEnriched).
- **E2E (Playwright):** inbox render flow (`tests/e2e/inbox.spec.ts`).
- **Security:** a two-pass audit (route authz/IDOR/SSRF + email-XSS/credential
  handling) was run; findings and the fixes applied are summarized in the
  security section of [`docs/architecture.md`](architecture.md).

---

## Security posture (summary)

Fail-closed `/api/*` authorization gate (demo is an open sandbox; any real
provider requires auth — no `NODE_ENV` bypass) · AES-256-GCM-encrypted IMAP
creds in an httpOnly cookie · server-side DOMPurify **and** a no-`allow-scripts`
sandboxed iframe for email HTML · SSRF denylist covering cloud-metadata/RFC1918
· zod-validated, size-bounded request bodies · no secrets in the repo (`.env*`
gitignored; `.env.example` is placeholders-only).
