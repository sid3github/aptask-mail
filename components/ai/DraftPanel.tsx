"use client";
import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Tone = "formal" | "casual" | "short";

export function DraftPanel({
  previousFrom,
  previousSubject,
  previousBody,
  onClose,
}: {
  previousFrom: string;
  previousSubject: string;
  previousBody: string;
  onClose: () => void;
}) {
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <section
      role="dialog"
      aria-label="AI draft reply"
      className="sticky bottom-0 z-20 mt-6 border-t border-border bg-surface/95 px-3 py-4 backdrop-blur sm:px-5 sm:py-5"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-fg">AI draft reply</h2>
        <button
          onClick={onClose}
          aria-label="Close draft panel"
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-bg"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        <Input
          placeholder="What do you want to say? (e.g. 'Yes, confirm I'll be there')"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(["formal", "casual", "short"] as Tone[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className="rounded-full transition"
              aria-pressed={tone === t}
            >
              <Badge tone={tone === t ? "important" : "neutral"}>{t}</Badge>
            </button>
          ))}
          <Button
            size="sm"
            onClick={generate}
            disabled={loading}
            className="ml-auto"
          >
            <Sparkles size={14} />
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        <Textarea
          placeholder="Your reply will appear here. Edit before sending."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-fg-muted">
            Drafts are AI-generated. Always review before sending.
          </p>
          <Button size="sm" variant="primary" disabled={!body}>
            <Send size={14} /> Send
          </Button>
        </div>
      </div>
    </section>
  );
}
