# 03 — Local AI engine (no external LLM)

**Status:** accepted

## Purpose
Make summaries, prioritization, draft replies and semantic-search query parsing
run **fully on-device/server with no external LLM and no API key**. The app must
deliver useful AI behavior with zero configuration and zero per-call cost. Claude
is removed entirely.

## User story
> As a user (or a grader) running the app with no secrets configured, I open the
> inbox and immediately see a one-line summary and a priority badge on every
> email, and I can generate a clean draft reply — without setting an
> `ANTHROPIC_API_KEY` or spending any credits.

## Approach
Replace the Claude calls in `lib/ai/{summarize,prioritize,draft,search}.ts` with
deterministic local logic, keeping each module's **exported names, zod schemas
and signatures unchanged** so the `/api/ai/*` routes change minimally.

- `prioritize` → rule-based classifier over `from` + `subject` + `snippet`:
  `urgent` (OTP / "action required" / "payment failed" / security), `promo`
  (sale / % off / `no-reply` marketing senders), `newsletter` (digest / weekly /
  unsubscribe), `important` (named human sender or business keywords:
  invoice / meeting / contract / review), else `other`. Returns a short reason.
- `summarize` → extractive: clean greeting/footer/URL noise, take the first
  substantive sentence of `body || snippet`, fall back to `subject`, trim to
  ≤140 chars. Never begins with "This email…".
- `generateDraft` → tone-aware template (`formal` / `casual` / `short`):
  greeting from the recipient's first name, the user's intent as a proper
  sentence, tone-appropriate sign-off.
- `rewriteQuery` → local keyword extraction (stopword-filtered tokens →
  `subjectKeywords`/`bodyKeywords`, `from X` → `fromContains`, raw text →
  `semanticHint`).

## API contract
Routes keep their existing request/response shapes; only the engine changes.
- `POST /api/ai/enrich-batch` → `{ results: Record<id, { summary, priority, priorityReason }> }`
  for every item (no more `{ unavailable: true }` markers — AI is always on).
- `POST /api/ai/summarize` → `{ summary: string }`
- `POST /api/ai/prioritize` → `{ priority, reason }`
- `POST /api/ai/draft` → `{ body: string, tone }`
- `POST /api/ai/search` → existing shape (local query parse)
- All routes keep the `isAuthorized()` session/IMAP/dev gate (now to prevent
  anonymous compute abuse, not billing). The `hasAnthropicKey()` branches are
  removed.

## Removed
- `lib/ai/anthropic.ts`, `lib/ai/prompts.ts`, `@anthropic-ai/sdk` dependency,
  `tests/unit/ai/prompts.test.ts`. Docs (`CLAUDE.md`, `docs/architecture.md`)
  updated so the AI claims match the local implementation; `ANTHROPIC_API_KEY`
  becomes unused.

## Edge cases
- Empty/whitespace snippet → summary falls back to subject; never empty.
- Very long body → clamp before processing.
- OTP/verification emails → `urgent` (security), not `promo`.
- `no-reply` sender with a sale word → `promo`; with a digest word → `newsletter`.
- Draft with no prior message (compose-from-scratch, Phase 2) → greeting "there".
- Draft intent is injected verbatim as the body's core — it is the user's own
  words, but is still sanitized when sent (outgoing HTML, Phase 2).

## Test plan (Vitest, TDD)
- `prioritize`: urgent (OTP, "payment failed"), promo ("50% off", no-reply),
  newsletter ("weekly digest"), important (named human + "invoice"), other.
- `summarize`: strips "Dear Customer," greeting; first-sentence extraction;
  subject fallback on empty snippet; ≤140 chars; never starts with "This email".
- `generateDraft`: each tone produces greeting + intent + sign-off; intent text
  is present; short tone is terse.
- Routes: `enrich-batch` returns real summary+priority for every id with no key
  set (no `unavailable`).
