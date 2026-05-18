import Link from "next/link";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import { availableProviders } from "@/lib/auth/providers-available";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const providers = availableProviders();
  const hasReal = providers.some((p) => p !== "demo");

  return (
    <div className="min-h-svh bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white">
            <Sparkles size={14} />
          </span>
          <span className="text-sm font-medium tracking-tight">InboxIQ</span>
        </Link>
        <Link
          href={hasReal ? "/login" : "/inbox"}
          className="text-sm text-fg-muted transition-colors hover:text-fg"
        >
          {hasReal ? "Sign in" : "Open demo"}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 sm:px-8">
        <section className="pb-12 pt-16 sm:pt-28">
          <h1 className="text-4xl font-medium leading-[1.1] tracking-tight text-fg sm:text-6xl">
            Email,{" "}
            <span className="text-fg-muted">triaged for you</span>
            <span className="text-accent">.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base text-fg-muted sm:text-lg">
            A unified inbox for Gmail, Outlook and any IMAP mailbox. Every
            message arrives with a one-line summary and a priority — read it,
            reply with one prompt, move on.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href={hasReal ? "/login" : "/inbox"}>
              <Button size="lg">
                <Mail size={16} />
                {hasReal ? "Sign in" : "Open the demo"}
                <ArrowRight size={14} />
              </Button>
            </Link>
            <a
              href="https://github.com/sid3github/aptask-mail"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-fg-muted hover:text-fg"
            >
              View on GitHub →
            </a>
          </div>
        </section>

        <section className="grid gap-x-10 gap-y-8 border-t border-border py-12 sm:grid-cols-3 sm:py-16">
          <Feature
            title="AI on every row"
            body="Summaries and priority labels render inline. No clicks, no spinners — just calmer mail."
          />
          <Feature
            title="One unified inbox"
            body="Gmail, Outlook, Yahoo and AOL merged by date. Provider stays out of the way."
          />
          <Feature
            title="Drafts in three taps"
            body="Tell Claude what you want to say, pick a tone, send. No more blank reply windows."
          />
        </section>

        <footer className="border-t border-border py-8 text-xs text-fg-muted">
          Built with Claude Code for the aptask take-home.{" "}
          <Link href="/architecture" className="underline-offset-2 hover:underline">
            Architecture
          </Link>
          {" · "}
          <a
            href="https://github.com/sid3github/aptask-mail"
            className="underline-offset-2 hover:underline"
          >
            Source
          </a>
        </footer>
      </main>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
