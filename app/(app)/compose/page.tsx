"use client";
import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Check, Sparkles, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { parseRecipients } from "@/lib/email/recipients";
import { cn } from "@/lib/utils/cn";

type Tone = "formal" | "casual" | "short";
type LocalAttachment = {
  filename: string;
  contentType: string;
  dataBase64: string;
  size: number;
};

const MAX_TOTAL_BYTES = 3 * 1024 * 1024;

function formatSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1)); // strip the data: URL prefix
    };
    reader.readAsDataURL(file);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function textToHtml(s: string): string {
  if (!s.trim()) return "";
  return s
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function ComposeInner() {
  const params = useSearchParams();
  const seededBody = params.get("body") ?? "";
  const [to, setTo] = useState(params.get("to") ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [bodyHtml, setBodyHtml] = useState(textToHtml(seededBody));
  const [bodyText, setBodyText] = useState(seededBody);
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function generate() {
    setGenerating(true);
    setErrorMsg("");
    try {
      const r = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent: intent || "Write a brief, friendly message.",
          tone,
          previousSubject: subject,
          // Greet the first recipient by name when we can derive one.
          previousFrom: to.split(/[,;]/)[0]?.trim() ?? "",
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = (await r.json()) as { body: string };
      setBodyText(j.body);
      setBodyHtml(textToHtml(j.body));
      if (status === "error") setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't generate a draft. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added: LocalAttachment[] = [];
    for (const file of Array.from(files)) {
      added.push({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        dataBase64: await readAsBase64(file),
        size: file.size,
      });
    }
    const merged = [...attachments, ...added];
    if (merged.reduce((n, a) => n + a.size, 0) > MAX_TOTAL_BYTES) {
      setStatus("error");
      setErrorMsg("Attachments exceed the 3 MB total limit.");
    } else {
      setAttachments(merged);
      if (status === "error") setStatus("idle");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((cur) => cur.filter((_, i) => i !== index));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const toList = parseRecipients(to);
    if (toList.length === 0) {
      setStatus("error");
      setErrorMsg("Add at least one valid recipient.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const r = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: toList,
          cc: showCc ? parseRecipients(cc) : undefined,
          bcc: showCc ? parseRecipients(bcc) : undefined,
          subject,
          bodyText: bodyText.trim() || " ",
          bodyHtml: bodyHtml.trim() ? bodyHtml : undefined,
          attachments: attachments.length
            ? attachments.map(({ filename, contentType, dataBase64 }) => ({
                filename,
                contentType,
                dataBase64,
              }))
            : undefined,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setStatus("sent");
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBodyHtml("");
      setBodyText("");
      setIntent("");
      setAttachments([]);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
          New message
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Compose and send from your connected account.
        </p>

        <form onSubmit={send} className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <Input
              required
              placeholder="To  ·  comma-separated"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
              >
                Cc / Bcc
              </button>
            )}
          </div>

          {showCc && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Cc" value={cc} onChange={(e) => setCc(e.target.value)} />
              <Input placeholder="Bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} />
            </div>
          )}

          <Input
            required
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {/* AI assist */}
          <div className="rounded-2xl border border-accent/15 bg-accent-soft/40 p-3">
            <div className="flex items-center gap-2 px-1 pb-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                Write with AI
              </span>
            </div>
            <Input
              placeholder="What do you want to say? e.g. “Ask to reschedule to Thursday”"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-full bg-surface-2 p-1">
                {(["formal", "casual", "short"] as Tone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    aria-pressed={tone === t}
                    className={cn(
                      "inline-flex min-h-[36px] items-center rounded-full px-3.5 text-xs font-medium capitalize transition-colors",
                      tone === t ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={generate}
                disabled={generating}
                className="ml-auto"
              >
                <Sparkles size={14} />
                {generating ? "Writing…" : bodyText ? "Regenerate" : "Generate"}
              </Button>
            </div>
          </div>

          <RichTextEditor
            html={bodyHtml}
            onChange={(html, text) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
            placeholder="Write your message…"
          />

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => void addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-2 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Paperclip size={14} /> Attach files
            </button>
            {attachments.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <li
                    key={`${a.filename}-${i}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1.5 text-xs text-fg"
                  >
                    <Paperclip size={12} className="shrink-0 text-fg-subtle" />
                    <span className="max-w-[180px] truncate">{a.filename}</span>
                    <span className="text-fg-subtle">{formatSize(a.size)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${a.filename}`}
                      onClick={() => removeAttachment(i)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={null}>
      <ComposeInner />
    </Suspense>
  );
}
