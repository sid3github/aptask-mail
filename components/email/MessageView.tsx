"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Reply, Star, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { EmailMessage } from "@/lib/email/providers/types";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";
import { emailDateFull } from "@/lib/utils/date";
import { DraftPanel } from "@/components/ai/DraftPanel";
import { MessageAiEnrichment } from "@/components/ai/MessageAiEnrichment";

export function MessageView({ message: initial }: { message: EmailMessage }) {
  const [message, setMessage] = useState(initial);
  const [showDraft, setShowDraft] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const fromLabel = message.from.name
    ? `${message.from.name} <${message.from.email}>`
    : message.from.email;

  async function modify(opLabel: string, body: Record<string, unknown>, after: "back" | "stay") {
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
        startTransition(() => {
          router.push("/inbox");
          router.refresh();
        });
      } else {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  function onArchive() {
    void modify("archive", { type: "archive" }, "back");
  }
  function onTrash() {
    void modify("trash", { type: "trash" }, "back");
  }
  function onStar() {
    const next = !message.starred;
    setMessage((m) => ({ ...m, starred: next }));
    void modify("star", { type: "star", starred: next }, "stay");
  }

  return (
    <article className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-border bg-bg/95 px-3 py-3 backdrop-blur sm:px-5">
        <Link
          href="/inbox"
          aria-label="Back to inbox"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-fg hover:bg-surface"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="ml-1 flex items-center gap-1">
          <IconButton
            icon={<Archive size={18} />}
            label="Archive"
            onClick={onArchive}
            disabled={busy !== null}
          />
          <IconButton
            icon={<Trash2 size={18} />}
            label="Delete"
            onClick={onTrash}
            disabled={busy !== null}
          />
          <IconButton
            icon={
              <Star
                size={18}
                className={message.starred ? "fill-amber-400 text-amber-400" : ""}
              />
            }
            label={message.starred ? "Unstar" : "Star"}
            onClick={onStar}
            disabled={busy !== null}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowDraft((v) => !v)}
            disabled={busy !== null}
          >
            <Sparkles size={14} /> Draft reply
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowDraft(true)}>
            <Reply size={14} /> Reply
          </Button>
        </div>
      </header>

      <div className="px-3 py-4 sm:px-5 sm:py-6">
        <h1 className="text-xl font-semibold leading-tight text-fg sm:text-2xl">
          {message.subject}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <span>{fromLabel}</span>
          <span>•</span>
          <time>{emailDateFull(message.date)}</time>
          {message.ai?.priority && <PriorityBadge priority={message.ai.priority} />}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {message.ai?.summary && (
          <AiCard message={message} />
        )}
        {!message.ai && (
          <MessageAiEnrichment
            message={message}
            onEnriched={(ai) => setMessage((m) => ({ ...m, ai }))}
          />
        )}

        <Body html={message.bodyHtml} text={message.bodyText} />
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
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <Sparkles size={14} className="mt-1 shrink-0 text-accent" />
      <div className="text-sm text-fg">
        <span className="mr-1 font-semibold text-accent">AI summary:</span>
        {message.ai!.summary}
        {message.ai!.priorityReason && (
          <div className="mt-1 text-xs text-fg-muted">
            Priority reasoning: {message.ai!.priorityReason}
          </div>
        )}
      </div>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg hover:bg-surface disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function Body({ html, text }: { html?: string; text?: string }) {
  if (html) {
    return (
      <div
        className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed [&_a]:text-accent [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-fg">
      {text}
    </pre>
  );
}
