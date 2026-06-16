"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement | null;
    const q = (input?.value ?? "").trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="flex h-10 max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm transition-colors focus-within:border-fg-subtle hover:border-fg-subtle"
    >
      <button
        type="submit"
        aria-label="Search mail"
        className="grid place-items-center text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <Search size={14} />
      </button>
      {/* Uncontrolled + keyed to the URL query so it resets on navigation
          without a state-sync effect. */}
      <input
        key={initial}
        name="q"
        type="search"
        defaultValue={initial}
        placeholder="Search mail"
        aria-label="Search mail"
        className="min-w-0 flex-1 bg-transparent text-fg placeholder:text-fg-subtle focus:outline-none"
      />
    </form>
  );
}
