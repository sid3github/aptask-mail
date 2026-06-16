import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
  {
    variants: {
      tone: {
        urgent: "bg-danger/10 text-danger",
        important: "bg-accent/10 text-accent",
        newsletter: "bg-fg-muted/15 text-fg-muted",
        // amber token is too light on a pale tint for AA text; deepen the text.
        promo: "bg-amber/15 text-[#8a5a12] dark:text-amber",
        other: "bg-fg-muted/15 text-fg-muted",
        neutral: "bg-surface-2 text-fg-muted",
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
