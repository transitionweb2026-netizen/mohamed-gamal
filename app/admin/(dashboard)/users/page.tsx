import type { Metadata } from "next";
import { listAdmins } from "@/lib/cms/admin/repo";
import { requireOwner } from "@/lib/cms/admin/session";
import { UsersManager } from "@/components/admin/settings/users-manager";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await requireOwner();
  const admins = await listAdmins(session.db);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" description="Who can sign in to this dashboard. There is no public sign-up: accounts are created in Supabase and given access here." />
      <UsersManager admins={admins} currentUserId={session.userId} mode={session.mode} />
    </>
  );
}
