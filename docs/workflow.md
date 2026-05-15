# How InboxIQ was built with Claude Code

> Short writeup of the multi-agent / specs-driven workflow that produced this
> codebase. Required deliverable #5 of the aptask assignment.

## The shape of the work

Every feature went through the same four-step loop:

```
   spec  →  agent  →  code  →  check
    ↑                              │
    └──────────────────────────────┘   (loop until check is green)
```

1. **Spec** — Before code, a short markdown file in `docs/specs/` defines
   purpose, user story, API contract, edge cases, test plan.
2. **Agent** — A specialized subagent (defined in `.claude/agents/`) writes
   or modifies the code for its area of responsibility.
3. **Code** — The agent produces changes. The `post-edit.sh` hook formats
   each file on save.
4. **Check** — `npm run check` (lint + typecheck + tests) is the merge gate.
   The `pre-commit.sh` hook enforces it before any commit lands.

## The agent roster

| Agent | Owns | Reads CLAUDE.md? | Triggered by |
|---|---|---|---|
| `email-provider-expert` | `lib/email/providers/*` | yes | Anything provider-shaped |
| `ui-designer` | `components/*`, `app/*` pages | yes | UI work |
| `ai-prompt-engineer` | `lib/ai/*`, `docs/specs/ai-*` | yes | Prompts, model choice |
| `test-writer` | `tests/**` | yes | Coverage gaps |

Each agent has a tight responsibility statement at the top of its definition
so Claude knows exactly when to delegate.

## Skills

`.claude/skills/` holds reusable expertise that any agent can pull in:

- **spec-template** — the canonical short-spec layout, copied for every new
  feature.
- **oauth-provider-setup** — the click-by-click instructions to create
  Google / Microsoft / Yahoo OAuth credentials, so an agent dropping into
  this work doesn't reinvent it.
- **session-handoff** — the protocol for writing a handoff snapshot to memory
  at the end of every session so the next session resumes with full context.

## Hooks

`.claude/hooks/post-edit.sh` runs after every Edit/Write — it lints the
single file. `.claude/hooks/pre-commit.sh` runs the full check before a
commit. Together they remove the "I forgot to run the tests" failure mode.

## Slash commands

- **`/spec <slug>`** — initializes a new spec from the template, before any
  implementation work begins.
- **`/check`** — runs the merge gate (`npm run check`), reports the first
  failure, proposes a fix, applies it, iterates.

## Memory & session handoff

A long take-home assignment can span multiple Claude Code sessions. To keep
context coherent, the project memory holds:

- `feedback_session_handoff.md` — the rule: write a snapshot at the end of
  every session.
- `project_aptask_assignment.md` — the full assignment brief.
- `session_handoff_current.md` — the live state (overwritten each session).
- `session_YYYY-MM-DD_summary.md` — dated snapshots for history.

This means session N+1 starts by reading the handoff and is productive in
seconds, not after re-reading the entire repo.

## What worked

- **Specs before code** caught at least three "we don't need that for this
  assignment" decisions before they became wasted hours.
- **The provider abstraction** let me write the UI against demo data and
  then plug Gmail in without touching components.
- **Cached system prompts** made the AI features cheap enough to run on
  every inbox row, which is what makes the AI feel "always on" rather than
  bolted on.

## What I'd do next given more time

- Add Vercel KV-backed summary cache so AI calls amortize across page loads.
- Implement IMAP IDLE in a long-running worker (not Vercel) for push delivery.
- Add per-account label sync UI.
- Wire up E2E coverage past the inbox render.
