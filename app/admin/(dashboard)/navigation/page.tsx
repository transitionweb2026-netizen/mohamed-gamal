import type { Metadata } from "next";
import { listNavigation } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { GlobalSectionEditor } from "@/components/admin/sections/global-section";
import { NavigationManager } from "@/components/admin/settings/navigation-manager";

export const metadata: Metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const session = await requireAdmin();
  const items = await listNavigation(session.db);
  return (
    <GlobalSectionEditor sectionKey="navbar" title="Navigation" description="The links of the navigation bar (with dropdowns) and of the footer, and the booking button at the end of the navigation bar.">
      <div className="mb-5">
        <NavigationManager items={items} />
      </div>
      <h2 className="ad-h2 mb-3">Booking button</h2>
    </GlobalSectionEditor>
  );
}
