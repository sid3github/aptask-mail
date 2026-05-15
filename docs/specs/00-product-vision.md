# 00 — Product Vision

**Status:** accepted

## Purpose
InboxIQ is an AI-first universal email client. The product wedge: **a unified
inbox across Gmail / Outlook / Yahoo / AOL where AI does the triage for you.**

## North-star user story
> As someone who runs two work emails and one personal email, I want to open
> one app on my phone, see all my mail in priority order with a one-line
> summary per email, and tap one button to send a draft reply.

## What we are NOT building
- Calendar, contacts, tasks, notes.
- Push notifications (Phase 1 cut — Vercel serverless can't hold IMAP IDLE).
- Real-time collaboration / shared inboxes.
- Encryption-at-rest of full email bodies — only IMAP credentials.

## Success criteria (assignment scope)
1. Deploy on Vercel and reach the inbox from a phone.
2. Sign in with Gmail end-to-end (real OAuth, real Gmail messages).
3. Read, reply, archive at least one real email.
4. See AI summary + priority badge on real emails.
5. Generate an AI draft and send it.
6. Show IMAP and O365 are wired (UI present, code path complete).

## Non-goals for this scope
- App Store distribution (PWA only).
- Multi-tenant / multi-user — single-user demo.
- Production-grade observability.
