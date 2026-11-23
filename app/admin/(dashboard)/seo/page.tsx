import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck, CircleDashed } from "lucide-react";
import { saveSettings } from "@/lib/cms/admin/actions/settings";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getSettingsDoc, listPages } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { FieldsForm } from "@/components/admin/form/fields-form";
import { MediaProvider } from "@/components/admin/media/media-context";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "SEO" };

const KEYS = ["defaultTitle", "defaultDescription", "ogImage", "siteUrl", "robotsIndex"];

export default async function SeoPage() {
  const session = await requireAdmin();
  const [{ fields, doc }, pages, basics] = await Promise.all([getSettingsDoc(session.db, KEYS), listPages(session.db), editorBasics(session)]);
  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader eyebrow="Site-wide" title="SEO" description="How the website appears in search engines and when shared on social media. Each page can override the defaults; articles have their own SEO fields." />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <FieldsForm fields={fields} initial={doc} action={saveSettings.bind(null, KEYS)} title="Defaults for the whole website" />
        <section className="ad-card ad-card-pad">
          <h2 className="ad-h2">Pages</h2>
          <p className="ad-muted mt-1 text-sm">Search title and description of each page.</p>
          <ul className="mt-4 space-y-1.5">
            {pages
              .filter((p) => p.path !== null)
              .map((p) => {
                const complete = p.seo_title_ar && p.seo_title_en && p.seo_description_ar && p.seo_description_en;
                return (
                  <li key={p.key}>
                    <Link href={`/admin/seo/${p.key}`} className="ad-menu-item justify-between">
                      <span className="flex min-w-0 items-center gap-2">
                        {complete ? <CircleCheck size={16} className="shrink-0 text-[var(--ok)]" /> : <CircleDashed size={16} className="shrink-0 text-[var(--warn)]" />}
                        <span className="truncate font-medium">{p.name_en || p.key}</span>
                        <code className="ad-muted text-xs">{p.path}</code>
                      </span>
                      <ArrowRight size={15} className="ad-muted shrink-0" />
                    </Link>
                  </li>
                );
              })}
          </ul>
          <p className="ad-muted mt-4 text-xs">A dashed circle means a search title or description is missing in one language (the defaults are used instead).</p>
        </section>
      </div>
    </MediaProvider>
  );
}
