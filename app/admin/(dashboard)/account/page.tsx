import type { Metadata } from "next";
import { requireAdmin } from "@/lib/cms/admin/session";
import { AccountForms } from "@/components/admin/settings/account-forms";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const session = await requireAdmin();
  const query = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Account" title="My account" description={`Signed in as ${session.email} (${session.role === "owner" ? "owner" : "editor"}).`} />
      <AccountForms displayName={session.displayName} mode={session.mode} reset={query.reset === "1"} welcome={query.welcome === "1"} />
    </>
  );
}
