import Link from "next/link";
import { Sparkles, ArrowRight, Star, Paperclip } from "lucide-react";
import { availableProviders } from "@/lib/auth/providers-available";
import { Button } from "@/components/ui/button";

// Subtle film grain — paper texture, no image asset.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

// Small-caps editorial label.
function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${className}`}>
      {children}
    </span>
  );
}

export default function HomePage() {
  const providers = availableProviders();
  const hasReal = providers.some((p) => p !== "demo");
  const cta = hasReal ? "/login" : "/inbox";
  const ctaLabel = hasReal ? "Sign in" : "Open the live demo";

  return (
    <div className="relative min-h-svh overflow-hidden bg-bg text-fg">
      {/* ── atmosphere ─────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute inset-x-0 -top-56 h-[620px] opacity-90"
        style={{
          background:
            "radial-gradient(46% 60% at 38% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%), radial-gradient(40% 56% at 72% 4%, color-mix(in oklab, var(--amber) 14%, transparent), transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: GRAIN }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--fg) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(72% 46% at 50% 0%, #000 0%, transparent 76%)",
          WebkitMaskImage: "radial-gradient(72% 46% at 50% 0%, #000 0%, transparent 76%)",
        }}
      />
      {/* oversized editorial watermark — the @ of email, set in the display serif */}
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -right-10 top-[34vh] select-none text-[34rem] italic leading-none text-fg opacity-[0.025] sm:-right-16"
      >
        @
      </span>

      {/* ── masthead ───────────────────────────────────────────────── */}
      <header className="relative border-b border-border/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
              <Sparkles size={15} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">InboxIQ</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-px w-6 bg-border-strong" />
            <Kicker className="text-fg-subtle">On-Device Edition · No. 01</Kicker>
            <span className="h-px w-6 bg-border-strong" />
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/sid3github/aptask-mail"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm font-medium text-fg-muted transition-colors hover:text-fg sm:inline"
            >
              Source
            </a>
            <Link
              href={cta}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-accent"
            >
              {ctaLabel}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 sm:px-10">
        {/* ── hero ─────────────────────────────────────────────────── */}
        <section className="grid items-center gap-y-16 py-12 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-14">
          {/* left column — the lead story */}
          <div className="lg:border-r lg:border-border lg:pr-14">
            <div className="fade-up flex items-center gap-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <Kicker className="text-amber">AI-first email — triaged on your machine</Kicker>
            </div>

            <h1 className="mt-7 font-display text-[clamp(3rem,7.4vw,5rem)] font-semibold leading-[0.96] tracking-[-0.035em] text-fg">
              <span className="fade-up block" style={{ animationDelay: "40ms" }}>
                Your inbox,
              </span>
              <span className="fade-up block" style={{ animationDelay: "120ms" }}>
                <em className="italic text-accent decoration-amber [text-decoration-line:underline] [text-decoration-thickness:2px] [text-underline-offset:9px]">
                  read
                </em>{" "}
                before
              </span>
              <span className="fade-up block" style={{ animationDelay: "200ms" }}>
                you read it.
              </span>
            </h1>

            <p
              className="fade-up mt-8 max-w-md text-[1.05rem] leading-relaxed text-fg-muted"
              style={{ animationDelay: "280ms" }}
            >
              Gmail, Outlook and any IMAP mailbox — merged into one quiet stream where every
              message arrives with a one-line summary and a priority.{" "}
              <span className="text-fg">Triaged on your machine. No API key, no cost.</span>
            </p>

            <div
              className="fade-up mt-9 flex flex-wrap items-center gap-5"
              style={{ animationDelay: "340ms" }}
            >
              <Link href={cta}>
                <Button size="lg" className="group">
                  {ctaLabel}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              {hasReal ? (
                <Link
                  href="/inbox"
                  className="text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  Open the live demo →
                </Link>
              ) : (
                <a
                  href="https://github.com/sid3github/aptask-mail"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  View source →
                </a>
              )}
            </div>

            {/* editorial stat byline — inline, hairline-ruled, not a boxed grid */}
            <dl
              className="fade-up mt-12 flex max-w-md items-stretch gap-6 border-t border-border pt-6"
              style={{ animationDelay: "400ms" }}
            >
              {[
                ["∞→1", "providers, one inbox"],
                ["$0", "AI cost · no key"],
                ["5", "priority levels"],
              ].map(([n, label], i) => (
                <div key={label} className={i > 0 ? "border-l border-border pl-6" : ""}>
                  <dt className="font-display text-2xl font-semibold tracking-tight text-fg [font-variant-numeric:tabular-nums]">
                    {n}
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.12em] text-fg-subtle">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* right column — the signature surface, framed as a figure plate */}
          <div className="fade-up relative" style={{ animationDelay: "240ms" }}>
            <div className="mb-3 flex items-center justify-between">
              <Kicker className="text-fg-subtle">Fig. 01 — The unified feed</Kicker>
              <span className="h-px flex-1 mx-3 bg-border" />
              <Kicker className="text-amber">Live</Kicker>
            </div>
            {/* layered plate behind for depth */}
            <div
              aria-hidden
              className="absolute -right-3 top-12 bottom-2 left-3 -z-10 rounded-[26px] border border-border bg-surface/30"
            />
            <div className="rounded-[26px] p-[1px] bg-gradient-to-b from-border-strong/80 via-border/40 to-transparent shadow-[0_50px_120px_-50px_rgb(var(--shadow-color)/0.65)]">
              <InboxPreview />
            </div>
            <span
              className="fade-up absolute -bottom-3.5 left-6 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-[11px] font-medium text-accent shadow-sm"
              style={{ animationDelay: "720ms" }}
            >
              <Sparkles size={11} /> summarized locally, in ~2ms
            </span>
          </div>
        </section>
      </main>

      {/* ── provider ticker (full-bleed) ─────────────────────────────── */}
      <div className="relative border-y border-border py-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--bg), transparent 8%, transparent 92%, var(--bg))",
          }}
        />
        <div className="flex w-max animate-marquee">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
              {["Gmail", "Outlook", "Yahoo", "iCloud", "Fastmail", "Proton", "Any IMAP"].map((p) => (
                <span key={p} className="flex items-center">
                  <Kicker className="px-7 text-fg-muted">{p}</Kicker>
                  <Sparkles size={11} className="text-amber/70" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="relative mx-auto max-w-6xl px-6 sm:px-10">
        {/* ── features — editorial numbered entries ────────────────────── */}
        <section className="grid gap-y-12 py-16 sm:grid-cols-3 sm:gap-x-0">
          {[
            {
              n: "01",
              title: "AI on every row",
              body: "Summaries and priority labels render inline as the list loads — no clicks, no side panels.",
            },
            {
              n: "02",
              title: "One unified inbox",
              body: "Gmail, Outlook and IMAP merged by date, each row tagged with its source. The provider stays out of the way.",
            },
            {
              n: "03",
              title: "Local, private, free",
              body: "Prioritization, summaries and drafts run on-device. No external model, no API key, no per-message cost.",
            },
          ].map((f, i) => (
            <article
              key={f.n}
              className={`group sm:px-9 ${i > 0 ? "sm:border-l sm:border-border" : ""} sm:first:pl-0 sm:last:pr-0`}
            >
              <span className="font-display text-5xl font-semibold leading-none text-transparent [-webkit-text-stroke:1px_var(--amber)] transition-colors group-hover:text-amber">
                {f.n}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-fg">
                {f.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
            </article>
          ))}
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-border py-8 sm:flex-row sm:items-center sm:justify-between">
          <Kicker className="text-fg-subtle">Built with Claude Code · aptask take-home</Kicker>
          <span className="flex gap-5 text-xs text-fg-muted">
            <a
              href="https://github.com/sid3github/aptask-mail/blob/main/docs/architecture.md"
              target="_blank"
              rel="noreferrer"
              className="uppercase tracking-[0.12em] transition-colors hover:text-fg"
            >
              Architecture
            </a>
            <a
              href="https://github.com/sid3github/aptask-mail"
              className="uppercase tracking-[0.12em] transition-colors hover:text-fg"
            >
              Source
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

/* A faithful, static miniature of the product's signature surface — the unified
   inbox with per-row provider source dots + AI summary + priority. */
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
      provider: ["Gmail", "#ea4335"] as const,
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
      provider: ["Outlook", "#0a84ff"] as const,
      unread: true,
      star: false,
      attach: false,
    },
    {
      initials: "PE",
      from: "The Pragmatic Engineer",
      time: "7:10",
      subject: "How LinkedIn rebuilt their feed",
      summary: "LinkedIn feed rebuild, tech layoffs, staff-engineer guide.",
      tone: "newsletter" as const,
      label: "Newsletter",
      provider: ["Yahoo", "#7e1fff"] as const,
      unread: false,
      star: false,
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
      provider: ["Outlook", "#0a84ff"] as const,
      unread: false,
      star: false,
      attach: true,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[25px] border border-border bg-surface">
      {/* top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg/20 to-transparent"
      />
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-fg text-bg">
          <Sparkles size={12} />
        </span>
        <span className="font-display text-sm font-semibold">Inbox</span>
        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-fg-muted">
          3 accounts
        </span>
        <span className="ml-auto text-[10px] text-fg-subtle">8 messages</span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li
            key={r.from}
            className="fade-up flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-0"
            style={{ animationDelay: `${420 + i * 90}ms` }}
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                r.unread ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg-muted"
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
                {r.star && <Star size={10} className="shrink-0 fill-amber text-amber" />}
                {r.attach && <Paperclip size={10} className="shrink-0 text-fg-subtle" />}
                <span className="ml-auto shrink-0 text-[10px] text-fg-subtle">{r.time}</span>
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
              <div className="mt-1.5 flex items-center gap-2.5">
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    r.tone === "urgent"
                      ? "bg-danger/10 text-danger"
                      : r.tone === "important"
                        ? "bg-accent/10 text-accent"
                        : "bg-fg-muted/10 text-fg-subtle"
                  }`}
                >
                  {r.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-subtle">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.provider[1] }} />
                  {r.provider[0]}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
