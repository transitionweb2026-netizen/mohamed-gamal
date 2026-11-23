import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseDb, type Db } from "./db";
import { isLocalCms, LOCAL_ADMIN, localDb } from "@/lib/cms/local/local-db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Who is using the dashboard. Every page and every Server Action checks this
 * on the server: a valid Supabase Auth session AND a row in public.admins.
 * The proxy's redirect is only a convenience; Row Level Security enforces the
 * same rules again inside the database.
 */

export type AdminRole = "owner" | "editor";

export interface AdminSession {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
  /** Database access as this user (RLS applies). */
  db: Db;
  mode: "supabase" | "local";
}

export type SessionState = { status: "signed-out" } | { status: "not-admin"; email: string } | { status: "admin"; session: AdminSession };

/** "local" only in development with CMS_LOCAL=1 before Supabase is connected. */
export const cmsMode: "supabase" | "local" | "unconfigured" = isSupabaseConfigured ? "supabase" : isLocalCms ? "local" : "unconfigured";

export const LOCAL_SESSION_COOKIE = "cms_local_session";

interface AdminRow {
  user_id: string;
  email: string;
  display_name: string;
  role: AdminRole;
}

export const getSessionState = cache(async (): Promise<SessionState> => {
  if (cmsMode === "local") {
    if ((await cookies()).get(LOCAL_SESSION_COOKIE)?.value !== "1") return { status: "signed-out" };
    const db = localDb({ userId: LOCAL_ADMIN.id });
    const { rows } = await db.select<AdminRow>("admins", { where: { user_id: LOCAL_ADMIN.id } });
    const admin = rows[0];
    if (!admin) return { status: "not-admin", email: LOCAL_ADMIN.email };
    return { status: "admin", session: { userId: admin.user_id, email: admin.email, displayName: admin.display_name, role: admin.role, db, mode: "local" } };
  }

  if (cmsMode === "supabase") {
    const supabase = await createSupabaseServerClient();
    // getUser() validates the session with Supabase Auth (not just the cookie).
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: "signed-out" };
    const db = supabaseDb(supabase);
    const { rows } = await db.select<AdminRow>("admins", { where: { user_id: data.user.id } });
    const admin = rows[0];
    if (!admin) return { status: "not-admin", email: data.user.email ?? "" };
    return { status: "admin", session: { userId: admin.user_id, email: admin.email, displayName: admin.display_name, role: admin.role, db, mode: "supabase" } };
  }

  return { status: "signed-out" };
});

/** The signed-in administrator, or a redirect to the sign-in page. */
export async function requireAdmin(): Promise<AdminSession> {
  const state = await getSessionState();
  if (state.status === "admin") return state.session;
  redirect(state.status === "not-admin" ? "/admin/login?reason=no-access" : "/admin/login");
}

/** Owners only (managing administrators). */
export async function requireOwner(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.role !== "owner") redirect("/admin?denied=owner");
  return session;
}
