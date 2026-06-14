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
    <div className="flex min-h-svh flex-col bg-bg pb-[72px] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/inbox" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
              <Sparkles size={14} />
            </span>
            <span className="hidden font-display text-base font-semibold tracking-tight sm:inline">
              InboxIQ
            </span>
          </Link>

          <Link
            href="/inbox?search=1"
            className="ml-auto flex h-10 max-w-sm flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-fg-subtle transition-colors hover:border-fg-subtle hover:text-fg-muted"
            aria-label="Search mail"
          >
            <Search size={14} />
            <span className="truncate">Search mail</span>
          </Link>

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
    { href: "/inbox", icon: Inbox, label: "Inbox" },
    { href: "/inbox?label=STARRED", icon: Star, label: "Starred" },
    { href: "/inbox?label=SENT", icon: SendIcon, label: "Sent" },
    { href: "/compose", icon: Pencil, label: "Compose" },
  ];
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bg/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium text-fg-muted transition-colors hover:text-fg active:scale-95"
          >
            <Icon size={19} strokeWidth={1.75} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
