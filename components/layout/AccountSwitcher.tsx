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
        className="ml-2 inline-flex h-9 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-medium text-fg hover:bg-surface/70"
      >
        <Plus size={14} /> Add account
      </a>
    );
  }
  const current = accounts[0];
  return (
    <div className="relative">
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs font-medium text-fg hover:bg-surface/70"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-[10px] uppercase text-accent">
          {current.email[0]}
        </span>
        <span className="hidden sm:inline max-w-[10ch] truncate">{current.email}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-xl"
        >
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-fg-muted">
            Accounts
          </div>
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-bg"
            >
              <div className="min-w-0">
                <div className="truncate text-fg">{a.email}</div>
                <div className="text-[10px] uppercase tracking-wide text-fg-muted">
                  {PROVIDER_LABEL[a.provider] ?? a.provider}
                </div>
              </div>
            </div>
          ))}
          <a
            href="/login"
            className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-fg hover:bg-bg"
          >
            <Plus size={14} /> Add another account
          </a>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start text-sm"
            >
              <LogOut size={14} /> Sign out
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
