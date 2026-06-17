// Shown while a message is fetched from the provider (getMessage can hit the
// network for Gmail / Graph / IMAP). The app shell lives in the persistent
// (app) layout, so this only skeletons the reading pane.
export default function MessageLoading() {
  return (
    <div className="max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="skeleton h-8 w-3/4 rounded-lg" />
      <div className="mt-5 flex items-center gap-3">
        <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-3.5 w-40 rounded" />
          <div className="skeleton mt-2 h-3 w-28 rounded" />
        </div>
      </div>
      <div className="mt-7 space-y-3 rounded-2xl border border-border p-5">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-[92%] rounded" />
        <div className="skeleton h-3.5 w-[85%] rounded" />
        <div className="skeleton h-3.5 w-2/3 rounded" />
      </div>
    </div>
  );
}
