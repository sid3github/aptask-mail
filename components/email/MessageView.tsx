"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Star, Trash2, Sparkles, ArrowLeft, Reply, Forward, Check, Paperclip, Download } from "lucide-react";
import Link from "next/link";
import type { EmailMessage } from "@/lib/email/providers/types";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";
import { emailDateFull } from "@/lib/utils/date";
import { DraftPanel } from "@/components/ai/DraftPanel";
import { MessageAiEnrichment } from "@/components/ai/MessageAiEnrichment";
import { EmailFrame } from "./EmailFrame";

function initials(name?: string, email?: string): string {
  const src = name ?? email ?? "?";
  const parts = src.split(/[\s@.]+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function MessageView({ message: initial }: { message: EmailMessage }) {
  const [message, setMessage] = useState(initial);
  const [showDraft, setShowDraft] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const fromLabel = message.from.name
    ? `${message.from.name} <${message.from.email}>`
    : message.from.email;

  async function modify(
    opLabel: string,
    body: Record<string, unknown>,
    after: "back" | "stay",
    doneLabel?: string,
  ) {
    setBusy(opLabel);
    setError(null);
    try {
      const r = await fetch("/api/email/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: message.id, op: body }),
      });
      if (!r.ok) throw new Error(await r.text());
      if (after === "back") {
        // Brief confirmation so the action doesn't feel like an abrupt jump.
        if (doneLabel) setToast(doneLabel);
        setTimeout(() => {
          startTransition(() => {
            router.push("/inbox");
            router.refresh();
          });
        }, 600);
      } else {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      setBusy(null);
    }
    if (after !== "back") setBusy(null);
  }

  function onArchive() {
    void modify("archive", { type: "archive" }, "back", "Archived");
  }
  function onTrash() {
    void modify("trash", { type: "trash" }, "back", "Moved to Trash");
  }
  function onStar() {
    const next = !message.starred;
    setMessage((m) => ({ ...m, starred: next }));
    void modify("star", { type: "star", starred: next }, "stay");
  }

  function onReply() {
    const params = new URLSearchParams({
      to: message.from.email,
      subject: message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`,
    });
    router.push(`/compose?${params.toString()}`);
  }

  function onForward() {
    const original = message.bodyText ?? message.snippet ?? "";
    const quoted = [
      "---------- Forwarded message ----------",
      `From: ${fromLabel}`,
      `Subject: ${message.subject}`,
      "",
      original,
    ].join("\n");
    const params = new URLSearchParams({
      subject: message.subject.startsWith("Fwd:") ? message.subject : `Fwd: ${message.subject}`,
      body: quoted,
    });
    router.push(`/compose?${params.toString()}`);
  }

  return (
    <article className="flex flex-col">
      <header className="sticky top-16 z-10 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="flex max-w-3xl items-center gap-1 px-2 py-2.5 sm:px-4">
          <Link
            href="/inbox"
            aria-label="Back to inbox"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-2"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center">
            <IconButton icon={<Archive size={18} />} label="Archive" onClick={onArchive} disabled={busy !== null} />
            <IconButton icon={<Trash2 size={18} />} label="Delete" onClick={onTrash} disabled={busy !== null} />
            <IconButton
              icon={<Star size={18} className={message.starred ? "fill-amber text-amber" : ""} />}
              label={message.starred ? "Unstar" : "Star"}
              onClick={onStar}
              disabled={busy !== null}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onReply} disabled={busy !== null}>
              <Reply size={14} /> Reply
            </Button>
            <Button size="sm" variant="secondary" onClick={onForward} disabled={busy !== null}>
              <Forward size={14} /> <span className="hidden sm:inline">Forward</span>
            </Button>
            <Button size="sm" variant="primary" onClick={() => setShowDraft((v) => !v)} disabled={busy !== null}>
              <Sparkles size={14} /> <span className="hidden sm:inline">Draft reply</span>
              <span className="sm:hidden">Draft</span>
            </Button>
          </div>
        </div>
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fade-in flex items-center gap-2 border-t border-accent/20 bg-accent-soft px-4 py-2 text-xs font-medium text-accent sm:px-4"
          >
            <Check size={14} /> {toast}
          </div>
        )}
      </header>

      <div className="max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-[28px]">
          {message.subject}
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold text-fg-muted">
            {initials(message.from.name, message.from.email)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-fg">
              {message.from.name || message.from.email}
            </div>
            <div className="truncate text-xs text-fg-muted">
              <time>{emailDateFull(message.date)}</time>
            </div>
          </div>
          {message.ai?.priority && <PriorityBadge priority={message.ai.priority} />}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        {message.ai?.summary && <AiCard message={message} />}
        {!message.ai && (
          <MessageAiEnrichment
            message={message}
            onEnriched={(ai) => setMessage((m) => ({ ...m, ai }))}
          />
        )}

        <Body html={message.bodyHtml} text={message.bodyText} />

        {message.attachments && message.attachments.length > 0 && (
          <Attachments messageId={message.id} attachments={message.attachments} />
        )}
      </div>

      {showDraft && (
        <DraftPanel
          accountId={message.accountId}
          threadId={message.threadId}
          inReplyToMessageId={message.id}
          toAddress={message.from}
          previousFrom={fromLabel}
          previousSubject={message.subject}
          previousBody={message.bodyText ?? message.snippet}
          onClose={() => setShowDraft(false)}
        />
      )}
    </article>
  );
}

function AiCard({ message }: { message: EmailMessage }) {
  return (
    <div className="mt-6 rounded-2xl border border-accent/15 bg-accent-soft/60 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          AI summary
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fg">{message.ai!.summary}</p>
      {message.ai!.priorityReason && (
        <p className="mt-1.5 text-xs text-fg-muted">{message.ai!.priorityReason}</p>
      )}
    </div>
  );
}

function attachmentSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Attachments({
  messageId,
  attachments,
}: {
  messageId: string;
  attachments: NonNullable<EmailMessage["attachments"]>;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <Paperclip size={13} />
        {attachments.length} {attachments.length === 1 ? "attachment" : "attachments"}
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {attachments.map((a) => (
          <li key={a.id}>
            <a
              href={`/api/email/attachment?id=${encodeURIComponent(messageId)}&attachmentId=${encodeURIComponent(a.id)}`}
              download={a.filename}
              className="group inline-flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:bg-surface-2"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-muted">
                <Paperclip size={14} />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[200px] truncate text-sm text-fg">{a.filename}</span>
                <span className="block text-xs text-fg-subtle">{attachmentSize(a.size)}</span>
              </span>
              <Download size={15} className="ml-1 shrink-0 text-fg-subtle group-hover:text-fg" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-2 disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function Body({ html, text }: { html?: string; text?: string }) {
  if (html) {
    // Render the (already DOMPurify-sanitized) email HTML inside a sandboxed,
    // auto-height iframe so its own CSS can't leak into the app and a wide
    // marketing layout reads at full width instead of collapsing to its mobile
    // breakpoint.
    return <EmailFrame html={html} />;
  }
  return (
    <div className="mt-7 rounded-2xl border border-border bg-surface px-5 py-5">
      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-fg">
        {text}
      </pre>
    </div>
  );
}
