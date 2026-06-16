"use server";
import { ImapFlow } from "imapflow";
import { redirect } from "next/navigation";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { writeImapAccount, PRESETS } from "@/lib/auth/imap-session";

export type ImapFormState = {
  ok?: true;
  error?: string;
};

// --- SSRF guard ---------------------------------------------------------
// A user-supplied IMAP/SMTP host must never let the server connect to its own
// internal network: loopback, RFC1918 private ranges, link-local (incl. the
// 169.254.169.254 cloud metadata endpoint) or IPv6 equivalents. We block both
// IP literals and hostnames whose DNS resolution lands in those ranges.

function ipv4InBlockedRange(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  // 127.0.0.0/8 loopback
  if (a === 127) return true;
  // 10.0.0.0/8 private
  if (a === 10) return true;
  // 172.16.0.0/12 private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 private
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 link-local (incl. 169.254.169.254 metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 "this host"
  if (a === 0) return true;
  return false;
}

function ipv6InBlockedRange(raw: string): boolean {
  let ip = raw.toLowerCase();
  // Strip a zone id (e.g. fe80::1%eth0) if present.
  const pct = ip.indexOf("%");
  if (pct !== -1) ip = ip.slice(0, pct);
  // ::1 loopback and unspecified ::
  if (ip === "::1" || ip === "::") return true;
  // IPv4-mapped / -compatible (e.g. ::ffff:127.0.0.1) — check the embedded v4.
  const lastColon = ip.lastIndexOf(":");
  if (lastColon !== -1) {
    const tail = ip.slice(lastColon + 1);
    if (tail.includes(".") && ipv4InBlockedRange(tail)) return true;
  }
  // fc00::/7 unique local (fc.. / fd..)
  if (/^f[cd][0-9a-f]*:/.test(ip)) return true;
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]*:/.test(ip)) return true;
  return false;
}

function ipIsBlocked(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return ipv4InBlockedRange(ip);
  if (family === 6) return ipv6InBlockedRange(ip);
  return false;
}

/**
 * Returns true when the host is safe to connect to, false when it resolves to
 * (or is literally) an internal/loopback/link-local/metadata address.
 */
async function isHostAllowed(host: string): Promise<boolean> {
  const h = host.trim().toLowerCase().replace(/\.$/, "");
  if (!h) return false;
  // Block obvious local names outright.
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) {
    return false;
  }
  // IP literal? Validate directly without DNS.
  if (net.isIP(h) !== 0) {
    return !ipIsBlocked(h);
  }
  // Otherwise resolve and reject if ANY A/AAAA record is in a blocked range.
  try {
    const records = await lookup(h, { all: true });
    if (records.length === 0) return false;
    return records.every((r) => !ipIsBlocked(r.address));
  } catch {
    // Could not resolve — refuse rather than risk a surprising connection.
    return false;
  }
}

export async function imapSignIn(
  _prev: ImapFormState,
  formData: FormData,
): Promise<ImapFormState> {
  const presetKey = String(formData.get("preset") ?? "custom") as "yahoo" | "aol" | "custom";
  const preset = PRESETS[presetKey] ?? PRESETS.custom;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const host = String(formData.get("host") || preset.host).trim();
  const port = Number(formData.get("port") || preset.port);
  // Unchecked checkboxes submit nothing, so "on" means checked.
  const secure = formData.get("secure") === "on";
  const smtpHost = String(formData.get("smtpHost") || preset.smtpHost).trim();
  const smtpPort = Number(formData.get("smtpPort") || preset.smtpPort);
  const smtpSecure = formData.get("smtpSecure") === "on";

  if (!email || !password || !host || !smtpHost) {
    return { error: "Email, password, IMAP host and SMTP host are all required." };
  }

  // SSRF guard: refuse to connect to internal/loopback/link-local/metadata
  // hosts. Validate both the IMAP and SMTP host before any socket is opened.
  for (const candidate of [host, smtpHost]) {
    if (!(await isHostAllowed(candidate))) {
      return {
        error: `The host "${candidate}" is not allowed. Enter a public mail server hostname (no localhost or internal/private addresses).`,
      };
    }
  }

  // Verify the credentials by attempting a real IMAP login.
  const probe = new ImapFlow({
    host,
    port,
    secure,
    auth: { user: email, pass: password },
    logger: false,
  });
  try {
    await probe.connect();
    await probe.logout();
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `IMAP connection failed: ${e.message}. For Yahoo/AOL use an app password, not your account password.`
          : "IMAP connection failed.",
    };
  }

  const accountId = `imap:${email}`;
  await writeImapAccount({
    accountId,
    displayEmail: email,
    preset: presetKey,
    host,
    port,
    secure,
    user: email,
    pass: password,
    smtpHost,
    smtpPort,
    smtpSecure,
  });

  redirect("/inbox");
}
