"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseDb } from "../db";
import { cmsMode, getSessionState, LOCAL_SESSION_COOKIE, requireAdmin } from "../session";
import { run, UserError } from "../result";
import type { ActionResult } from "../result-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only dashboard addresses are accepted as the page to return to after signing in. */
function safeNext(value: unknown): string {
  return typeof value === "string" && /^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_%-]*)?$/.test(value) ? value : "/admin";
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export interface SignInState {
  error: string | null;
}

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  if (cmsMode !== "supabase") return { error: "Supabase is not connected yet." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // One message for every failure, so the form does not reveal which accounts exist.
    return { error: error?.status === 429 ? "Too many attempts. Wait a few minutes and try again." : "The email or password is incorrect." };
  }
  const db = supabaseDb(supabase);
  const { rows } = await db.select<{ user_id: string }>("admins", { columns: "user_id", where: { user_id: data.user.id } });
  if (!rows.length) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the dashboard. Ask the website owner to grant it." };
  }
  await db.rpc("log_event", { p_action: "sign_in", p_entity_type: "admins", p_entity_id: data.user.id, p_label: email, p_details: {} }).catch(() => undefined);
  redirect(safeNext(form.get("next")));
}

/** Development only: signs in as the local administrator of the local database. */
export async function signInLocal(form: FormData): Promise<void> {
  if (cmsMode !== "local") redirect("/admin/login");
  (await cookies()).set(LOCAL_SESSION_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", secure: false });
  redirect(safeNext(form.get("next")));
}

export async function signOut(): Promise<void> {
  if (cmsMode === "local") (await cookies()).delete(LOCAL_SESSION_COOKIE);
  if (cmsMode === "supabase") await (await createSupabaseServerClient()).auth.signOut();
  redirect("/admin/login?signed-out=1");
}

/** Sends a password-reset email. The answer is the same whether or not the account exists. */
export async function requestPasswordReset(_prev: SignInState & { sent?: boolean }, form: FormData): Promise<SignInState & { sent?: boolean }> {
  if (cmsMode !== "supabase") return { error: "Supabase is not connected yet." };
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await requestOrigin()}/admin/auth/confirm?next=${encodeURIComponent("/admin/account?reset=1")}` });
  if (error?.status === 429) return { error: "Too many requests. Wait a few minutes and try again." };
  return { error: null, sent: true };
}

export async function updatePassword(password: string, confirm: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (session.mode !== "supabase") throw new UserError("Passwords are managed by Supabase Auth, which is not connected in local mode.");
    if (typeof password !== "string" || password.length < 10) throw new UserError("Use at least 10 characters.", [{ path: "password", message: "Use at least 10 characters." }]);
    if (password !== confirm) throw new UserError("The two passwords do not match.", [{ path: "confirm", message: "The two passwords do not match." }]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new UserError(error.message.includes("different from the old") ? "Choose a password different from the current one." : error.status === 422 ? "This password is too weak. Use a longer one." : "The password could not be changed. Sign in again and retry.");
    return undefined;
  }, "Password changed.");
}

/** For the sign-in page: whether the visitor is already signed in. */
export async function currentSessionStatus() {
  return (await getSessionState()).status;
}
