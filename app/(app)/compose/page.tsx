"use client";
import { useState } from "react";
import { Send, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default function ComposePage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
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
      setStatus("sent");
      setTo("");
      setSubject("");
      setBody("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
    }
  }

  return (
    <AppShell accounts={[]}>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
          New message
        </h1>
        <p className="mt-1 text-sm text-fg-muted">Compose and send from your connected account.</p>

        <form onSubmit={send} className="mt-6 flex flex-col gap-3">
          <Input
            required
            placeholder="To  ·  comma-separated"
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
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={status === "sending"}>
              <Send size={14} /> {status === "sending" ? "Sending…" : "Send"}
            </Button>
            {status === "sent" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                <Check size={15} /> Sent
              </span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
