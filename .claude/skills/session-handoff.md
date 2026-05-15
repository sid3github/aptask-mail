---
name: session-handoff
description: Use at the end of every session to write/update the project handoff memory so the next session has full context. Also use at the start of every session to read the handoff before doing anything else.
---

# Session Handoff

## At the start of every session

1. Read `~/.claude/projects/-Users-siddharthpadwal-Documents-sid-aptask-assignment/memory/session_handoff_current.md`.
2. If it exists: summarize current state in 2-3 sentences for the user and
   propose next step.
3. If it does not exist: this is session 1; do project context gathering
   (read CLAUDE.md, list specs, check git log).

## At the end of every session

Write `session_handoff_current.md` (overwrite) with:

```markdown
---
name: session handoff (current)
description: Live state for next session — current phase, next task, env, blockers
type: project
last_updated: <YYYY-MM-DD HH:MM>
---

## Phase
Phase <n>: <name>

## Last completed
- <bullet>

## In progress (mid-step)
- <bullet, or "none">

## Next task
<one paragraph>

## Files touched this session
- <path>
- <path>

## Decisions made
- <bullet>

## Env / credential state
- AUTH_SECRET: set | unset
- ANTHROPIC_API_KEY: set | unset
- GOOGLE_CLIENT_ID: set | unset
- AZURE_AD_CLIENT_ID: set | unset
- IMAP_ENCRYPTION_KEY: set | unset
- Deployed URL: <url or "not yet">

## Blockers
- <bullet, or "none">

## Open questions for user
- <bullet, or "none">
```

Also append a dated snapshot to `session_YYYY-MM-DD_summary.md` if
significant work happened.
