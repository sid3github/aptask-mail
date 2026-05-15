"use client";
import { useState } from "react";
import { Archive, Reply, Star, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { EmailMessage } from "@/lib/email/providers/types";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./PriorityBadge";
import { emailDateFull } from "@/lib/utils/date";
import { DraftPanel } from "@/components/ai/DraftPanel";

export function MessageView({ message }: { message: EmailMessage }) {
  const [showDraft, setShowDraft] = useState(false);
  const fromLabel = message.from.name
    ? `${message.from.name} <${message.from.email}>`
    : message.from.email;

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
          <ActionButton icon={<Archive size={18} />} label="Archive" />
          <ActionButton icon={<Trash2 size={18} />} label="Delete" />
          <ActionButton icon={<Star size={18} />} label="Star" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setShowDraft((v) => !v)}>
            <Sparkles size={14} /> Draft reply
          </Button>
          <Button size="sm" variant="secondary">
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

        {message.ai?.summary && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <Sparkles size={14} className="mt-1 shrink-0 text-accent" />
            <div className="text-sm text-fg">
              <span className="mr-1 font-semibold text-accent">AI summary:</span>
              {message.ai.summary}
              {message.ai.priorityReason && (
                <div className="mt-1 text-xs text-fg-muted">
                  Priority reasoning: {message.ai.priorityReason}
                </div>
              )}
            </div>
          </div>
        )}

        <Body html={message.bodyHtml} text={message.bodyText} />
      </div>

      {showDraft && (
        <DraftPanel
          previousFrom={fromLabel}
          previousSubject={message.subject}
          previousBody={message.bodyText ?? message.snippet}
          onClose={() => setShowDraft(false)}
        />
      )}
    </article>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg hover:bg-surface"
    >
      {icon}
    </button>
  );
}

function Body({ html, text }: { html?: string; text?: string }) {
  if (html) {
    // Server already sanitizes the HTML before sending to the client.
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
