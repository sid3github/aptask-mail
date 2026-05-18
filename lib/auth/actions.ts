"use server";
import { signOut } from "./config";
import { clearImapAccount } from "./imap-session";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await clearImapAccount();
  await signOut({ redirectTo: "/" });
}

export async function signOutImapAction() {
  await clearImapAccount();
  redirect("/");
}
