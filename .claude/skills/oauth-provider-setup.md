---
name: oauth-provider-setup
description: Step-by-step instructions for creating Google Cloud / Azure / Yahoo OAuth credentials. Use when the user needs to wire up a new provider or hits an OAuth error.
---

# OAuth Provider Setup

## Google (Gmail)

1. https://console.cloud.google.com → create a project (or use existing).
2. APIs & Services → Library → enable **Gmail API**.
3. APIs & Services → OAuth consent screen:
   - User type: **External**, publishing status: **Testing**.
   - Scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `openid email profile`
   - Add the user's email under "Test users".
4. APIs & Services → Credentials → **Create OAuth client ID** → Web app.
   - Authorized redirect URI: `https://<deployed-host>/api/auth/callback/google`
     AND `http://localhost:3000/api/auth/callback/google` for dev.
5. Copy Client ID + Secret → set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Microsoft (Office 365 / Outlook)

1. https://entra.microsoft.com → App registrations → New registration.
   - Supported account types: **Accounts in any org directory and personal MS accounts**.
   - Redirect URI (Web): `https://<deployed-host>/api/auth/callback/microsoft-entra-id`
2. Certificates & secrets → New client secret → copy value.
3. API permissions → Add Microsoft Graph delegated:
   - `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`, `User.Read`.
   - Grant admin consent if you own the tenant.
4. Set `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID=common`.

## Yahoo (IMAP)

1. https://login.yahoo.com → Account Security → enable 2-step verification.
2. Generate an **app password** for "InboxIQ".
3. User enters: yahoo email + app password in InboxIQ "Add IMAP account".
4. Server uses `imap.mail.yahoo.com:993` (SSL) and `smtp.mail.yahoo.com:465`.

## AOL (IMAP)

1. https://login.aol.com → Account Security → generate app password.
2. Server: `imap.aol.com:993` and `smtp.aol.com:465`.
