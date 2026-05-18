import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
  {
    variants: {
      tone: {
        urgent: "bg-red-500/10 text-red-400",
        important: "bg-accent/10 text-accent",
        newsletter: "bg-fg-muted/10 text-fg-muted",
        promo: "bg-amber-500/10 text-amber-400",
        other: "bg-fg-muted/10 text-fg-muted",
        neutral: "bg-surface text-fg-muted",
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
