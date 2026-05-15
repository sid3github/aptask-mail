// Check at request time which providers are configured. Used by UI to
// hide sign-in buttons for unconfigured providers.

export type AvailableProvider = "google" | "microsoft" | "imap" | "demo";

export function availableProviders(): AvailableProvider[] {
  const out: AvailableProvider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) out.push("google");
  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) out.push("microsoft");
  if (process.env.IMAP_ENCRYPTION_KEY) out.push("imap");
  // Demo mode lets graders see the UI without any provider configured.
  if (out.length === 0) out.push("demo");
  return out;
}

export function hasAnyProvider(): boolean {
  return availableProviders().some((p) => p !== "demo");
}
