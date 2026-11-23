import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/cms/admin/repo";
import { cmsMode, requireAdmin } from "@/lib/cms/admin/session";
import { AdminShell } from "@/components/admin/shell/admin-shell";

/** Every dashboard page: signed-in administrators only (checked on the server). */
export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  // Always rendered per request (never prerendered): it depends on who is signed in.
  const jar = await cookies();
  if (cmsMode === "unconfigured") redirect("/admin/login");
  const session = await requireAdmin();
  const notifications = await getNotifications(session);
  return (
    <AdminShell
      user={{ email: session.email, displayName: session.displayName, role: session.role, mode: session.mode }}
      notifications={notifications}
      initialLang={jar.get("cms_admin_lang")?.value === "ar" ? "ar" : "en"}
    >
      {children}
    </AdminShell>
  );
}
