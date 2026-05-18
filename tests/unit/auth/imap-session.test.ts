import { describe, it, expect, beforeAll } from "vitest";
import { encryptAccount, decryptAccount, type ImapAccount } from "@/lib/auth/imap-session";

beforeAll(() => {
  process.env.IMAP_ENCRYPTION_KEY =
    "c1ae1ddd8172a09a547b0e9cc7e91d1bba031b6779422cea0b87946f6f556cf0";
});

const sample: ImapAccount = {
  accountId: "imap:test@yahoo.com",
  displayEmail: "test@yahoo.com",
  preset: "yahoo",
  host: "imap.mail.yahoo.com",
  port: 993,
  secure: true,
  user: "test@yahoo.com",
  pass: "app-password-1234",
  smtpHost: "smtp.mail.yahoo.com",
  smtpPort: 465,
  smtpSecure: true,
};

describe("imap-session encryption", () => {
  it("round-trips an account through encrypt+decrypt", () => {
    const enc = encryptAccount(sample);
    expect(typeof enc).toBe("string");
    expect(enc).not.toContain("app-password-1234");
    const dec = decryptAccount(enc);
    expect(dec).toEqual(sample);
  });

  it("returns null on tampered ciphertext", () => {
    const enc = encryptAccount(sample);
    // Flip a char in the middle of the payload — AES-GCM authentication should fail.
    const mid = Math.floor(enc.length / 2);
    const flipped = enc.slice(0, mid) + (enc[mid] === "A" ? "B" : "A") + enc.slice(mid + 1);
    expect(decryptAccount(flipped)).toBeNull();
  });

  it("returns null on garbage input", () => {
    expect(decryptAccount("not-base64-at-all")).toBeNull();
    expect(decryptAccount("AAAA")).toBeNull();
  });
});
