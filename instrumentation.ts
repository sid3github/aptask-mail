// Next.js runs register() once on server startup (Node runtime). We use it to
// install process-level guards so a stray network error from a provider socket
// (IMAP "Socket timeout", ECONNRESET, etc.) can never escalate to an
// uncaughtException that crashes the whole server. Email/AI calls are already
// wrapped in try/catch + Promise.allSettled at the request layer, so swallowing
// these async socket faults here is safe and keeps the app responsive.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const NETWORK_NOISE = /socket|ECONNRESET|ETIMEDOUT|EPIPE|ECONNREFUSED|timeout|ENOTFOUND/i;

  process.on("uncaughtException", (err) => {
    const msg = String((err as Error)?.message ?? err);
    if (NETWORK_NOISE.test(msg)) {
      console.warn("[instrumentation] ignored network uncaughtException:", msg);
      return;
    }
    // Unknown faults: log loudly but stay alive in dev so the session isn't lost.
    console.error("[instrumentation] uncaughtException:", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.warn("[instrumentation] unhandledRejection:", String(reason));
  });
}
