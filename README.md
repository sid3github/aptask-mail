# InboxIQ

> AI-first universal email client. Built as a mobile-ready PWA with Claude
> Code. Submission for the aptask take-home assignment.

**[Live demo →](https://inboxiq.vercel.app)** *(URL filled in after deploy)*

InboxIQ unifies Gmail, Outlook (Microsoft Graph) and any IMAP mailbox into a
single AI-triaged inbox. Every message ships with a one-line summary, a
priority label, and one-tap AI-generated reply drafts.

---

## Why this exists

The assignment asks for a universal email client that demonstrates AI-first
thinking and disciplined use of Claude Code. The product wedge: **let the AI
do the triage for you, on every email, before you read it.**

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router on Node runtime |
| Language | TypeScript strict mode |
| Styling | Tailwind v4 + custom CSS variables |
| Auth | Auth.js v5 (next-auth beta) — Google & Microsoft providers |
| AI | Anthropic Claude (Haiku 4.5 + Sonnet 4.6) with prompt caching |
| Email | `googleapis`, `@microsoft/microsoft-graph-client`, `imapflow` + `nodemailer` |
| PWA | Serwist service worker, manifest, installable |
| Tests | Vitest (unit) + Playwright (E2E) |
| Deploy | Vercel (free tier) |

See [docs/architecture.md](docs/architecture.md) for the one-page diagram.

---

## Quick start

```bash
# 1) install
npm install --legacy-peer-deps

# 2) configure
cp .env.example .env.local
# fill in at least: AUTH_SECRET, ANTHROPIC_API_KEY, and one provider
#   (Google or Microsoft) — see .claude/skills/oauth-provider-setup.md

# 3) run
npm run dev        # http://localhost:3000

# 4) verify
npm run check      # lint + typecheck + tests
```

If you start the app with no providers configured, it falls back to a
**demo inbox** with 8 realistic messages so the UI and AI features are
explorable without any setup.

---

## Repo layout

```
app/                 Next.js routes + API
components/          UI components (email, AI, layout, primitives)
lib/
  email/providers/   gmail.ts, graph.ts, imap.ts — share an EmailProvider iface
  email/demo-data.ts Demo mailbox for the no-setup path
  ai/                Claude prompts + per-feature wrappers (summarize, draft…)
  auth/              Auth.js config + token refresh
  utils/             cn, dates
docs/
  architecture.md    one-page architecture doc (assignment deliverable #3)
  workflow.md        how Claude Code was used (deliverable #5)
  specs/             one short spec per feature (deliverable #4 inputs)
.claude/
  agents/            email-provider-expert, ui-designer, ai-prompt-engineer, test-writer
  skills/            spec-template, oauth-provider-setup, session-handoff
  hooks/             pre-commit, post-edit
  commands/          /spec, /check
  settings.json      hook wiring + permission allowlist
tests/
  unit/              Vitest specs
  e2e/               Playwright smoke
public/              manifest, icons, sw.js (generated)
```

---

## AI features in detail

| Feature | Model | Cached prompt? | Where it appears |
|---|---|---|---|
| One-line summary | Haiku 4.5 | yes | Below every subject in the list |
| Priority label | Haiku 4.5 | yes | Badge on every row + message header |
| Reply draft | Sonnet 4.6 | yes | Drawer on the message view |
| Semantic search rewrite | Haiku 4.5 | yes | Top-of-inbox search bar |

All prompts use `cache_control: { type: "ephemeral" }` so repeat calls amortize
the system tokens. Output is always validated with `zod`; on parse failure the
UI falls back to no-AI rendering.

---

## Claude Code workflow

This repo was built using Claude Code with the following process:

1. **CLAUDE.md** is the source of truth. It's loaded on every session.
2. Each feature gets a **spec** in `docs/specs/` *before* any code.
3. Implementation runs through specialized **subagents** in `.claude/agents/`.
4. **Hooks** in `.claude/hooks/` enforce style + tests on every save and commit.
5. Slash commands (`/spec`, `/check`) standardize repetitive steps.
6. **Session handoff** memory keeps multi-session state coherent.

Full writeup: [docs/workflow.md](docs/workflow.md).

---

## Security model

- OAuth refresh tokens stored only inside the Auth.js JWT cookie (httpOnly, secure, sameSite=lax).
- IMAP credentials are AES-256-GCM encrypted at rest with `IMAP_ENCRYPTION_KEY`.
- Every API route validates input with `zod`.
- Email HTML bodies are sanitized before rendering.
- No secrets are committed to the repo. `.env.example` documents the contract.

---

## Deploying to Vercel

```bash
# 1) push to GitHub
gh repo create inboxiq --public --source . --push

# 2) link to Vercel
npx vercel@latest --confirm    # follow prompts
npx vercel@latest --prod

# 3) set env vars in the Vercel dashboard (same names as .env.example)
```

Once live, update the **Authorized redirect URIs** in:
- Google Cloud Console → OAuth client → add `https://<your-url>/api/auth/callback/google`
- Azure App Registration → Authentication → add `https://<your-url>/api/auth/callback/microsoft-entra-id`

---

## License

MIT.
