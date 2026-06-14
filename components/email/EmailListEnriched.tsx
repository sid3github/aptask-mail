"use client";
import { useEffect, useState } from "react";
import type { AiPriority, EmailMessage } from "@/lib/email/providers/types";
import { EmailList } from "./EmailList";

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

export function EmailListEnriched({
  messages: initial,
  enabled = true,
}: {
  messages: EmailMessage[];
  enabled?: boolean;
}) {
  const [messages, setMessages] = useState<EmailMessage[]>(() => {
    const cache = readCache();
    return initial.map((m) => (m.ai || !cache[m.id] ? m : { ...m, ai: cache[m.id] }));
  });

  useEffect(() => {
    if (!enabled) return;
    const cache = readCache();
    const need = messages.filter((m) => !m.ai && !cache[m.id]);
    if (need.length === 0) return;

    let cancelled = false;
    const payload = need.map((m) => ({
      id: m.id,
      from: m.from.name ? `${m.from.name} <${m.from.email}>` : m.from.email,
      subject: m.subject,
      snippet: m.snippet,
    }));

    fetch("/api/ai/enrich-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: payload }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { results: Record<string, AiResult> }) => {
        if (cancelled) return;
        // Cache only real successes; let unavailable ones retry on reload.
        const real = Object.fromEntries(
          Object.entries(j.results).filter(([, v]) => v && !v.unavailable && v.summary),
        );
        writeCache({ ...cache, ...real });
        setMessages((curr) =>
          curr.map((m) => {
            if (m.ai) return m;
            const r = j.results[m.id];
            if (!r) return m;
            // Empty object = "enrichment ran, nothing to show" — stops skeleton.
            return r.unavailable || !r.summary ? { ...m, ai: {} } : { ...m, ai: r };
          }),
        );
      })
      .catch(() => {
        // Network failure — stop skeletons, render mail cleanly without AI.
        setMessages((curr) => curr.map((m) => (m.ai ? m : { ...m, ai: {} })));
      });

    return () => {
      cancelled = true;
    };
    // We deliberately depend on the initial message IDs only, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.map((m) => m.id).join(","), enabled]);

  return <EmailList messages={messages} />;
}
