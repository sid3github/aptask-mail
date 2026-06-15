"use client";
import { useState } from "react";
import { Sparkles, X, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import type { EmailAddress } from "@/lib/email/providers/types";

type Tone = "formal" | "casual" | "short";

export function DraftPanel({
  accountId,
  threadId,
  inReplyToMessageId,
  toAddress,
  previousFrom,
  previousSubject,
  previousBody,
  onClose,
}: {
  accountId: string;
  threadId?: string;
  inReplyToMessageId?: string;
  toAddress: EmailAddress;
  previousFrom: string;
  previousSubject: string;
  previousBody: string;
  onClose: () => void;
}) {
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          previousFrom,
          previousSubject,
          previousBody,
          intent: intent || "Reply appropriately.",
          tone,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = (await r.json()) as { body: string };
      setBody(j.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const subject = previousSubject.startsWith("Re:") ? previousSubject : `Re: ${previousSubject}`;
      const r = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: [{ email: toAddress.email, name: toAddress.name }],
          subject,
          bodyText: body,
          threadId,
          inReplyToMessageId,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = (await r.json()) as { id: string };
      setSentId(j.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      role="dialog"
      aria-label="AI draft reply"
      className="fade-up sticky bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur-md sm:px-8 sm:py-5"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h2 className="font-display text-sm font-semibold text-fg">AI draft reply</h2>
          <span className="text-xs text-fg-subtle">to {toAddress.name || toAddress.email}</span>
          <button
            onClick={onClose}
            aria-label="Close draft panel"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        {sentId ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-fg">
            <Check size={16} className="text-accent" />
            Reply sent.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <Input
              placeholder="What do you want to say? e.g. “Yes, I'll be there at 2pm”"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-full bg-surface-2 p-1">
                {(["formal", "casual", "short"] as Tone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    aria-pressed={tone === t}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                      tone === t
                        ? "bg-surface text-fg shadow-sm"
                        : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={generate}
                disabled={generating || sending}
                className="ml-auto"
                type="button"
              >
                <Sparkles size={14} />
                {generating ? "Writing…" : body ? "Regenerate" : "Generate"}
              </Button>
            </div>

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            <Textarea
              placeholder="Your reply appears here. Edit before sending."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-subtle">AI-generated — always review before sending.</p>
              <Button
                size="sm"
                variant="primary"
                disabled={!body || sending}
                onClick={send}
                type="button"
              >
                <Send size={14} /> {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
