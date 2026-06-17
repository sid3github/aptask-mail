"use client";
import { useEffect, useRef, useState } from "react";
import type { AiPriority, EmailMessage } from "@/lib/email/providers/types";
import { EmailList } from "./EmailList";
import { Button } from "@/components/ui/button";

type AiResult = {
  summary?: string;
  priority?: AiPriority;
  priorityReason?: string;
  unavailable?: boolean;
};

// v2: v1 entries could contain raw provider error strings (pre-fix); bump to discard them.
const CACHE_KEY = "inboxiq:ai-cache:v2";
const INITIAL_LIMIT = 50; // must match the server-side loadInbox limit on the inbox page
const PAGE = 25; // "Load more" increment
const CHUNK = 25; // /api/ai/enrich-batch caps `items` at 25 — never POST more than this

// Session-scoped verdict cache. Persists across client navigations (folder
// switches remount the list, but this module singleton survives), so each
// message is enriched/skeletoned at most ONCE per session — switching folders
// never re-triggers a loading shimmer for messages we've already resolved.
// Holds both real summaries and "unavailable" ({}), and is cleared on full reload.
const sessionVerdict = new Map<string, AiResult>();

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

// Seed each message's ai from: localStorage real summary → session verdict
// (incl. "unavailable") → otherwise undefined (will skeleton + enrich once).
function applyCache(list: EmailMessage[]): EmailMessage[] {
  const cache = readCache();
  return list.map((m) => {
    if (m.ai) return m;
    if (cache[m.id]?.summary) return { ...m, ai: cache[m.id] };
    if (sessionVerdict.has(m.id)) return { ...m, ai: sessionVerdict.get(m.id)! };
    return m;
  });
}

export function EmailListEnriched({
  messages: initial,
  label = "INBOX",
  enabled = true,
}: {
  messages: EmailMessage[];
  label?: string;
  enabled?: boolean;
}) {
  const [messages, setMessages] = useState<EmailMessage[]>(() => applyCache(initial));
  const [limit, setLimit] = useState(Math.max(INITIAL_LIMIT, initial.length));
  const [canMore, setCanMore] = useState(initial.length >= INITIAL_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);
  const requested = useRef<Set<string>>(new Set());

  const idKey = messages.map((m) => m.id).join(",");

  useEffect(() => {
    if (!enabled) return;
    const cache = readCache();
    // Stable Set instance — capture it so the cleanup below operates on the same
    // object (and to satisfy react-hooks/exhaustive-deps about ref access).
    const reqSet = requested.current;

    const need = messages.filter(
      (m) =>
        !m.ai &&
        !cache[m.id] &&
        !sessionVerdict.has(m.id) &&
        !reqSet.has(m.id),
    );
    if (need.length === 0) return;
    const ids = need.map((m) => m.id);
    const idSet = new Set(ids);
    ids.forEach((id) => reqSet.add(id));

    let cancelled = false;

    // The route caps each request at CHUNK items, so split a large inbox into
    // several batches and run them in parallel. A chunk that fails resolves to
    // empty markers so its rows clear instead of skeletoning forever.
    const chunks: EmailMessage[][] = [];
    for (let i = 0; i < need.length; i += CHUNK) chunks.push(need.slice(i, i + CHUNK));

    Promise.all(
      chunks.map((chunk) =>
        fetch("/api/ai/enrich-batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: chunk.map((m) => ({
              id: m.id,
              from: m.from.name ? `${m.from.name} <${m.from.email}>` : m.from.email,
              subject: m.subject,
              snippet: m.snippet,
            })),
          }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
          .then((j: { results?: Record<string, AiResult> }) => j.results ?? {})
          .catch(() => Object.fromEntries(chunk.map((m) => [m.id, {} as AiResult]))),
      ),
    ).then((perChunk) => {
      if (cancelled) return;
      const results: Record<string, AiResult> = Object.assign({}, ...perChunk);
      const real = Object.fromEntries(
        Object.entries(results).filter(([, v]) => v && !v.unavailable && v.summary),
      );
      writeCache({ ...cache, ...real });
      // Record every verdict (real or unavailable) for the session so folder
      // switches never re-skeleton an already-resolved message.
      for (const id of ids) {
        const r = results[id];
        sessionVerdict.set(id, r && !r.unavailable && r.summary ? r : {});
      }
      setMessages((curr) =>
        curr.map((m) => {
          if (m.ai || !idSet.has(m.id)) return m;
          const r = results[m.id];
          return r && !r.unavailable && r.summary ? { ...m, ai: r } : { ...m, ai: {} };
        }),
      );
    });

    return () => {
      cancelled = true;
      // Roll back marks for anything this run didn't resolve, so a StrictMode
      // re-run or a remount retries instead of leaving a permanent skeleton.
      for (const id of ids) {
        if (!sessionVerdict.has(id)) reqSet.delete(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, enabled]);

  async function loadMore() {
    setLoadingMore(true);
    const next = limit + PAGE;
    try {
      const r = await fetch(
        `/api/email/list?limit=${next}&label=${encodeURIComponent(label)}`,
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { items: EmailMessage[] };
      const items = j.items ?? [];
      setMessages(applyCache(items));
      setLimit(next);
      setCanMore(items.length >= next);
    } catch {
      setCanMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <EmailList messages={messages} />
      {canMore && (
        <div className="flex justify-center px-4 py-6">
          <Button variant="secondary" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
