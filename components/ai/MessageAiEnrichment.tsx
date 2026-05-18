"use client";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { AiPriority, EmailMessage } from "@/lib/email/providers/types";

type AiResult = {
  summary?: string;
  priority?: AiPriority;
  priorityReason?: string;
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
        if (!ai) return;
        writeCache({ ...cache, [message.id]: ai });
        onEnriched(ai);
      })
      .catch(() => {
        // silent
      });
    return () => {
      cancelled = true;
    };
    // We only want to fire once per message id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg-muted">
      <Sparkles size={12} className="text-accent" />
      <span>AI summary loading…</span>
    </div>
  );
}
