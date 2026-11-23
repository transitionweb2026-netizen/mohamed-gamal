import { editorBasics } from "@/lib/cms/admin/page-data";
import { getPageSections } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { MediaProvider } from "../media/media-context";
import { PageHeader } from "../ui/primitives";
import { SectionManager } from "./section-manager";

/** Editor of one of the sections shared by every page (navigation bar button, call to action, footer). */
export async function GlobalSectionEditor({ sectionKey, title, description, children }: { sectionKey: string; title: string; description: string; children?: React.ReactNode }) {
  const session = await requireAdmin();
  const [sections, basics] = await Promise.all([getPageSections(session.db, "global"), editorBasics(session)]);
  const section = sections.filter((s) => s.key === sectionKey);
  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader eyebrow="Site-wide" title={title} description={description} />
      {children}
      {section.length ? <SectionManager pageKey="global" pagePath="/" sections={section} single reorderable={false} /> : <p className="ad-muted">This section is missing from the database. Import supabase/seed/content.sql.</p>}
    </MediaProvider>
  );
}
