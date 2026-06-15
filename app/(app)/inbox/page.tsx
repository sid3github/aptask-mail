import { AppShell } from "@/components/layout/AppShell";
import { EmailList } from "@/components/email/EmailList";
import { EmailListEnriched } from "@/components/email/EmailListEnriched";
import { loadInbox } from "@/lib/email/load";

export const dynamic = "force-dynamic";

const FOLDERS: Record<string, { title: string; label: string }> = {
  INBOX: { title: "Inbox", label: "INBOX" },
  STARRED: { title: "Starred", label: "STARRED" },
  SENT: { title: "Sent", label: "SENT" },
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const { label } = await searchParams;
  const folder = FOLDERS[label ?? "INBOX"] ?? FOLDERS.INBOX;
  const { messages, accounts, isDemo } = await loadInbox(25, folder.label);

  return (
    <AppShell accounts={accounts}>
      <div className="flex items-center justify-between px-4 pb-1 pt-5 sm:px-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
          {folder.title}
        </h1>
        {messages.length > 0 && (
          <span className="text-xs text-fg-muted">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
        )}
      </div>
      {isDemo ? (
        <EmailList messages={messages} />
      ) : (
        <EmailListEnriched messages={messages} />
      )}
    </AppShell>
  );
}
