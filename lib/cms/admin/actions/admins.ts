"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/cms/fields";
import { requireAdmin, requireOwner } from "../session";
import { run, UserError } from "../result";
import type { ActionResult } from "../result-types";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Gives an existing Supabase Auth user access to the dashboard (owners only).
 * Accounts themselves are created in Supabase (Authentication → Users), never
 * through a public sign-up form.
 */
export async function grantAccess(email: string, role: "owner" | "editor", displayName: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireOwner();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL.test(clean)) throw new UserError("Enter a valid email address.", [{ path: "email", message: "Enter a valid email address." }]);
    if (role !== "owner" && role !== "editor") throw new UserError("Choose a role.");
    await session.db.rpc("admin_grant", { p_email: clean, p_role: role, p_display_name: typeof displayName === "string" ? displayName.trim().slice(0, 80) : "" });
    revalidatePath("/admin/users");
    return undefined;
  }, "Access granted.");
}

export async function changeRole(userId: string, email: string, role: "owner" | "editor"): Promise<ActionResult> {
  return run(async () => {
    const session = await requireOwner();
    if (!isUuid(userId) || (role !== "owner" && role !== "editor")) throw new UserError("Invalid request.");
    if (userId === session.userId && role !== "owner") throw new UserError("You cannot remove your own owner role. Ask another owner to do it.");
    await session.db.rpc("admin_grant", { p_email: email, p_role: role, p_display_name: "" });
    revalidatePath("/admin/users");
    return undefined;
  }, "Role updated.");
}

export async function revokeAccess(userId: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireOwner();
    if (!isUuid(userId)) throw new UserError("Invalid request.");
    if (userId === session.userId) throw new UserError("You cannot remove your own access.");
    await session.db.rpc("admin_revoke", { p_user_id: userId });
    revalidatePath("/admin/users");
    return undefined;
  }, "Access removed. The account can no longer open the dashboard.");
}

export async function updateDisplayName(name: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    const clean = typeof name === "string" ? name.trim().slice(0, 80) : "";
    await session.db.update("admins", { user_id: session.userId }, { display_name: clean });
    revalidatePath("/admin", "layout");
    return undefined;
  }, "Name saved.");
}
