"use client";
import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Server, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imapSignIn, type ImapFormState } from "./actions";

type Preset = "yahoo" | "aol" | "custom";

const PRESETS: Record<
  Preset,
  {
    label: string;
    host: string;
    port: number;
    secure: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    appPasswordUrl: string;
  }
> = {
  yahoo: {
    label: "Yahoo Mail",
    host: "imap.mail.yahoo.com",
    port: 993,
    secure: true,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    smtpSecure: true,
    appPasswordUrl: "https://login.yahoo.com/myaccount/security/app-password",
  },
  aol: {
    label: "AOL Mail",
    host: "imap.aol.com",
    port: 993,
    secure: true,
    smtpHost: "smtp.aol.com",
    smtpPort: 465,
    smtpSecure: true,
    appPasswordUrl: "https://login.aol.com/account/security",
  },
  custom: {
    label: "Custom IMAP",
    host: "",
    port: 993,
    secure: true,
    smtpHost: "",
    smtpPort: 465,
    smtpSecure: true,
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
    <div className="grid min-h-svh place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={12} /> Back
        </Link>

        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          <Server size={12} className="text-accent" /> IMAP
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
          Add a mailbox
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          For Yahoo and AOL, use an <strong className="text-fg">app password</strong> — not your
          account password.
        </p>

        <form action={action} className="mt-6 grid gap-4">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PRESETS) as Preset[]).map((k) => (
              <label
                key={k}
                className={`cursor-pointer rounded-md border px-3 py-2.5 text-center text-xs transition-colors ${
                  preset === k
                    ? "border-accent/40 bg-accent/10 text-accent"
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
                {PRESETS[k].label.replace(" Mail", "")}
              </label>
            ))}
          </div>

          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yahoo.com"
          />
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="App password"
          />
          {p.appPasswordUrl && (
            <a
              href={p.appPasswordUrl}
              target="_blank"
              rel="noreferrer"
              className="-mt-2 inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-accent"
            >
              <ExternalLink size={11} /> Generate {p.label} app password
            </a>
          )}

          <details key={preset} className="rounded-md border border-border bg-surface px-3 py-2.5" open={preset === "custom"}>
            <summary className="cursor-pointer select-none text-xs text-fg-muted hover:text-fg">
              Server settings
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
                  defaultChecked={p.secure}
                  className="h-4 w-4 rounded border-border"
                />
                IMAP uses TLS
              </label>
              <label className="flex items-center gap-2 text-xs text-fg-muted">
                <input
                  type="checkbox"
                  name="smtpSecure"
                  defaultChecked={p.smtpSecure}
                  className="h-4 w-4 rounded border-border"
                />
                SMTP uses implicit TLS (off = STARTTLS, e.g. port 587)
              </label>
            </div>
          </details>

          {state.error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {state.error}
            </div>
          )}

          <Button type="submit" disabled={pending} size="lg" className="mt-2 w-full">
            {pending ? "Connecting…" : "Connect mailbox"}
          </Button>

          <p className="text-center text-[11px] text-fg-muted">
            Credentials are AES-256-GCM encrypted in an httpOnly cookie. No
            database.
          </p>
        </form>
      </div>
    </div>
  );
}
