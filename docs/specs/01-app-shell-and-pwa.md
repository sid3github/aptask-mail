# 01 — App Shell & PWA

**Status:** accepted
**Owner:** ui-designer

## Purpose
Stand up the visual shell of the application: navigation, layout, PWA
installability. Everything else (providers, AI) plugs into this shell.

## User story
"As a user opening InboxIQ for the first time, I see a polished login screen
that explains what the product does, with a clear call to action to sign in
with my email provider."

## UX
- Landing/login at `/`. Hero, three provider buttons (Gmail / Outlook / IMAP),
  short feature bullets, footer.
- App at `/inbox`. AppShell = top bar (account switcher + search) +
  scrollable list + bottom nav (Inbox / Starred / Sent / Compose).
- Bottom nav is mobile-only; replaced by side rail at `md:`+.
- Dark mode by default, light mode toggle stored in `localStorage`.
- Installable: manifest, icons, theme color, viewport-fit cover.

## API contract
None — purely client.

## Provider implications
None directly. AppShell consumes `useAccounts()` which currently returns
`[]` and is wired up in phase 1.

## AI implications
None.

## Edge cases
- No accounts linked → AppShell renders an "Add an account" empty state.
- Offline → Serwist serves the cached shell; inbox shows cached messages.

## Test plan
- [x] Vitest: AppShell renders nav, no providers configured shows setup CTA.
- [x] Vitest: Login page renders three provider buttons.
- [ ] Playwright: cold visit to `/` shows login.

## Out of scope
- Notification permissions (Phase 4+).
- Account management page (Phase 1).
