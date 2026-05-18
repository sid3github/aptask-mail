"use client";
import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Server, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imapSignIn, type ImapFormState } from "./actions";

type Preset = "yahoo" | "aol" | "custom";

const PRESETS: Record<Preset, { label: string; host: string; port: number; smtpHost: string; smtpPort: number; appPasswordUrl: string }> = {
  yahoo: {
    label: "Yahoo Mail",
    host: "imap.mail.yahoo.com",
    port: 993,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    appPasswordUrl: "https://login.yahoo.com/account/security/app-passwords",
  },
  aol: {
    label: "AOL Mail",
    host: "imap.aol.com",
    port: 993,
    smtpHost: "smtp.aol.com",
    smtpPort: 465,
    appPasswordUrl: "https://login.aol.com/account/security",
  },
  custom: {
    label: "Custom IMAP",
    host: "",
    port: 993,
    smtpHost: "",
    smtpPort: 465,
    appPasswordUrl: "",
  },
};

export default function ImapLoginPage() {
  const [preset, setPreset] = useState<Preset>("yahoo");
  const [state, action, pending] = useActionState<ImapFormState, FormData>(
    imapSignIn,
    {},
  );
  const p = PRESETS[preset];

  return (
    <div className="grid min-h-svh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={14} /> Back to sign-in options
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
            <Server size={16} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">
            Add an IMAP account
          </h1>
        </div>

        <p className="mb-6 text-sm text-fg-muted">
          Connect any IMAP-capable mailbox. For Yahoo and AOL you must use an{" "}
          <strong>app password</strong>, not your regular password — see the link below.
        </p>

        <form action={action} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as Preset[]).map((k) => (
                <label
                  key={k}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-center text-xs font-medium transition ${
                    preset === k
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-fg-muted hover:text-fg"
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={k}
                    className="sr-only"
                    checked={preset === k}
                    onChange={() => setPreset(k)}
                  />
                  {PRESETS[k].label}
                </label>
              ))}
            </div>
          </div>

          {p.appPasswordUrl && (
            <a
              href={p.appPasswordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink size={12} /> Get your {p.label} app password
            </a>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">Email</label>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@yahoo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              App password
            </label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="xxxx xxxx xxxx xxxx"
            />
          </div>

          <details className="rounded-md border border-border bg-surface px-3 py-2 text-sm" open={preset === "custom"}>
            <summary className="cursor-pointer select-none text-xs font-medium text-fg-muted">
              Server settings ({p.label})
            </summary>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-fg-muted">
                    IMAP host
                  </label>
                  <Input name="host" defaultValue={p.host} placeholder="imap.example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-fg-muted">
                    IMAP port
                  </label>
                  <Input name="port" type="number" defaultValue={p.port} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-fg-muted">
                    SMTP host
                  </label>
                  <Input name="smtpHost" defaultValue={p.smtpHost} placeholder="smtp.example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-fg-muted">
                    SMTP port
                  </label>
                  <Input name="smtpPort" type="number" defaultValue={p.smtpPort} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                <input
                  type="checkbox"
                  name="secure"
                  defaultChecked
                  className="h-4 w-4 rounded border-border"
                />
                IMAP uses TLS
              </label>
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                <input
                  type="checkbox"
                  name="smtpSecure"
                  defaultChecked
                  className="h-4 w-4 rounded border-border"
                />
                SMTP uses TLS
              </label>
            </div>
          </details>

          {state.error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {state.error}
            </div>
          )}

          <Button type="submit" disabled={pending} size="lg" className="mt-1 w-full">
            {pending ? "Connecting…" : "Connect mailbox"}
          </Button>

          <p className="text-center text-[11px] text-fg-muted">
            Credentials are encrypted with AES-256-GCM and stored only in an
            httpOnly cookie. They never touch a database in this demo.
          </p>
        </form>
      </div>
    </div>
  );
}
