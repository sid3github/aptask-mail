import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import { loadAccounts } from "@/lib/email/load";
import { hasAnyProvider } from "@/lib/auth/providers-available";
import { auth } from "@/lib/auth/config";
import { readImapAccount } from "@/lib/auth/imap-session";

// Persistent shell for every authenticated view. Rendering AppShell here (rather
// than inside each page) keeps the sidebar, nav and search mounted across tab
// navigations — so switching Inbox / Starred / Sent no longer rebuilds the whole
// chrome, the per-tab loading spinner survives the transition, and only the
// message area swaps to its skeleton.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // When real providers are configured (e.g. the deployed app), require a real
  // sign-in — an unauthenticated visitor is sent to /login rather than shown a
  // half-working anonymous view. Local zero-config demo (no providers) stays open.
  if (hasAnyProvider()) {
    const signedIn = (await auth()) || (await readImapAccount());
    if (!signedIn) redirect("/login");
  }
  const accounts = await loadAccounts();
  return (
    <>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <AppShell accounts={accounts}>{children}</AppShell>
    </>
  );
}
