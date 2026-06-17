import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Scopes we request. Keep minimal until features need more.
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

const MS_SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "User.Read",
].join(" ");

function buildProviders() {
  const providers: NextAuthConfig["providers"] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: GOOGLE_SCOPES,
            access_type: "offline",
            prompt: "consent",
          },
        },
      }),
    );
  }

  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID ?? "common"}/v2.0`,
        authorization: { params: { scope: MS_SCOPES } },
      }),
    );
  }

  return providers;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    error?: string;
  }
}

async function refreshGoogleToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!r.ok) throw new Error(`google refresh failed ${r.status}`);
  return r.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string }>;
}

async function refreshMicrosoftToken(refreshToken: string) {
  const tenant = process.env.AZURE_AD_TENANT_ID || "common";
  const params = new URLSearchParams({
    client_id: process.env.AZURE_AD_CLIENT_ID!,
    client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "offline_access Mail.Read Mail.ReadWrite Mail.Send User.Read",
  });
  const r = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    },
  );
  if (!r.ok) throw new Error(`microsoft refresh failed ${r.status}`);
  return r.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string }>;
}

type AppJWT = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  provider?: string;
  error?: string;
  [k: string]: unknown;
};

export const authConfig: NextAuthConfig = {
  providers: buildProviders(),
  // A real AUTH_SECRET is required in production. In development we fall back to
  // a fixed throwaway value so a fresh clone runs demo mode out of the box
  // (`npm run dev` with no .env.local) without Auth.js MissingSecret errors —
  // it only signs an anonymous, provider-less session cookie.
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "inboxiq-dev-only-insecure-secret-change-in-prod"
      : undefined),
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      const t = token as AppJWT;
      // Initial sign-in
      if (account) {
        t.accessToken = account.access_token;
        t.refreshToken = account.refresh_token;
        t.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
        t.provider = account.provider;
        return t;
      }
      // Not expired or no expiry → return as-is
      if (!t.accessTokenExpires || Date.now() < t.accessTokenExpires - 60_000) {
        return t;
      }
      // Refresh
      try {
        if (t.provider === "google" && t.refreshToken) {
          const r = await refreshGoogleToken(t.refreshToken);
          t.accessToken = r.access_token;
          t.accessTokenExpires = Date.now() + r.expires_in * 1000;
          if (r.refresh_token) t.refreshToken = r.refresh_token;
          t.error = undefined;
        } else if (t.provider === "microsoft-entra-id" && t.refreshToken) {
          const r = await refreshMicrosoftToken(t.refreshToken);
          t.accessToken = r.access_token;
          t.accessTokenExpires = Date.now() + r.expires_in * 1000;
          if (r.refresh_token) t.refreshToken = r.refresh_token;
          t.error = undefined;
        }
      } catch {
        t.error = "RefreshAccessTokenError";
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      session.accessToken = t.accessToken;
      session.provider = t.provider;
      session.error = t.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
