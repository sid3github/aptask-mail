# Spec 02 — Provider label filtering (sidebar folders)

## Purpose

The unified inbox sidebar exposes three folders: **Inbox**, **Starred**, and
**Sent**. Selecting one calls `loadInbox(limit, label)` →
`provider.listMessages({ limit, label })` for every connected provider with
`label ∈ {"INBOX", "STARRED", "SENT"}`.

Each provider MUST honor `opts.label` and return only messages for that folder.
A provider that cannot serve a given label MUST return `{ items: [] }` — it must
**never** fall back to the INBOX. (Bug: previously Graph and IMAP always returned
the inbox, so every sidebar folder showed inbox content.)

## User story

As a user with Gmail / Outlook / IMAP accounts connected, when I click
**Starred** or **Sent** in the sidebar, I see only starred or sent messages,
not my inbox.

## Contract

`listMessages(opts: ListOptions): Promise<ListResult>` where the only
sidebar-relevant labels are `INBOX`, `SENT`, `STARRED`. Default label (none
provided) is `INBOX`. Pagination shape `{ items, nextCursor? }` is preserved.

### Gmail (`lib/email/providers/gmail.ts`)
- INBOX / STARRED / SENT are valid Gmail system labels, passed directly as
  `labelIds: [label]`. Default is `INBOX`. No change required; verified by test.

### Microsoft Graph (`lib/email/providers/graph.ts`)
- INBOX → `/me/mailFolders/inbox/messages`
- SENT → `/me/mailFolders/sentitems/messages`
- STARRED → inbox folder + `$filter=flag/flagStatus eq 'flagged'`.
  Graph rejects combining `$search` with `$filter`, so STARRED skips free-text
  search and prefers the filter.
- Any other label → `{ items: [] }` (no network call).

### IMAP (`lib/email/providers/imap.ts`)
- INBOX → open `"INBOX"` (existing sequence-paged behavior).
- SENT → open the first mailbox that exists from, in order:
  `"Sent"`, `"Sent Messages"`, `"[Gmail]/Sent Mail"`, `"Sent Items"`.
  If none open → `{ items: [] }`.
- STARRED → in INBOX, `search({ flagged: true }, { uid: true })`, fetch those
  UIDs (capped to `limit`), newest first.
- Any other label → `{ items: [] }` (no connection opened).

## Edge cases

- Unservable label (e.g. `DRAFT`, `ARCHIVE`, `custom:*`): empty result, never
  inbox. Graph/IMAP avoid any network/connection work in this case.
- IMAP SENT mailbox absent on the server (e.g. some providers): empty, not inbox.
- Empty STARRED / empty mailbox: `{ items: [] }`.
- Existing `TokenExpiredError` / `ProviderError` handling and normalization
  helpers are unchanged.

## Test plan

`tests/unit/providers/list-labels.test.ts` (mocked SDKs):
- Gmail: default → `labelIds:["INBOX"]`; INBOX/STARRED/SENT pass through.
- Graph: INBOX→inbox, SENT→sentitems, STARRED→inbox+flagged filter, other→empty
  with no API call.
- IMAP: INBOX opens INBOX; SENT walks candidate names and uses the first that
  opens; SENT with no mailbox → empty; STARRED searches flagged in INBOX; other
  label → empty with no connection.
