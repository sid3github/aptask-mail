import Link from "next/link";
import { Sparkles, ArrowRight, Star, Paperclip } from "lucide-react";
import { availableProviders } from "@/lib/auth/providers-available";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const providers = availableProviders();
  const hasReal = providers.some((p) => p !== "demo");
  const cta = hasReal ? "/login" : "/inbox";
  const ctaLabel = hasReal ? "Sign in" : "Open the demo";

  return (
    <div className="relative min-h-svh overflow-hidden bg-bg">
      {/* soft atmospheric wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)",
        }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
            <Sparkles size={15} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            InboxIQ
          </span>
        </Link>
        <Link
          href={cta}
          className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          {ctaLabel} →
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 sm:px-10">
        <section className="grid items-center gap-12 py-12 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Left: editorial hero */}
          <div>
            <span className="fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              AI-first email · built with Claude Code
            </span>

            <h1
              className="fade-up mt-6 font-display text-[44px] font-semibold leading-[1.02] tracking-tight text-fg sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Your inbox,
              <br />
              <span className="italic text-accent">read before</span> you
              <br className="hidden sm:block" /> read it.
            </h1>

            <p
              className="fade-up mt-6 max-w-md text-base leading-relaxed text-fg-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              One unified inbox for Gmail, Outlook and any IMAP mailbox. Every
              message arrives with a one-line summary and a priority — so you
              skim less and decide faster.
            </p>

            <div
              className="fade-up mt-9 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "180ms" }}
            >
              <Link href={cta}>
                <Button size="lg">
                  {ctaLabel}
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <a
                href="https://github.com/sid3github/aptask-mail"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
              >
                View source →
              </a>
            </div>

            <dl
              className="fade-up mt-12 flex gap-10 border-t border-border pt-6"
              style={{ animationDelay: "240ms" }}
            >
              {[
                ["3", "providers, one inbox"],
                ["1-line", "AI summary per email"],
                ["5", "priority levels"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-semibold text-fg">
                    {n}
                  </dt>
                  <dd className="mt-0.5 text-xs text-fg-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: inbox preview */}
          <div
            className="fade-up relative"
            style={{ animationDelay: "200ms" }}
          >
            <InboxPreview />
          </div>
        </section>

        <section className="grid gap-x-12 gap-y-10 border-t border-border py-16 sm:grid-cols-3">
          <Feature
            title="AI on every row"
            body="Summaries and priority labels render inline as the list loads — no clicks, no panels to open."
          />
          <Feature
            title="One unified inbox"
            body="Gmail, Outlook, Yahoo and AOL merged by date. The provider stays out of your way."
          />
          <Feature
            title="Drafts in three taps"
            body="Tell Claude what to say, pick a tone, send. The blank reply window is gone."
          />
        </section>

        <footer className="flex flex-col gap-2 border-t border-border py-8 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Built with Claude Code for the aptask take-home.</span>
          <span className="flex gap-4">
            <a
              href="https://github.com/sid3github/aptask-mail/blob/main/docs/architecture.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg"
            >
              Architecture
            </a>
            <a
              href="https://github.com/sid3github/aptask-mail"
              className="hover:text-fg"
            >
              Source
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

/* A faithful, static preview of the product's signature surface. */
function InboxPreview() {
  const rows = [
    {
      initials: "SC",
      from: "Sarah Chen",
      time: "9:24",
      subject: "Design review tomorrow at 2pm",
      summary: "Sarah wants you at tomorrow's 2pm design review.",
      tone: "important" as const,
      label: "Important",
      unread: true,
      star: false,
      attach: false,
    },
    {
      initials: "AW",
      from: "AWS Billing",
      time: "8:50",
      subject: "Payment failed — action required",
      summary: "AWS payment failed — fix in 24h to avoid suspension.",
      tone: "urgent" as const,
      label: "Urgent",
      unread: true,
      star: false,
      attach: false,
    },
    {
      initials: "GH",
      from: "GitHub",
      time: "7:10",
      subject: "@bob requested your review on #423",
      summary: "Bob asked for your review on PR #423 (OAuth callback).",
      tone: "important" as const,
      label: "Important",
      unread: false,
      star: true,
      attach: false,
    },
    {
      initials: "ST",
      from: "Stripe",
      time: "Tue",
      subject: "Your monthly invoice is ready",
      summary: "Stripe monthly invoice $42.18 (PDF attached).",
      tone: "other" as const,
      label: "Other",
      unread: false,
      star: false,
      attach: true,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-30px_rgb(var(--shadow-color)/0.35)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-fg text-bg">
          <Sparkles size={12} />
        </span>
        <span className="font-display text-sm font-semibold">Inbox</span>
        <span className="ml-auto flex gap-1">
          <i className="h-2 w-2 rounded-full bg-border-strong" />
          <i className="h-2 w-2 rounded-full bg-border-strong" />
          <i className="h-2 w-2 rounded-full bg-border-strong" />
        </span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li
            key={r.from}
            className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-0"
            style={{ background: r.unread ? "transparent" : "transparent" }}
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                r.unread
                  ? "bg-accent-soft text-accent"
                  : "bg-surface-2 text-fg-muted"
              }`}
            >
              {r.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`truncate text-[13px] ${
                    r.unread ? "font-semibold text-fg" : "text-fg-muted"
                  }`}
                >
                  {r.from}
                </span>
                {r.star && (
                  <Star size={10} className="shrink-0 fill-amber text-amber" />
                )}
                {r.attach && (
                  <Paperclip size={10} className="shrink-0 text-fg-subtle" />
                )}
                <span className="ml-auto shrink-0 text-[10px] text-fg-subtle">
                  {r.time}
                </span>
              </div>
              <div
                className={`mt-0.5 truncate text-[13px] ${
                  r.unread ? "text-fg" : "text-fg-muted"
                }`}
              >
                {r.subject}
              </div>
              <div className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-fg-muted">
                <Sparkles size={10} className="mt-0.5 shrink-0 text-accent" />
                <span className="line-clamp-1">{r.summary}</span>
              </div>
              <span
                className={`mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  r.tone === "urgent"
                    ? "bg-danger/10 text-danger"
                    : r.tone === "important"
                      ? "bg-accent/10 text-accent"
                      : "bg-fg-muted/10 text-fg-subtle"
                }`}
                style={{ animationDelay: `${300 + i * 60}ms` }}
              >
                {r.label}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
