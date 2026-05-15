import type { EmailMessage } from "@/lib/email/providers/types";
import { EmailRow } from "./EmailRow";

export function EmailList({ messages }: { messages: EmailMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center px-6 text-center">
        <div
          className="mb-3 text-4xl"
          aria-hidden
        >
          🪄
        </div>
        <h3 className="mb-1 text-base font-semibold text-fg">
          Inbox zero
        </h3>
        <p className="text-sm text-fg-muted">
          You&apos;re caught up. Nothing here.
        </p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col">
      {messages.map((m) => (
        <li key={m.id}>
          <EmailRow message={m} />
        </li>
      ))}
    </ul>
  );
}
