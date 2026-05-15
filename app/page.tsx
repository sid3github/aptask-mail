import Link from "next/link";
import { Sparkles, Mail, Shield, Smartphone, Zap, Inbox } from "lucide-react";
import { availableProviders } from "@/lib/auth/providers-available";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const providers = availableProviders();
  const hasReal = providers.some((p) => p !== "demo");
  return (
    <div className="min-h-svh bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
            <Sparkles size={16} />
          </span>
          <span className="text-base font-semibold tracking-tight">InboxIQ</span>
        </Link>
        <Link
          href={hasReal ? "/login" : "/inbox"}
          className="text-sm font-medium text-fg hover:text-accent"
        >
          {hasReal ? "Sign in" : "Try the demo"}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-8">
        <section className="py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
            <Sparkles size={12} className="text-accent" />
            AI-first email, built with Claude
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-6xl">
            Your inbox.{" "}
            <span className="text-accent">Triaged.</span>{" "}
            <span className="text-fg-muted">Summarized.</span>{" "}
            <span className="text-fg">Replied to.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-fg-muted sm:text-lg">
            InboxIQ is a mobile-first email client for Gmail, Outlook and any
            IMAP mailbox. Every email shows a one-line AI summary and a
            priority badge before you tap. Replies are one prompt away.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hasReal ? "/login" : "/inbox"}>
              <Button size="lg">
                <Mail size={16} />
                {hasReal ? "Sign in with email" : "Open the demo inbox"}
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </div>
        </section>

        <section id="features" className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Sparkles size={20} />}
            title="AI summaries on every email"
            body="A one-line summary above every subject. Read your inbox in half the time."
          />
          <Feature
            icon={<Zap size={20} />}
            title="Smart prioritization"
            body="Claude classifies every email into Urgent, Important, Newsletter, Promo, Other — so the noise stays at the bottom."
          />
          <Feature
            icon={<Inbox size={20} />}
            title="One unified inbox"
            body="Gmail, Outlook, Yahoo and AOL in a single list, merged by date with provider badges so you always know where mail came from."
          />
          <Feature
            icon={<Mail size={20} />}
            title="Drafts in three taps"
            body="Tell Claude what you want to say. Pick a tone. Send. No more blank reply windows."
          />
          <Feature
            icon={<Smartphone size={20} />}
            title="Installable PWA"
            body="Add it to your home screen and it behaves like a native app — offline cache included."
          />
          <Feature
            icon={<Shield size={20} />}
            title="Your tokens, your control"
            body="OAuth refresh tokens live only in an httpOnly cookie. IMAP passwords are AES-256-GCM encrypted at rest."
          />
        </section>

        <section className="border-t border-border py-10 text-center">
          <p className="text-xs text-fg-muted">
            Built for the aptask take-home with Claude Code. See{" "}
            <a className="underline" href="/architecture">
              /architecture
            </a>{" "}
            for the design.
          </p>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
