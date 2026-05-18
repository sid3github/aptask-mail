import { notFound } from "next/navigation";
import { MessageView } from "@/components/email/MessageView";
import { AppShell } from "@/components/layout/AppShell";
import { DEMO_MESSAGES, DEMO_ACCOUNT_ID } from "@/lib/email/demo-data";
import { providerForMessageId, resolveProviders } from "@/lib/email/load";
import type { EmailMessage } from "@/lib/email/providers/types";

export const dynamic = "force-dynamic";

async function loadMessage(id: string): Promise<EmailMessage | null> {
  if (id.startsWith("demo:")) {
    return DEMO_MESSAGES.find((m) => m.id === id) ?? null;
  }
  const provider = await providerForMessageId(id);
  if (!provider) return null;
  try {
    return await provider.getMessage(id);
  } catch {
    return null;
  }
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

  const { accounts } = await resolveProviders();
  const list =
    accounts.length > 0
      ? accounts
      : [{ id: DEMO_ACCOUNT_ID, email: "inbox@inboxiq.app", provider: "demo" as const }];

  return (
    <AppShell accounts={list}>
      <MessageView message={message} />
    </AppShell>
  );
}
