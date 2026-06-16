import { Suspense } from "react";
import Link from "next/link";
import { Sparkles, Pencil } from "lucide-react";
import { AccountSwitcher } from "./AccountSwitcher";
import { SideNav } from "./SideNav";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";

type Account = { id: string; email: string; provider: string };

export function AppShell({
  children,
  accounts,
}: {
  children: React.ReactNode;
  accounts: Account[];
}) {
  return (
    <div className="min-h-svh bg-bg">
      {/* Desktop sidebar (lg+ so 768–1024 tablets keep the roomy single-column layout) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface/40 px-3 py-5 lg:flex">
        <Link href="/inbox" className="flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
            <Sparkles size={14} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            InboxIQ
          </span>
        </Link>

        <Link href="/compose" className="mt-6 block">
          <Button size="md" className="w-full">
            <Pencil size={15} /> Compose
          </Button>
        </Link>

        <div className="mt-6">
          <Suspense fallback={<NavFallback />}>
            <SideNav />
          </Suspense>
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <Suspense fallback={null}>
            <AccountSwitcher accounts={accounts} variant="sidebar" />
          </Suspense>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-svh flex-col pb-[68px] lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-bg/80 backdrop-blur-md">
          <div className="flex h-full items-center gap-3 px-4 sm:px-6">
            <Link href="/inbox" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-fg text-bg">
                <Sparkles size={14} />
              </span>
            </Link>

            <Suspense
              fallback={
                <div className="h-10 max-w-md flex-1 rounded-full border border-border bg-surface" />
              }
            >
              <SearchBar />
            </Suspense>

            <div className="lg:hidden">
              <Suspense fallback={null}>
                <AccountSwitcher accounts={accounts} />
              </Suspense>
            </div>
          </div>
        </header>

        {/* Centered on mobile/tablet; left-anchored next to the sidebar on desktop. */}
        <main className="mx-auto w-full max-w-3xl flex-1 lg:mx-0 lg:pl-8 lg:pr-6">
          {children}
        </main>
      </div>

      {/* Mobile / tablet bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bg/90 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Suspense fallback={null}>
          <SideNav orientation="horizontal" />
        </Suspense>
      </nav>
    </div>
  );
}

function NavFallback() {
  return (
    <div className="flex flex-col gap-0.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9 rounded-xl skeleton" />
      ))}
    </div>
  );
}
