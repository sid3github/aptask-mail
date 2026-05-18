"use client";
import { useEffect, useState } from "react";
import type { AiPriority, EmailMessage } from "@/lib/email/providers/types";
import { EmailList } from "./EmailList";

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
        const merged = { ...cache, ...j.results };
        writeCache(merged);
        setMessages((curr) =>
          curr.map((m) => (m.ai ? m : j.results[m.id] ? { ...m, ai: j.results[m.id] } : m)),
        );
      })
      .catch(() => {
        // silent failure — UI continues to show messages without AI
      });

    return () => {
      cancelled = true;
    };
    // We deliberately depend on the initial message IDs only, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.map((m) => m.id).join(","), enabled]);

  return <EmailList messages={messages} />;
}
