import type { Metadata } from "next";
import { listSocials } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { SocialManager } from "@/components/admin/settings/social-manager";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Social media" };

export default async function SocialPage() {
  const session = await requireAdmin();
  const links = await listSocials(session.db);
  return (
    <>
      <PageHeader eyebrow="Site-wide" title="Social media" description="The clinic's official profiles. Only add accounts that belong to the clinic or the doctor." />
      <SocialManager links={links} />
    </>
  );
}
