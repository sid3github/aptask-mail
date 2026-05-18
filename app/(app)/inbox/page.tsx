import { AppShell } from "@/components/layout/AppShell";
import { EmailList } from "@/components/email/EmailList";
import { EmailListEnriched } from "@/components/email/EmailListEnriched";
import { loadInbox } from "@/lib/email/load";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { messages, accounts, isDemo } = await loadInbox(25);
  return (
    <AppShell accounts={accounts}>
      {isDemo ? (
        <EmailList messages={messages} />
      ) : (
        <EmailListEnriched messages={messages} />
      )}
    </AppShell>
  );
}
