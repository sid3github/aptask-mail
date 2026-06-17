// Shown while the inbox server component fetches from the providers. The app
// shell (sidebar / nav / search) lives in the persistent (app) layout, so this
// only skeletons the message area — the chrome stays put and the clicked tab
// keeps its loading spinner.
export default function InboxLoading() {
  return (
    <>
      <div className="px-4 pb-1 pt-5 sm:px-6">
        <div className="skeleton h-7 w-32 rounded-lg" />
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-4 sm:px-6">
            <div className="skeleton mt-0.5 h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton ml-auto h-3 w-12 rounded" />
              </div>
              <div className="skeleton mt-2.5 h-3.5 w-3/5 rounded" />
              <div className="skeleton mt-2 h-3 w-2/3 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
