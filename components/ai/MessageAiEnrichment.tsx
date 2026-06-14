"use client";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { AiPriority, EmailMessage } from "@/lib/email/providers/types";

type AiResult = {
  summary?: string;
  priority?: AiPriority;
  priorityReason?: string;
  unavailable?: boolean;
};

const CACHE_KEY = "inboxiq:ai-cache:v1";

function readCache(): Record<string, AiResult> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCache(next: Record<string, AiResult>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // quota — ignore
  }
}

export function MessageAiEnrichment({
  message,
  onEnriched,
}: {
  message: EmailMessage;
  onEnriched: (ai: AiResult) => void;
}) {
  useEffect(() => {
    const cache = readCache();
    if (cache[message.id]) {
      onEnriched(cache[message.id]);
      return;
    }
    let cancelled = false;
    fetch("/api/ai/enrich-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            id: message.id,
            from: message.from.name
              ? `${message.from.name} <${message.from.email}>`
              : message.from.email,
            subject: message.subject,
            snippet:
              message.snippet ||
              (message.bodyText ?? "").slice(0, 200) ||
              (message.bodyHtml ?? "").replace(/<[^>]+>/g, " ").slice(0, 200),
          },
        ],
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { results: Record<string, AiResult> }) => {
        if (cancelled) return;
        const ai = j.results[message.id];
        // Unavailable / empty → mark enriched-empty (clears the loading card,
        // shows no AI card). Don't cache so it retries on reload.
        if (!ai || ai.unavailable || !ai.summary) {
          onEnriched({});
          return;
        }
        writeCache({ ...cache, [message.id]: ai });
        onEnriched(ai);
      })
      .catch(() => {
        if (!cancelled) onEnriched({});
      });
    return () => {
      cancelled = true;
    };
    // We only want to fire once per message id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  return (
    <div className="mt-6 rounded-2xl border border-accent/15 bg-accent-soft/60 p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="animate-pulse text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          AI summary
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-3/5 rounded skeleton" />
      </div>
    </div>
  );
}
