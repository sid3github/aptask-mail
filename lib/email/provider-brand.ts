import type { EmailMessage } from "./providers/types";

export type ProviderBrand = "gmail" | "outlook" | "yahoo" | "imap";

// Which mail service a message came from — drives the per-row source badge that
// makes the unified inbox legible. Real messages carry a provider-prefixed id;
// demo messages encode the account in `accountId`.
export function providerBrand(
  m: Pick<EmailMessage, "id" | "accountId">,
): ProviderBrand | null {
  if (m.id.startsWith("gmail:")) return "gmail";
  if (m.id.startsWith("graph:")) return "outlook";
  if (m.id.startsWith("imap:")) return "imap";
  if (m.accountId === "demo:gmail") return "gmail";
  if (m.accountId === "demo:outlook") return "outlook";
  if (m.accountId === "demo:yahoo") return "yahoo";
  return null;
}

export const BRAND_META: Record<ProviderBrand, { label: string; dot: string }> = {
  gmail: { label: "Gmail", dot: "#ea4335" },
  outlook: { label: "Outlook", dot: "#0a84ff" },
  yahoo: { label: "Yahoo", dot: "#7e1fff" },
  imap: { label: "IMAP", dot: "#8a8a8a" },
};
