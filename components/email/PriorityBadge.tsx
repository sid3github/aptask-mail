import { Badge } from "@/components/ui/badge";
import type { AiPriority } from "@/lib/email/providers/types";

const LABEL: Record<AiPriority, string> = {
  urgent: "Urgent",
  important: "Important",
  newsletter: "Newsletter",
  promo: "Promo",
  other: "Other",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: AiPriority;
  className?: string;
}) {
  return (
    <Badge tone={priority} className={className}>
      {LABEL[priority]}
    </Badge>
  );
}
