"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/inbox", label: "Inbox", icon: Inbox, key: "INBOX" },
  { href: "/inbox?label=STARRED", label: "Starred", icon: Star, key: "STARRED" },
  { href: "/inbox?label=SENT", label: "Sent", icon: Send, key: "SENT" },
] as const;

export function SideNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname.startsWith("/inbox") ? params.get("label") ?? "INBOX" : null;

  if (orientation === "horizontal") {
    return (
      <>
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active = current === it.key;
          return (
            <Link
              key={it.key}
              href={it.href}
              className={cn(
                "flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:scale-95",
                active ? "text-accent" : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
              {it.label}
            </Link>
          );
        })}
        <Link
          href="/compose"
          className={cn(
            "flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:scale-95",
            pathname === "/compose" ? "text-accent" : "text-fg-muted hover:text-fg",
          )}
        >
          <PencilGlyph active={pathname === "/compose"} />
          Compose
        </Link>
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = current === it.key;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PencilGlyph({ active }: { active: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
