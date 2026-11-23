import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, EyeOff, FileClock, Search } from "lucide-react";
import { adminLang } from "@/lib/cms/admin/page-data";
import { listPages } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { pageDef } from "@/lib/cms/registry";
import { previewHref } from "@/components/admin/shell/preview";
import { PageHeader, TimeAgo } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Website pages" };

export default async function PagesPage() {
  const session = await requireAdmin();
  const [pages, lang] = await Promise.all([listPages(session.db), adminLang()]);
  return (
    <>
      <PageHeader eyebrow="Website content" title="Website pages" description="Every page of the website and its sections, in the order visitors see them. Open a page to edit, reorder, hide or publish its sections." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => {
          const def = pageDef(page.key);
          return (
            <article key={page.key} className="ad-card ad-card-pad flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="ad-h2 truncate">{page.name_en || def?.label || page.key}</h2>
                  <p className="ad-muted truncate text-sm" dir="rtl">
                    {page.name_ar}
                  </p>
                </div>
                <code className="ad-badge shrink-0 font-mono">{page.path ?? "every page"}</code>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/60 px-2 py-2">
                  <dt className="ad-muted text-[0.7rem]">Sections</dt>
                  <dd className="font-display text-lg font-semibold">{page.sections}</dd>
                </div>
                <div className={`rounded-xl px-2 py-2 ${page.drafts ? "bg-[var(--warn-bg)] text-[var(--warn)]" : "bg-white/60"}`}>
                  <dt className="flex items-center justify-center gap-1 text-[0.7rem] opacity-80">
                    <FileClock size={11} /> Drafts
                  </dt>
                  <dd className="font-display text-lg font-semibold">{page.drafts}</dd>
                </div>
                <div className="rounded-xl bg-white/60 px-2 py-2">
                  <dt className="ad-muted flex items-center justify-center gap-1 text-[0.7rem]">
                    <EyeOff size={11} /> Hidden
                  </dt>
                  <dd className="font-display text-lg font-semibold">{page.hidden}</dd>
                </div>
              </dl>
              <p className="ad-muted mt-3 text-xs">
                Last edited <TimeAgo value={page.lastEdited} />
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                <Link href={`/admin/pages/${page.key}`} className="ad-btn ad-btn-primary ad-btn-sm">
                  Edit sections <ArrowRight size={14} />
                </Link>
                {page.path !== null ? (
                  <>
                    <Link href={`/admin/seo/${page.key}`} className="ad-btn ad-btn-ghost ad-btn-sm">
                      <Search size={14} /> SEO
                    </Link>
                    <a href={previewHref(lang, page.path)} target="_blank" rel="noreferrer" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon ms-auto" aria-label={`Preview ${page.name_en || page.key}`} title="Preview (shows drafts)">
                      <ExternalLink size={15} />
                    </a>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
