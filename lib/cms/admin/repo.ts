import "server-only";
import type { Db } from "./db";
import type { AdminSession } from "./session";
import { rowToDoc, withDefaults, type Field } from "@/lib/cms/fields";
import { LOCAL_STORAGE_BASE } from "@/lib/cms/local/local-db";
import { mediaSrc } from "@/lib/cms/media-src";
import { collections, pageDef, PAGES, pageSeoFields, sectionTypeDef, settingsFields, type CollectionDef, type CollectionKey } from "@/lib/cms/registry";
import type { MediaRow, PageRow, SettingsRow } from "@/lib/cms/types";
import { storagePublicBaseUrl } from "@/lib/supabase/env";
import type { ActivityEntry, AdminListItem, DashboardStats, MediaItem, NavItemRow, NotificationItem, RecordListRow, SectionEditorData } from "./shapes";

/** Reads for the dashboard pages. Every query runs as the signed-in administrator. */

export const storageBaseFor = (session: AdminSession) => (session.mode === "local" ? LOCAL_STORAGE_BASE : storagePublicBaseUrl);

/* ---- Media ------------------------------------------------------------------------- */

const MEDIA_COLUMNS = "id,kind,bucket,path,folder,mime_type,size_bytes,width,height,duration_seconds,title,alt_ar,alt_en,legacy_path,created_at,updated_at";

export function toMediaItem(row: MediaRow, base: string | null): MediaItem {
  return { ...row, size_bytes: row.size_bytes === null ? null : Number(row.size_bytes), duration_seconds: row.duration_seconds === null ? null : Number(row.duration_seconds), src: mediaSrc(row, base) };
}

export async function listMedia(session: AdminSession): Promise<MediaItem[]> {
  const { rows } = await session.db.select<MediaRow>("media", { columns: MEDIA_COLUMNS, order: [["created_at", false], ["id", true]], limit: 2000 });
  const base = storageBaseFor(session);
  return rows.map((row) => toMediaItem(row, base));
}

/* ---- Overview -------------------------------------------------------------------------- */

export async function getDashboardStats(db: Db): Promise<DashboardStats> {
  return db.rpc<DashboardStats>("cms_dashboard_stats");
}

export async function listActivity(
  db: Db,
  options: { page?: number; pageSize?: number; action?: string; entity?: string; actor?: string } = {},
): Promise<{ rows: ActivityEntry[]; total: number }> {
  const pageSize = options.pageSize ?? 25;
  const where: Record<string, string> = {};
  if (options.action) where.action = options.action;
  if (options.entity) where.entity_type = options.entity;
  if (options.actor) where.actor_email = options.actor;
  const { rows, count } = await db.select<ActivityEntry>("activity_logs", {
    columns: "id,created_at,actor_email,action,entity_type,entity_id,entity_label,details",
    where,
    order: [["created_at", false], ["id", false]],
    limit: pageSize,
    offset: ((options.page ?? 1) - 1) * pageSize,
    count: true,
  });
  return { rows: rows.map((r) => ({ ...r, id: Number(r.id) })), total: count ?? rows.length };
}

/* ---- Pages and sections ------------------------------------------------------------------ */

interface SectionDbRow {
  id: string;
  page_key: string;
  key: string;
  type: string;
  sort_order: number;
  visible: boolean;
  content: Record<string, unknown>;
  published_at: string | null;
  updated_at: string;
}

interface DraftDbRow {
  section_id: string;
  content: Record<string, unknown>;
  updated_at: string;
}

export async function listPages(db: Db): Promise<(PageRow & { sections: number; hidden: number; drafts: number; lastEdited: string | null })[]> {
  const [{ rows: pages }, { rows: sections }, { rows: drafts }] = await Promise.all([
    db.select<PageRow>("pages", { order: [["sort_order", true]] }),
    db.select<SectionDbRow>("page_sections", { columns: "id,page_key,visible,updated_at" }),
    db.select<DraftDbRow>("section_drafts", { columns: "section_id,updated_at" }),
  ]);
  const draftBySection = new Map(drafts.map((d) => [d.section_id, d.updated_at]));
  return pages.map((page) => {
    const own = sections.filter((s) => s.page_key === page.key);
    const stamps = own.flatMap((s) => [s.updated_at, draftBySection.get(s.id)]).filter((v): v is string => !!v).sort();
    return {
      ...page,
      sections: own.length,
      hidden: own.filter((s) => !s.visible).length,
      drafts: own.filter((s) => draftBySection.has(s.id)).length,
      lastEdited: stamps.at(-1) ?? page.updated_at ?? null,
    };
  });
}

export async function getPageSections(db: Db, pageKey: string): Promise<SectionEditorData[]> {
  const { rows: sections } = await db.select<SectionDbRow>("page_sections", { where: { page_key: pageKey }, order: [["sort_order", true], ["key", true]] });
  const ids = sections.map((s) => s.id);
  const { rows: drafts } = ids.length ? await db.select<DraftDbRow>("section_drafts", { where: { section_id: ids } }) : { rows: [] };
  const def = pageDef(pageKey);
  return sections.map((s) => {
    const typeDef = sectionTypeDef(s.type);
    const fields = typeDef?.fields ?? [];
    const draft = drafts.find((d) => d.section_id === s.id);
    return {
      id: s.id,
      pageKey: s.page_key,
      key: s.key,
      type: s.type,
      label: def?.sections.find((d) => d.key === s.key)?.label ?? typeDef?.label ?? s.key,
      typeLabel: typeDef?.label ?? s.type,
      description: typeDef?.description ?? "",
      data: typeDef?.data ?? null,
      visible: s.visible,
      sortOrder: s.sort_order,
      published: withDefaults(fields, s.content),
      draft: draft ? withDefaults(fields, draft.content) : null,
      draftUpdatedAt: draft?.updated_at ?? null,
      publishedAt: s.published_at,
      updatedAt: s.updated_at,
    };
  });
}

export async function getPage(db: Db, key: string): Promise<PageRow | null> {
  const { rows } = await db.select<PageRow>("pages", { where: { key } });
  return rows[0] ?? null;
}

/* ---- Collections --------------------------------------------------------------------------- */

/** Columns the list needs (never the article bodies). */
function listColumnsOf(def: CollectionDef): string[] {
  const cols = new Set<string>(["id", "sort_order", "updated_at"]);
  const title = def.titleColumn.replace(/_(ar|en)$/, "");
  cols.add(`${title}_ar`);
  cols.add(`${title}_en`);
  if (def.hasStatus) cols.add("status");
  if (def.naturalKey) cols.add(def.naturalKey);
  if (def.imageColumn) cols.add(def.imageColumn);
  if (def.filter) cols.add(def.filter.column);
  for (const c of def.listColumns ?? []) cols.add(c.column);
  if (def.key === "articles") cols.add("category_id");
  if (def.key === "videos") cols.add("youtube_id");
  return [...cols];
}

export async function listRecords(session: AdminSession, def: CollectionDef): Promise<RecordListRow[]> {
  const { rows } = await session.db.select<Record<string, unknown>>(def.table, { columns: listColumnsOf(def).join(","), order: [["sort_order", true], ["id", true]] });
  const title = def.titleColumn.replace(/_(ar|en)$/, "");
  const imageIds = def.imageColumn ? rows.map((r) => r[def.imageColumn!]).filter((v): v is string => typeof v === "string") : [];
  const media = imageIds.length ? (await session.db.select<MediaRow>("media", { columns: "id,bucket,path", where: { id: imageIds } })).rows : [];
  const base = storageBaseFor(session);
  return rows.map((row) => {
    const imageId = def.imageColumn ? (row[def.imageColumn] as string | null) : null;
    const image = imageId ? media.find((m) => m.id === imageId) : undefined;
    return {
      id: row.id as string,
      sortOrder: Number(row.sort_order),
      titleAr: String(row[`${title}_ar`] ?? ""),
      titleEn: String(row[`${title}_en`] ?? ""),
      status: (row.status as "draft" | "published" | undefined) ?? null,
      identifier: def.naturalKey ? String(row[def.naturalKey] ?? "") : null,
      image: image ? mediaSrc(image, base) : null,
      updatedAt: String(row.updated_at ?? ""),
      values: Object.fromEntries(listColumnsOf(def).map((c) => [c, row[c] as string | number | boolean | null])),
    };
  });
}

export async function getRecordDoc(db: Db, def: CollectionDef, id: string): Promise<{ doc: Record<string, unknown>; status: "draft" | "published" | null; updatedAt: string } | null> {
  const { rows } = await db.select<Record<string, unknown>>(def.table, { where: { id } });
  const row = rows[0];
  if (!row) return null;
  return { doc: withDefaults(def.fields, rowToDoc(def.fields, row)), status: (row.status as "draft" | "published") ?? null, updatedAt: String(row.updated_at ?? "") };
}

export async function getReferenceOptions(db: Db): Promise<Record<string, { value: string; label: string }[]>> {
  const { rows } = await db.select<{ id: string; name_ar: string; name_en: string }>("article_categories", { columns: "id,name_ar,name_en", order: [["sort_order", true]] });
  return { articleCategories: rows.map((r) => ({ value: r.id, label: r.name_en || r.name_ar })) };
}

/* ---- Settings, navigation, contact ---------------------------------------------------------- */

export async function getSettings(db: Db): Promise<SettingsRow> {
  const { rows } = await db.select<SettingsRow>("site_settings", { where: { id: 1 } });
  if (!rows[0]) throw new Error("The website settings row is missing. Import supabase/seed/content.sql.");
  return rows[0];
}

/** The settings as a form document, limited to the given field keys. */
export async function getSettingsDoc(db: Db, keys: string[]): Promise<{ fields: Field[]; doc: Record<string, unknown> }> {
  const fields = keys.map((k) => settingsFields.find((f) => f.key === k)).filter((f): f is Field => !!f);
  const row = await getSettings(db);
  return { fields, doc: withDefaults(fields, rowToDoc(fields, row as unknown as Record<string, unknown>)) };
}

export async function getPageSeoDoc(db: Db, key: string): Promise<Record<string, unknown> | null> {
  const page = await getPage(db, key);
  return page ? withDefaults(pageSeoFields, rowToDoc(pageSeoFields, page as unknown as Record<string, unknown>)) : null;
}

export async function listNavigation(db: Db): Promise<NavItemRow[]> {
  const { rows } = await db.select<NavItemRow>("navigation_items", { order: [["sort_order", true], ["key", true]] });
  return rows;
}

export async function listPhones(db: Db) {
  const { rows } = await db.select<{ id: string; label_ar: string; label_en: string; display: string; digits: string; sort_order: number; visible: boolean }>("phone_numbers", {
    order: [["sort_order", true], ["id", true]],
  });
  return rows;
}

export async function listSocials(db: Db) {
  const { rows } = await db.select<{ id: string; platform: string; url: string; sort_order: number; visible: boolean }>("social_links", { order: [["sort_order", true]] });
  return rows;
}

export async function listUiStrings(db: Db) {
  const { rows } = await db.select<{ key: string; value_ar: string; value_en: string }>("ui_strings", { order: [["key", true]] });
  return rows;
}

export async function listAdmins(db: Db): Promise<AdminListItem[]> {
  return db.rpc<AdminListItem[]>("admin_list");
}

/* ---- Notifications (top bar) ---------------------------------------------------------------- */

export async function getNotifications(session: AdminSession): Promise<NotificationItem[]> {
  const { db } = session;
  const [{ rows: drafts }, { rows: placeholders }, { rows: videos }, { rows: recent }] = await Promise.all([
    db.select<DraftDbRow & { updated_by: string | null }>("section_drafts", { columns: "section_id,updated_at,updated_by" }),
    db.select<{ id: string }>("testimonials", { columns: "id", where: { is_placeholder: true, status: "published" } }),
    db.select<{ id: string }>("videos", { columns: "id", where: { status: "published", source: "youtube", youtube_id: null } }),
    db.select<ActivityEntry & { actor_id: string | null }>("activity_logs", {
      columns: "id,created_at,actor_id,actor_email,action,entity_type,entity_id,entity_label,details",
      order: [["created_at", false]],
      limit: 12,
    }),
  ]);
  const items: NotificationItem[] = [];
  if (drafts.length) {
    const { rows: sections } = await db.select<{ id: string; page_key: string }>("page_sections", { columns: "id,page_key", where: { id: drafts.map((d) => d.section_id) } });
    const pages = [...new Set(sections.map((s) => s.page_key))];
    items.push({
      id: "drafts",
      tone: "warning",
      title: `${drafts.length} unpublished section draft${drafts.length === 1 ? "" : "s"}`,
      text: `On: ${pages.map((p) => pageDef(p)?.label ?? p).join(", ")}. Visitors still see the published version.`,
      href: `/admin/pages/${pages[0]}`,
      at: drafts.map((d) => d.updated_at).sort().at(-1) ?? null,
    });
  }
  if (placeholders.length)
    items.push({
      id: "placeholders",
      tone: "warning",
      title: `${placeholders.length} placeholder testimonial${placeholders.length === 1 ? " is" : "s are"} published`,
      text: "Replace them with real testimonials (with the patients' consent) or set them to draft.",
      href: "/admin/testimonials",
      at: null,
    });
  if (videos.length)
    items.push({
      id: "videos",
      tone: "info",
      title: `${videos.length} video${videos.length === 1 ? "" : "s"} without a YouTube ID`,
      text: "These cards show “coming soon” until a video is added.",
      href: "/admin/videos",
      at: null,
    });
  for (const entry of recent.filter((r) => r.actor_id !== session.userId).slice(0, 5)) {
    items.push({
      id: `activity-${entry.id}`,
      tone: "neutral",
      title: `${entry.actor_email || "Someone"} — ${entry.action.replace("_", " ")}`,
      text: entry.entity_label,
      href: "/admin/activity",
      at: entry.created_at,
    });
  }
  return items;
}

/* ---- Search (top bar) -------------------------------------------------------------------------- */

export async function searchContent(session: AdminSession, query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const results: { title: string; subtitle: string; href: string }[] = [];
  const match = (...values: unknown[]) => values.some((v) => typeof v === "string" && v.toLowerCase().includes(q));

  for (const page of PAGES) {
    for (const section of page.sections) {
      const type = sectionTypeDef(section.type);
      if (match(section.label, type?.label, page.label)) results.push({ title: `${page.label} › ${section.label}`, subtitle: "Section", href: `/admin/pages/${page.key}#section-${section.key}` });
    }
  }
  await Promise.all(
    (Object.keys(collections) as CollectionKey[]).map(async (key) => {
      const def = collections[key];
      const title = def.titleColumn.replace(/_(ar|en)$/, "");
      const { rows } = await session.db.select<Record<string, string>>(def.table, { columns: `id,${title}_ar,${title}_en` });
      for (const row of rows) if (match(row[`${title}_ar`], row[`${title}_en`])) results.push({ title: row[`${title}_en`] || row[`${title}_ar`], subtitle: def.singular, href: `/admin/${def.route}/${row.id}` });
    }),
  );
  const { rows: media } = await session.db.select<{ id: string; title: string; alt_en: string; alt_ar: string }>("media", { columns: "id,title,alt_ar,alt_en", limit: 2000 });
  for (const m of media) if (match(m.title, m.alt_ar, m.alt_en)) results.push({ title: m.title || m.alt_en || "Untitled file", subtitle: "Media", href: `/admin/media?item=${m.id}` });
  return results.slice(0, 25);
}
