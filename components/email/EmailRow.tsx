"use client";
import Link from "next/link";
import { Sparkles, Star, Paperclip } from "lucide-react";
import type { EmailMessage } from "@/lib/email/providers/types";
import { PriorityBadge } from "./PriorityBadge";
import { emailDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

function initials(name?: string, email?: string): string {
  const src = name ?? email ?? "?";
  const parts = src.split(/[\s@.]+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function EmailRow({ message }: { message: EmailMessage }) {
  const display = message.from.name || message.from.email;
  return (
    <Link
      href={`/inbox/${encodeURIComponent(message.id)}`}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-4 transition-colors sm:px-6",
        "hover:bg-surface-2/60 active:bg-surface-2",
      )}
    >
      {/* unread accent bar */}
      {message.unread && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent"
        />
      )}

      <div
        className={cn(
          "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors",
          message.unread
            ? "bg-accent-soft text-accent"
            : "bg-surface-2 text-fg-muted",
        )}
        aria-hidden
      >
        {initials(message.from.name, message.from.email)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              message.unread ? "font-semibold text-fg" : "text-fg-muted",
            )}
          >
            {display}
          </span>
          {message.starred && (
            <>
              <Star size={12} className="shrink-0 fill-amber text-amber" aria-hidden />
              <span className="sr-only">Starred</span>
            </>
          )}
          {message.hasAttachments && (
            <>
              <Paperclip size={12} className="shrink-0 text-fg-subtle" aria-hidden />
              <span className="sr-only">Has attachment</span>
            </>
          )}
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-fg-subtle">
            {emailDate(message.date)}
          </span>
        </div>

        <div
          className={cn(
            "mt-0.5 truncate text-sm",
            message.unread ? "text-fg" : "text-fg-muted",
          )}
        >
          {message.subject}
        </div>

        {message.ai?.summary ? (
          <div className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-fg-muted">
            <Sparkles size={11} className="mt-[3px] shrink-0 text-accent" aria-hidden />
            <span className="line-clamp-2">{message.ai.summary}</span>
          </div>
        ) : message.ai === undefined ? (
          <div className="mt-2 h-3 w-2/3 rounded skeleton" aria-hidden />
        ) : null}

        {message.ai?.priority && (
          <div className="mt-2">
            <PriorityBadge priority={message.ai.priority} />
          </div>
        )}
      </div>
    </Link>
  );
}
