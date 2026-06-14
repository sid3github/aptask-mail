import Link from "next/link";
import { Sparkles, Mail, Server } from "lucide-react";
import { availableProviders } from "@/lib/auth/providers-available";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/config";

export default function LoginPage() {
  const providers = availableProviders();
  const hasGoogle = providers.includes("google");
  const hasMicrosoft = providers.includes("microsoft");
  const hasImap = providers.includes("imap");
  const noProvider = !hasGoogle && !hasMicrosoft && !hasImap;

  async function signInGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/inbox" });
  }
  async function signInMicrosoft() {
    "use server";
    await signIn("microsoft-entra-id", { redirectTo: "/inbox" });
  }

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-bg px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[360px] opacity-70"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, color-mix(in oklab, var(--accent) 13%, transparent), transparent 70%)",
        }}
      />
      <div className="fade-up relative w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
            <Sparkles size={15} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            InboxIQ
          </span>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Connect an account to open your AI-triaged inbox.
        </p>

        <div className="mt-8 grid gap-3">
          {hasGoogle && (
            <form action={signInGoogle}>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full justify-start"
              >
                <GoogleLogo /> Continue with Google
              </Button>
            </form>
          )}
          {hasMicrosoft && (
            <form action={signInMicrosoft}>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full justify-start"
              >
                <MicrosoftLogo /> Continue with Microsoft
              </Button>
            </form>
          )}
          {hasImap && (
            <Link href="/login/imap">
              <Button
                size="lg"
                variant="secondary"
                className="w-full justify-start"
              >
                <Server size={16} className="text-fg-muted" /> Continue with IMAP
              </Button>
            </Link>
          )}
        </div>

        {noProvider && (
          <div className="mt-6 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm">
            <div className="font-semibold text-amber">No providers configured</div>
            <p className="mt-1 text-fg-muted">
              Set <code className="text-fg">GOOGLE_CLIENT_ID</code> /{" "}
              <code className="text-fg">AZURE_AD_CLIENT_ID</code> /{" "}
              <code className="text-fg">IMAP_ENCRYPTION_KEY</code> to enable
              sign-in.
            </p>
            <Link
              href="/inbox"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber"
            >
              <Mail size={12} /> Skip — open the demo inbox
            </Link>
          </div>
        )}

        <p className="mt-8 text-xs leading-relaxed text-fg-subtle">
          You authorize InboxIQ to read, send, and modify mail via OAuth scopes.
          Revoke anytime from your provider&apos;s settings.
        </p>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.6 35.5 12.5 30.4 12.5 24S17.6 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.9 0 19.5-7.9 19.5-19 0-1.3-.1-2.6-.4-4z" />
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.7 19 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.1z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 34.7 26.7 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 38.9 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.5-4.5 5.8l6.2 5.2c-.4.4 6.9-5 6.9-15 0-1.3-.1-2.6-.3-4z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}
