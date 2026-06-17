"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, Star, Send, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/inbox", label: "Inbox", icon: Inbox, key: "INBOX" },
  { href: "/inbox?label=STARRED", label: "Starred", icon: Star, key: "STARRED" },
  { href: "/inbox?label=SENT", label: "Sent", icon: Send, key: "SENT" },
] as const;

// `useLinkStatus` only works inside a <Link>, so the visual state lives in these
// inner components. The clicked tab flips to its active style and swaps its icon
// for a spinner the instant navigation starts — instant feedback even while the
// provider fetch is still in flight.

function VerticalInner({
  Icon,
  label,
  active,
}: {
  Icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const on = active || pending;
  return (
    <span
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        on
          ? "bg-accent-soft text-accent"
          : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {pending ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
      )}
      {label}
    </span>
  );
}

function HorizontalInner({
  Icon,
  label,
  active,
}: {
  Icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const on = active || pending;
  return (
    <span
      className={cn(
        "flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:scale-95",
        on ? "text-accent" : "text-fg-muted hover:text-fg",
      )}
    >
      {pending ? (
        <Loader2 size={19} className="animate-spin" />
      ) : (
        <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
      )}
      {label}
    </span>
  );
}

export function SideNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname.startsWith("/inbox") ? params.get("label") ?? "INBOX" : null;

  if (orientation === "horizontal") {
    return (
      <>
        {ITEMS.map((it) => (
          <Link key={it.key} href={it.href} className="contents">
            <HorizontalInner Icon={it.icon} label={it.label} active={current === it.key} />
          </Link>
        ))}
        <Link href="/compose" className="contents">
          <ComposeHorizontalInner active={pathname === "/compose"} />
        </Link>
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((it) => (
        <Link key={it.key} href={it.href}>
          <VerticalInner Icon={it.icon} label={it.label} active={current === it.key} />
        </Link>
      ))}
    </nav>
  );
}

function ComposeHorizontalInner({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  const on = active || pending;
  return (
    <span
      className={cn(
        "flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:scale-95",
        on ? "text-accent" : "text-fg-muted hover:text-fg",
      )}
    >
      {pending ? <Loader2 size={19} className="animate-spin" /> : <PencilGlyph active={active} />}
      Compose
    </span>
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
