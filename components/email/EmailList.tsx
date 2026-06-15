import type { EmailMessage } from "@/lib/email/providers/types";
import { EmailRow } from "./EmailRow";

export function EmailList({ messages }: { messages: EmailMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-2xl">
          🪄
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-fg">
          Inbox zero
        </h3>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">
          You&apos;re all caught up. Nothing here needs you right now.
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {messages.map((m) => (
        <li key={m.id}>
          <EmailRow message={m} />
        </li>
      ))}
    </ul>
  );
}
