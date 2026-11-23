import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { listActivity } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { EmptyState, PageHeader, TimeAgo } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Activity log" };

const ACTIONS: Record<string, { label: string; tone: string }> = {
  create: { label: "Created", tone: "ad-badge-aqua" },
  update: { label: "Edited", tone: "" },
  delete: { label: "Deleted", tone: "ad-badge-danger" },
  publish: { label: "Published", tone: "ad-badge-ok" },
  unpublish: { label: "Unpublished", tone: "ad-badge-warn" },
  save_draft: { label: "Saved draft", tone: "" },
  discard_draft: { label: "Discarded draft", tone: "ad-badge-warn" },
  reorder: { label: "Reordered", tone: "" },
  show: { label: "Shown", tone: "ad-badge-ok" },
  hide: { label: "Hidden", tone: "ad-badge-warn" },
  upload: { label: "Uploaded", tone: "ad-badge-aqua" },
  replace: { label: "Replaced file", tone: "ad-badge-aqua" },
  sign_in: { label: "Signed in", tone: "" },
  grant: { label: "Granted access", tone: "ad-badge-aqua" },
  revoke: { label: "Removed access", tone: "ad-badge-danger" },
};

const ENTITIES: Record<string, string> = {
  page_sections: "Section",
  section_drafts: "Section draft",
  services: "Service",
  conditions: "Condition",
  process_steps: "Treatment step",
  stats: "Statistic",
  videos: "Video",
  articles: "Article",
  article_categories: "Article category",
  testimonials: "Testimonial",
  faqs: "FAQ",
  credentials: "Credential",
  media: "Media",
  site_settings: "Settings",
  phone_numbers: "Phone number",
  social_links: "Social link",
  navigation_items: "Menu item",
  pages: "Page SEO",
  ui_strings: "Interface text",
  admins: "Administrator",
};

const PAGE_SIZE = 30;

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const session = await requireAdmin();
  const query = await searchParams;
  const action = typeof query.action === "string" && query.action in ACTIONS ? query.action : "";
  const entity = typeof query.entity === "string" && query.entity in ENTITIES ? query.entity : "";
  const page = Math.max(1, Number(query.page) || 1);
  const { rows, total } = await listActivity(session.db, { page, pageSize: PAGE_SIZE, action, entity });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (patch: Record<string, string | number>) => {
    const params = new URLSearchParams({ ...(action ? { action } : {}), ...(entity ? { entity } : {}), page: String(page), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...params]) if (!v || (k === "page" && v === "1")) params.delete(k);
    const s = params.toString();
    return `/admin/activity${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Activity log" description="Every change made in the dashboard: who did what, and when. Entries are recorded by the database and cannot be edited." />
      <div className="ad-card overflow-hidden">
        <form className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-end" action="/admin/activity">
          <label className="block sm:w-56">
            <span className="ad-label">Action</span>
            <select name="action" defaultValue={action} className="ad-input">
              <option value="">All actions</option>
              {Object.entries(ACTIONS).map(([value, a]) => (
                <option key={value} value={value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:w-56">
            <span className="ad-label">Content</span>
            <select name="entity" defaultValue={entity} className="ad-input">
              <option value="">Everything</option>
              {Object.entries(ENTITIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="ad-btn ad-btn-primary">
            Filter
          </button>
          {action || entity ? (
            <Link href="/admin/activity" className="ad-btn ad-btn-quiet">
              Clear
            </Link>
          ) : null}
          <p className="ad-muted text-sm sm:ms-auto">{total} entries</p>
        </form>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>What</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const a = ACTIONS[r.action] ?? { label: r.action, tone: "" };
                  const fields = Array.isArray(r.details?.fields) ? (r.details.fields as string[]) : [];
                  return (
                    <tr key={r.id}>
                      <td className="ad-muted whitespace-nowrap text-xs">
                        <TimeAgo value={r.created_at} />
                      </td>
                      <td className="text-sm">{r.actor_email || "—"}</td>
                      <td>
                        <span className={`ad-badge ${a.tone}`}>{a.label}</span>
                      </td>
                      <td className="min-w-64">
                        <span className="ad-muted me-1.5 text-xs">{ENTITIES[r.entity_type] ?? r.entity_type}</span>
                        <span className="font-medium">{r.entity_label}</span>
                        {fields.length ? <span className="ad-muted block text-xs">Changed: {fields.map((f) => f.replace(/_(ar|en)$/, " ($1)").replace(/_/g, " ")).join(", ")}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<History size={24} />} title="No activity" text={action || entity ? "Nothing matches these filters." : "Changes made in the dashboard will appear here."} />
        )}
        {pages > 1 ? (
          <div className="flex items-center justify-end gap-1 border-t border-[var(--line)] px-4 py-3 text-sm">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} className="ad-btn ad-btn-ghost ad-btn-sm ad-btn-icon" aria-label="Newer">
                <ChevronLeft size={15} />
              </Link>
            ) : null}
            <span className="px-2 tabular-nums">
              {page} / {pages}
            </span>
            {page < pages ? (
              <Link href={href({ page: page + 1 })} className="ad-btn ad-btn-ghost ad-btn-sm ad-btn-icon" aria-label="Older">
                <ChevronRight size={15} />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
