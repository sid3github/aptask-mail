import { notFound } from "next/navigation";
import { MessageView } from "@/components/email/MessageView";
import { AppShell } from "@/components/layout/AppShell";
import { DEMO_MESSAGES, DEMO_ACCOUNT_ID } from "@/lib/email/demo-data";
import { auth } from "@/lib/auth/config";
import { GmailProvider } from "@/lib/email/providers/gmail";
import type { EmailMessage } from "@/lib/email/providers/types";

export const dynamic = "force-dynamic";

async function loadMessage(id: string): Promise<EmailMessage | null> {
  if (id.startsWith("demo:")) {
    return DEMO_MESSAGES.find((m) => m.id === id) ?? null;
  }
  const session = await auth();
  if (session?.accessToken && id.startsWith("gmail:")) {
    try {
      const provider = new GmailProvider(
        session.user?.email ?? "gmail",
        session.accessToken,
      );
      return await provider.getMessage(id);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const message = await loadMessage(decoded);
  if (!message) notFound();

  const accounts = message.id.startsWith("demo:")
    ? [{ id: DEMO_ACCOUNT_ID, email: "inbox@inboxiq.app", provider: "demo" }]
    : [
        {
          id: message.accountId,
          email: message.accountId,
          provider: message.id.startsWith("gmail:") ? "gmail" : "imap",
        },
      ];

  return (
    <AppShell accounts={accounts}>
      <MessageView message={message} />
    </AppShell>
  );
}
