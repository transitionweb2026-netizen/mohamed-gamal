import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getPage, getPageSections } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { pageDef } from "@/lib/cms/registry";
import { MediaProvider } from "@/components/admin/media/media-context";
import { SectionManager } from "@/components/admin/sections/section-manager";
import { PageHeader } from "@/components/admin/ui/primitives";

export async function generateMetadata({ params }: PageProps<"/admin/pages/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: pageDef(key)?.label ?? "Page" };
}

export default async function PageSectionsPage({ params }: PageProps<"/admin/pages/[key]">) {
  const { key } = await params;
  const def = pageDef(key);
  if (!def) notFound();
  const session = await requireAdmin();
  const [page, sections, basics] = await Promise.all([getPage(session.db, key), getPageSections(session.db, key), editorBasics(session)]);
  if (!page) notFound();

  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader
        eyebrow={def.path === null ? "Shared sections" : `Page · ${def.path}`}
        title={page.name_en || def.label}
        description={
          def.path === null
            ? "Sections shown on every page: the navigation bar button, the call to action before the footer and the footer."
            : "Edit each section in Arabic and English. Changes are saved as drafts until you publish them; drag sections to change their order."
        }
        actions={
          def.path !== null ? (
            <Link href={`/admin/seo/${key}`} className="ad-btn ad-btn-ghost">
              <Search size={16} /> Page SEO
            </Link>
          ) : null
        }
      />
      <SectionManager pageKey={key} pagePath={def.path} sections={sections} reorderable={def.path !== null} />
    </MediaProvider>
  );
}
