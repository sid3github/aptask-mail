import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        urgent: "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30",
        important:
          "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30",
        newsletter:
          "bg-slate-500/15 text-slate-400 ring-1 ring-inset ring-slate-500/25",
        promo: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30",
        other:
          "bg-zinc-700/40 text-zinc-300 ring-1 ring-inset ring-zinc-600/40",
        neutral:
          "bg-surface text-fg-muted ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
