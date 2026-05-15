---
name: spec-template
description: Use when starting a new feature spec in docs/specs/. Provides the canonical short-spec format used throughout InboxIQ.
---

# Spec Template

When the user asks for a new feature, copy this skeleton into
`docs/specs/<slug>.md` BEFORE writing any implementation code:

```markdown
# <Feature name>

**Status:** draft | accepted | shipped
**Owner:** <agent name>
**Depends on:** <other spec slugs or "none">

## Purpose
One paragraph. What problem does this solve? Why now?

## User story
"As a <role>, I want <action> so that <outcome>."

## UX
Sketch the screens or flows in 3-5 bullets. Reference Tailwind tokens
already in the design system. Note mobile vs desktop differences.

## API contract
| Endpoint | Method | Body | Returns |
|---|---|---|---|
| ... | ... | zod schema | zod schema |

## Provider implications
Which providers (Gmail / Graph / IMAP) need updates? Any quirks?

## AI implications
Does this feature touch lib/ai/? Which model? New prompt?

## Edge cases
- Empty state
- Error from provider
- Token expired
- Slow network
- Multiple accounts

## Test plan
- [ ] Unit: ...
- [ ] Unit: ...
- [ ] E2E: ... (only if it touches the golden path)

## Out of scope
List what this spec deliberately does NOT cover.
```

The spec is short. If it gets longer than 1 page, split it.
