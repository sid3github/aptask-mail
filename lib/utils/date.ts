import { format, formatDistanceToNow, isThisYear, isToday, isYesterday } from "date-fns";

export function emailDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MM/dd/yy");
}

export function emailDateFull(iso: string): string {
  const d = new Date(iso);
  return format(d, "EEE, MMM d, yyyy 'at' h:mm a");
}

export function relativeDate(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
