"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default function ComposePage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending…");
    try {
      const r = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: to.split(",").map((s) => ({ email: s.trim() })).filter((a) => a.email),
          subject,
          bodyText: body,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setStatus("Sent");
      setTo("");
      setSubject("");
      setBody("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <AppShell accounts={[]}>
      <form
        onSubmit={send}
        className="mx-auto flex max-w-3xl flex-col gap-3 px-3 py-4 sm:px-5"
      >
        <h1 className="text-xl font-semibold tracking-tight">New message</h1>
        <Input
          required
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Input
          required
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Textarea
          required
          placeholder="Write your message…"
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="primary">
            <Send size={14} /> Send
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setBody((b) => b + "\n\nPS: written with InboxIQ ✨")}
          >
            <Sparkles size={14} /> Add AI signature
          </Button>
          {status && <span className="ml-auto text-xs text-fg-muted">{status}</span>}
        </div>
      </form>
    </AppShell>
  );
}
