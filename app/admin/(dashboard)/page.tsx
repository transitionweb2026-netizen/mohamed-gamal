import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, FileClock, FilePlus2, FileText, Images, Info, LayoutTemplate, UploadCloud, Video } from "lucide-react";
import { adminLang } from "@/lib/cms/admin/page-data";
import { getDashboardStats, getSettings, listActivity } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { formatBytes } from "@/lib/cms/media-rules";
import { pageDef } from "@/lib/cms/registry";
import { ActivityChart } from "@/components/admin/overview/activity-chart";
import { previewHref } from "@/components/admin/shell/preview";
import { TimeAgo } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Overview" };

const COLLECTION_LINKS = [
  { key: "services", label: "Services", href: "/admin/services" },
  { key: "conditions", label: "Conditions", href: "/admin/conditions" },
  { key: "videos", label: "Videos", href: "/admin/videos" },
  { key: "articles", label: "Articles", href: "/admin/articles" },
  { key: "testimonials", label: "Testimonials", href: "/admin/testimonials" },
  { key: "faqs", label: "FAQs", href: "/admin/faqs" },
] as const;

const ACTION_LABEL: Record<string, string> = {
  create: "created",
  update: "edited",
  delete: "deleted",
  publish: "published",
  unpublish: "unpublished",
  save_draft: "saved a draft of",
  discard_draft: "discarded the draft of",
  reorder: "reordered",
  show: "showed",
  hide: "hid",
  upload: "uploaded",
  replace: "replaced",
  sign_in: "signed in",
  grant: "granted access to",
  revoke: "removed access of",
};

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  const session = await requireAdmin();
  const [stats, activity, lang, query] = await Promise.all([getDashboardStats(session.db), listActivity(session.db, { pageSize: 8 }), adminLang(), searchParams]);
  const [{ rows: missingIds }, { rows: noAlt }, settings, { rows: socials }] = await Promise.all([
    session.db.select<{ id: string }>("videos", { columns: "id", where: { status: "published", source: "youtube", youtube_id: null } }),
    session.db.select<{ id: string }>("media", { columns: "id", where: { kind: "image", alt_en: "", alt_ar: "" } }),
    getSettings(session.db),
    session.db.select<{ url: string }>("social_links", { columns: "url", where: { visible: true } }),
  ]);
  // Values still holding the "[[…]]" placeholders of the original content, and social links to a platform's home page instead of a profile.
  const placeholderContact = [settings.address_ar, settings.address_en, settings.hours_ar, settings.hours_en].some((v) => v.includes("[["));
  const genericSocials = socials.filter((s) => /^https:\/\/[^/]+\/?$/.test(s.url)).length;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Cairo" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const health = [
    stats.pendingDrafts
      ? { tone: "warn", text: `${stats.pendingDrafts} section draft${stats.pendingDrafts === 1 ? " is" : "s are"} waiting to be published.`, href: "/admin/pages" }
      : { tone: "ok", text: "All section edits are published.", href: "/admin/pages" },
    stats.placeholderTestimonials ? { tone: "warn", text: `${stats.placeholderTestimonials} placeholder testimonial${stats.placeholderTestimonials === 1 ? " is" : "s are"} published. Replace with real, consented testimonials or unpublish.`, href: "/admin/testimonials" } : null,
    missingIds.length ? { tone: "info", text: `${missingIds.length} published video${missingIds.length === 1 ? " has" : "s have"} no YouTube ID yet (shown as “coming soon”).`, href: "/admin/videos" } : null,
    noAlt.length ? { tone: "info", text: `${noAlt.length} image${noAlt.length === 1 ? " has" : "s have"} no description for screen readers.`, href: "/admin/media?kind=image" } : null,
    placeholderContact ? { tone: "warn", text: "The clinic address and working hours are still placeholders ([[…]]). Add the real details.", href: "/admin/contact" } : null,
    genericSocials ? { tone: "warn", text: `${genericSocials} social link${genericSocials === 1 ? " points" : "s point"} to the platform's home page, not the clinic's profile.`, href: "/admin/social" } : null,
    stats.hiddenSections ? { tone: "info", text: `${stats.hiddenSections} section${stats.hiddenSections === 1 ? " is" : "s are"} hidden from the website.`, href: "/admin/pages" } : null,
  ].filter((h): h is { tone: string; text: string; href: string } => !!h);

  const tiles = [
    { label: "Website pages", value: stats.pages, detail: `${stats.sections} sections`, href: "/admin/pages", icon: LayoutTemplate },
    { label: "Unpublished drafts", value: stats.pendingDrafts, detail: stats.pendingDrafts ? "Visitors see the published version" : "Everything is live", href: "/admin/pages", icon: FileClock, warn: stats.pendingDrafts > 0 },
    { label: "Articles", value: stats.collections.articles.published, detail: `${stats.collections.articles.draft} draft${stats.collections.articles.draft === 1 ? "" : "s"}`, href: "/admin/articles", icon: FileText },
    { label: "Videos", value: stats.collections.videos.published, detail: `${stats.collections.videos.draft} draft${stats.collections.videos.draft === 1 ? "" : "s"}`, href: "/admin/videos", icon: Video },
    { label: "Media files", value: stats.media.total, detail: `${formatBytes(stats.media.uploadedBytes)} uploaded`, href: "/admin/media", icon: Images },
  ];

  return (
    <>
      {query.denied === "owner" ? <p className="mb-4 rounded-xl bg-[var(--warn-bg)] px-4 py-2.5 text-sm text-[var(--warn)]">Only owners can manage administrators.</p> : null}
      <section className="ad-ink-card mb-6 p-6 md:p-8">
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ad-eyebrow !text-aqua-400">Overview</p>
            <h1 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
              {greeting}
              {session.displayName ? `, ${session.displayName}` : ""}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">Edit the website in Arabic and English, preview your drafts, then publish them.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/articles/new" className="ad-btn ad-btn-accent">
              <FilePlus2 size={16} /> New article
            </Link>
            <Link href="/admin/media?upload=1" className="ad-btn border-white/20 bg-white/10 text-white hover:bg-white/15">
              <UploadCloud size={16} /> Upload media
            </Link>
            <a href={previewHref(lang, "/")} target="_blank" rel="noreferrer" className="ad-btn border-white/20 bg-white/10 text-white hover:bg-white/15">
              <ExternalLink size={16} /> Preview website
            </a>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="ad-card group flex flex-col gap-1 px-4 py-4 transition hover:-translate-y-0.5">
            <span className="flex items-center justify-between">
              <span className="ad-muted text-sm">{t.label}</span>
              <span className={`grid size-8 place-items-center rounded-lg ${t.warn ? "bg-[var(--warn-bg)] text-[var(--warn)]" : "bg-aqua-100 text-aqua-700"}`}>
                <t.icon size={16} />
              </span>
            </span>
            <span className="font-display text-3xl font-semibold tabular-nums">{t.value.toLocaleString("en")}</span>
            <span className={`text-xs ${t.warn ? "text-[var(--warn)]" : "ad-muted"}`}>{t.detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <ActivityChart data={stats.activityByDay} />

          <section className="ad-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="ad-h2">Content</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Collection</th>
                    <th className="text-end">Published</th>
                    <th className="text-end">Drafts</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {COLLECTION_LINKS.map((c) => (
                    <tr key={c.key}>
                      <td className="font-medium">{c.label}</td>
                      <td className="text-end tabular-nums">{stats.collections[c.key].published}</td>
                      <td className="text-end tabular-nums">{stats.collections[c.key].draft ? <span className="ad-badge ad-badge-warn">{stats.collections[c.key].draft}</span> : <span className="ad-muted">0</span>}</td>
                      <td className="text-end">
                        <Link href={c.href} className="ad-btn ad-btn-quiet ad-btn-sm">
                          Manage <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="ad-card ad-card-pad">
            <h2 className="ad-h2 mb-3">Content health</h2>
            <ul className="space-y-2">
              {health.map((h) => (
                <li key={h.text}>
                  <Link href={h.href} className="flex items-start gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-ink-900/5">
                    {h.tone === "ok" ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--ok)]" /> : h.tone === "warn" ? <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[var(--warn)]" /> : <Info size={17} className="mt-0.5 shrink-0 text-aqua-700" />}
                    <span>{h.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="ad-card ad-card-pad">
            <h2 className="ad-h2 mb-3">Recently edited sections</h2>
            <ul className="space-y-1">
              {stats.lastUpdated.map((u) => {
                const [, key] = u.label.split(" › ");
                return (
                  <li key={u.id}>
                    <Link href={`/admin/pages/${u.page}#section-${key}`} className="ad-menu-item">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {pageDef(u.page)?.label ?? u.page} › {pageDef(u.page)?.sections.find((s) => s.key === key)?.label ?? key}
                        </span>
                        <span className="ad-muted text-xs">
                          <TimeAgo value={u.updated_at} />
                        </span>
                      </span>
                      {u.draft ? <span className="ad-badge ad-badge-warn">Draft</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ad-card ad-card-pad">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="ad-h2">Recent activity</h2>
              <Link href="/admin/activity" className="text-sm font-medium text-aqua-700 hover:underline">
                See all
              </Link>
            </div>
            {activity.rows.length ? (
              <ul className="space-y-3">
                {activity.rows.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-aqua-600" />
                    <span className="min-w-0">
                      <span className="font-medium">{a.actor_email.split("@")[0] || "Someone"}</span> {ACTION_LABEL[a.action] ?? a.action} <span className="font-medium">{a.entity_label}</span>
                      <span className="ad-muted block text-xs">
                        <TimeAgo value={a.created_at} />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-muted text-sm">No changes yet. Edits made in the dashboard will appear here.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
