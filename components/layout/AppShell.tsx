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
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-3 sm:px-5">
          <Link href="/inbox" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
              <Sparkles size={16} />
            </span>
            <span className="text-sm font-semibold tracking-tight">InboxIQ</span>
          </Link>
          <div className="ml-auto flex flex-1 items-center gap-2 sm:max-w-md">
            <Link
              href="/inbox?search=1"
              className="flex h-10 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-fg-muted hover:text-fg"
              aria-label="Search emails"
            >
              <Search size={14} />
              <span className="truncate">
                Try: &ldquo;flight emails from this month&rdquo;
              </span>
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
    { href: "/inbox", icon: <Inbox size={20} />, label: "Inbox" },
    { href: "/inbox?label=STARRED", icon: <Star size={20} />, label: "Starred" },
    { href: "/inbox?label=SENT", icon: <SendIcon size={20} />, label: "Sent" },
    { href: "/compose", icon: <Pencil size={20} />, label: "Compose" },
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
          className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-fg-muted hover:text-fg"
        >
          {it.icon}
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
