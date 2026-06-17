import { auth } from "@/lib/auth/config";
import { readImapAccount } from "@/lib/auth/imap-session";
import { hasAnyProvider } from "@/lib/auth/providers-available";

// Shared authorization gate for API routes. Fail-closed — there is deliberately
// NO `NODE_ENV !== "production"` bypass (a dev/preview deploy must not be wide
// open).
//
//   • Demo mode (no real provider configured) is a public sandbox: the AI runs
//     locally over text supplied in the request and touches no real mailbox, so
//     anonymous use is allowed — this keeps the public demo fully working in
//     every environment, including a Vercel preview/production demo build.
//   • As soon as ANY real provider is configured, a valid Auth.js session or a
//     decryptable IMAP cookie is required.
export async function isApiAuthorized(): Promise<boolean> {
  if (!hasAnyProvider()) return true;
  if (await auth()) return true;
  return (await readImapAccount()) !== null;
}
