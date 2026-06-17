import { BRAND_META, type ProviderBrand } from "@/lib/email/provider-brand";

// A quiet "which account did this land in" source label for the unified inbox.
export function ProviderTag({ brand }: { brand: ProviderBrand }) {
  const meta = BRAND_META[brand];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-subtle">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: meta.dot }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
