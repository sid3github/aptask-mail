import { AppShell } from "@/components/layout/AppShell";
import { EmailList } from "@/components/email/EmailList";
import { EmailListEnriched } from "@/components/email/EmailListEnriched";
import { loadSearch, resolveProviders } from "@/lib/email/load";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    const { accounts } = await resolveProviders();
    return (
      <AppShell accounts={accounts}>
        <div className="px-4 pb-1 pt-5 sm:px-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Search
          </h1>
        </div>
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-2xl">
            🔍
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            Search your mail
          </h3>
          <p className="mt-1 max-w-xs text-sm text-fg-muted">
            Find messages by sender, subject, or content. Start typing in the
            bar above.
          </p>
        </div>
      </AppShell>
    );
  }

  const { messages, accounts, isDemo } = await loadSearch(query, 25);

  return (
    <AppShell accounts={accounts}>
      <div className="flex items-center justify-between px-4 pb-1 pt-5 sm:px-6">
        <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-fg">
          Results for &ldquo;{query}&rdquo;
        </h1>
        {messages.length > 0 && (
          <span className="shrink-0 pl-3 text-xs text-fg-muted">
            {messages.length} {messages.length === 1 ? "result" : "results"}
          </span>
        )}
      </div>
      {messages.length === 0 ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-2xl">
            🤷
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-fg">
            No matches
          </h3>
          <p className="mt-1 max-w-xs text-sm text-fg-muted">
            Nothing matched &ldquo;{query}&rdquo;. Try a different search.
          </p>
        </div>
      ) : isDemo ? (
        <EmailList messages={messages} />
      ) : (
        <EmailListEnriched key={query} messages={messages} />
      )}
    </AppShell>
  );
}
