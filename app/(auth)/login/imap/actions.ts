"use server";
import { ImapFlow } from "imapflow";
import { redirect } from "next/navigation";
import { writeImapAccount, PRESETS } from "@/lib/auth/imap-session";

export type ImapFormState = {
  ok?: true;
  error?: string;
};

export async function imapSignIn(
  _prev: ImapFormState,
  formData: FormData,
): Promise<ImapFormState> {
  const presetKey = String(formData.get("preset") ?? "custom") as "yahoo" | "aol" | "custom";
  const preset = PRESETS[presetKey] ?? PRESETS.custom;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const host = String(formData.get("host") ?? preset.host).trim();
  const port = Number(formData.get("port") ?? preset.port);
  const secure = formData.get("secure") !== "off";
  const smtpHost = String(formData.get("smtpHost") ?? preset.smtpHost).trim();
  const smtpPort = Number(formData.get("smtpPort") ?? preset.smtpPort);
  const smtpSecure = formData.get("smtpSecure") !== "off";

  if (!email || !password || !host || !smtpHost) {
    return { error: "Email, password, IMAP host and SMTP host are all required." };
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
