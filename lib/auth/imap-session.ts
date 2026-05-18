// Encrypted server-side IMAP session helper. Keeps user-entered IMAP creds
// (host, port, user, password, SMTP info) inside an httpOnly cookie encrypted
// with AES-256-GCM. No DB required for the demo.

import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { ImapCredentials } from "@/lib/email/providers/imap";

const COOKIE_NAME = "iq_imap";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type ImapAccount = ImapCredentials & {
  accountId: string;
  displayEmail: string;
  preset: "yahoo" | "aol" | "custom";
};

function getKey(): Buffer {
  const raw = process.env.IMAP_ENCRYPTION_KEY;
  if (!raw) throw new Error("IMAP_ENCRYPTION_KEY is not set");
  if (raw.length !== 64) {
    throw new Error("IMAP_ENCRYPTION_KEY must be 32 bytes hex (64 chars)");
  }
  return Buffer.from(raw, "hex");
}

export function encryptAccount(account: ImapAccount): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plain = Buffer.from(JSON.stringify(account), "utf-8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  // payload = iv(12) | tag(16) | enc
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptAccount(b64: string): ImapAccount | null {
  try {
    const key = getKey();
    const buf = Buffer.from(b64, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
    dec.setAuthTag(tag);
    const plain = Buffer.concat([dec.update(enc), dec.final()]);
    return JSON.parse(plain.toString("utf-8")) as ImapAccount;
  } catch {
    return null;
  }
}

export async function readImapAccount(): Promise<ImapAccount | null> {
  const store = await cookies();
  const c = store.get(COOKIE_NAME);
  if (!c) return null;
  return decryptAccount(c.value);
}

export async function writeImapAccount(account: ImapAccount): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encryptAccount(account), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearImapAccount(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const PRESETS: Record<
  "yahoo" | "aol" | "custom",
  { label: string; host: string; port: number; secure: boolean; smtpHost: string; smtpPort: number; smtpSecure: boolean }
> = {
  yahoo: {
    label: "Yahoo Mail",
    host: "imap.mail.yahoo.com",
    port: 993,
    secure: true,
    smtpHost: "smtp.mail.yahoo.com",
    smtpPort: 465,
    smtpSecure: true,
  },
  aol: {
    label: "AOL Mail",
    host: "imap.aol.com",
    port: 993,
    secure: true,
    smtpHost: "smtp.aol.com",
    smtpPort: 465,
    smtpSecure: true,
  },
  custom: {
    label: "Custom IMAP",
    host: "",
    port: 993,
    secure: true,
    smtpHost: "",
    smtpPort: 465,
    smtpSecure: true,
  },
};
