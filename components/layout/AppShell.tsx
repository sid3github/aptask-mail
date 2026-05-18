import Link from "next/link";
import { Inbox, Star, Send as SendIcon, Pencil, Search, Sparkles } from "lucide-react";
import { AccountSwitcher } from "./AccountSwitcher";

export function AppShell({
  children,
  accounts,
}: {
  children: React.ReactNode;
  accounts: { id: string; email: string; provider: string }[];
}) {
  return (
    <div className="flex min-h-svh flex-col bg-bg pb-16 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/inbox" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white">
              <Sparkles size={14} />
            </span>
            <span className="hidden text-sm font-medium tracking-tight sm:inline">
              InboxIQ
            </span>
          </Link>
          <div className="ml-auto flex flex-1 items-center gap-2 sm:max-w-sm">
            <Link
              href="/inbox?search=1"
              className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-fg-muted transition-colors hover:text-fg"
              aria-label="Search emails"
            >
              <Search size={13} />
              <span className="truncate">Search mail</span>
            </Link>
          </div>
          <AccountSwitcher accounts={accounts} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>

      <MobileNav />
    </div>
  );
}

function MobileNav() {
  const items = [
    { href: "/inbox", icon: <Inbox size={18} />, label: "Inbox" },
    { href: "/inbox?label=STARRED", icon: <Star size={18} />, label: "Starred" },
    { href: "/inbox?label=SENT", icon: <SendIcon size={18} />, label: "Sent" },
    { href: "/compose", icon: <Pencil size={18} />, label: "Compose" },
  ];
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bg/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] text-fg-muted transition-colors hover:text-fg"
        >
          {it.icon}
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
