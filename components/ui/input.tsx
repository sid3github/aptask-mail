import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-fg placeholder:text-fg-muted transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed text-fg placeholder:text-fg-muted transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
