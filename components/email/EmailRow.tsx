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
        "group flex items-start gap-3 border-b border-border px-4 py-4 transition-colors active:bg-surface/80 sm:px-6 sm:py-5",
        message.unread ? "bg-bg" : "bg-bg",
        "hover:bg-surface/60",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          message.unread
            ? "bg-accent/15 text-accent"
            : "bg-surface text-fg-muted",
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
            <Star
              size={11}
              className="shrink-0 fill-amber-400 text-amber-400"
              aria-label="starred"
            />
          )}
          {message.hasAttachments && (
            <Paperclip size={11} className="shrink-0 text-fg-muted" aria-label="attachment" />
          )}
          <span className="ml-auto shrink-0 text-[11px] text-fg-muted">
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

        {message.ai?.summary && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-fg-muted">
            <Sparkles size={11} className="mt-1 shrink-0 text-accent" aria-hidden />
            <span className="line-clamp-2">{message.ai.summary}</span>
          </div>
        )}

        {message.ai?.priority && (
          <div className="mt-2">
            <PriorityBadge priority={message.ai.priority} />
          </div>
        )}
      </div>
    </Link>
  );
}
