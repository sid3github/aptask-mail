"use client";
import { useState } from "react";
import { ChevronDown, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";

type Account = { id: string; email: string; provider: string };

const PROVIDER_LABEL: Record<string, string> = {
  gmail: "Gmail",
  graph: "Outlook",
  imap: "IMAP",
  demo: "Demo",
};

export function AccountSwitcher({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);

  if (accounts.length === 0) {
    return (
      <a
        href="/login"
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
      >
        <Plus size={14} /> Add account
      </a>
    );
  }

  const current = accounts[0];
  return (
    <div className="relative">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface pl-1.5 pr-2.5 text-xs font-medium text-fg transition-colors hover:border-fg-subtle"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold uppercase text-accent">
          {current.email[0]}
        </span>
        <span className="hidden max-w-[12ch] truncate sm:inline">{current.email}</span>
        <ChevronDown size={14} className="text-fg-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="fade-in absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_24px_60px_-30px_rgb(var(--shadow-color)/0.4)]"
          >
            <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
              Accounts
            </div>
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold uppercase text-accent">
                  {a.email[0]}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-fg">{a.email}</div>
                  <div className="text-[10px] uppercase tracking-wide text-fg-subtle">
                    {PROVIDER_LABEL[a.provider] ?? a.provider}
                  </div>
                </div>
              </div>
            ))}
            <div className="my-1 h-px bg-border" />
            <a
              href="/login"
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-fg transition-colors hover:bg-surface-2"
            >
              <Plus size={15} className="text-fg-muted" /> Add another account
            </a>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl text-sm"
              >
                <LogOut size={15} className="text-fg-muted" /> Sign out
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
