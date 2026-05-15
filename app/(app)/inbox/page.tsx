import { AppShell } from "@/components/layout/AppShell";
import { EmailList } from "@/components/email/EmailList";
import { DEMO_MESSAGES, DEMO_ACCOUNT_ID } from "@/lib/email/demo-data";
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";
import type { EmailMessage } from "@/lib/email/providers/types";

export const dynamic = "force-dynamic";

async function loadMessages(): Promise<{
  messages: EmailMessage[];
  accounts: { id: string; email: string; provider: string }[];
}> {
  const session = await auth();
  if (session?.accessToken && session.provider === "google") {
    try {
      const provider = new GmailProvider(
        session.user?.email ?? "gmail",
        session.accessToken,
      );
      const r = await provider.listMessages({ limit: 25 });
      return {
        messages: r.items,
        accounts: [
          {
            id: session.user?.email ?? "gmail",
            email: session.user?.email ?? "",
            provider: "gmail",
          },
        ],
      };
    } catch {
      // fall through to demo
    }
  }
  return {
    messages: DEMO_MESSAGES,
    accounts: [{ id: DEMO_ACCOUNT_ID, email: "inbox@inboxiq.app", provider: "demo" }],
  };
}

export default async function InboxPage() {
  const { messages, accounts } = await loadMessages();
  return (
    <AppShell accounts={accounts}>
      <EmailList messages={messages} />
    </AppShell>
  );
}
