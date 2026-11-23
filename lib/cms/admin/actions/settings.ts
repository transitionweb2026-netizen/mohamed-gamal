"use server";

import { revalidatePath } from "next/cache";
import { docToRow, isSafeHref, isUuid, pruneDoc, validateDoc, type Field } from "@/lib/cms/fields";
import { navigationFields, pageDef, pageSeoFields, phoneFields, settingsFields, SOCIAL_PLATFORMS, UI_STRINGS } from "@/lib/cms/registry";
import { assertMediaRefs, collectMediaRefs } from "../media-refs";
import { requireAdmin } from "../session";
import { revalidateSite, run, UserError } from "../result";
import type { ActionResult } from "../result-types";

function clean(fields: Field[], doc: unknown) {
  const out = pruneDoc(fields, doc);
  const errors = validateDoc(fields, out);
  if (errors.length) throw new UserError("Some fields need attention before saving.", errors);
  return out;
}

/** Saves some of the website settings (each dashboard screen edits its own fields). */
export async function saveSettings(keys: string[], doc: unknown): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!Array.isArray(keys) || !keys.length || !keys.every((k) => settingsFields.some((f) => f.key === k))) throw new UserError("Unknown settings.");
    const fields = settingsFields.filter((f) => keys.includes(f.key));
    const values = clean(fields, doc);
    await assertMediaRefs(session.db, collectMediaRefs(fields, values));
    const row = docToRow(fields, values);
    // Empty optional texts are stored as '' (the columns are not nullable).
    for (const [key, value] of Object.entries(row)) if (value === null && !key.endsWith("_id")) row[key] = "";
    const updated = await session.db.update("site_settings", { id: 1 }, row);
    if (!updated.length) throw new UserError("The settings could not be saved (the settings row is missing).");
    revalidateSite();
    revalidatePath("/admin", "layout");
    return undefined;
  }, "Saved. The website is updated.");
}

export async function savePageSeo(pageKey: string, doc: unknown): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!pageDef(pageKey)) throw new UserError("Unknown page.");
    const values = clean(pageSeoFields, doc);
    await assertMediaRefs(session.db, collectMediaRefs(pageSeoFields, values));
    const row = docToRow(pageSeoFields, values);
    if (row.canonical_url === null) row.canonical_url = "";
    const updated = await session.db.update("pages", { key: pageKey }, row);
    if (!updated.length) throw new UserError("This page no longer exists.");
    revalidateSite();
    revalidatePath("/admin/seo");
    return undefined;
  }, "Saved. The website is updated.");
}

/* ---- Phone numbers ------------------------------------------------------------------ */

export async function savePhone(id: string | null, doc: unknown, visible: boolean): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const session = await requireAdmin();
    const row = { ...docToRow(phoneFields, clean(phoneFields, doc)), visible: visible !== false };
    let savedId = id;
    if (id === null) {
      const { rows } = await session.db.select<{ sort_order: number }>("phone_numbers", { columns: "sort_order", order: [["sort_order", false]], limit: 1 });
      savedId = (await session.db.insert<{ id: string }>("phone_numbers", { ...row, sort_order: (rows[0]?.sort_order ?? 0) + 10 })).id;
    } else {
      if (!isUuid(id)) throw new UserError("Unknown number.");
      await session.db.update("phone_numbers", { id }, row);
    }
    revalidateSite();
    revalidatePath("/admin/contact");
    return { id: savedId! };
  }, "Phone number saved.");
}

/* ---- Rows with visibility / order (phones, social links, navigation) ----------------- */

const ORDERABLE = { phones: "phone_numbers", socials: "social_links", navigation: "navigation_items" } as const;
type Orderable = keyof typeof ORDERABLE;
const PATHS: Record<Orderable, string> = { phones: "/admin/contact", socials: "/admin/social", navigation: "/admin/navigation" };

export async function setRowVisible(list: Orderable, id: string, visible: boolean): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!(list in ORDERABLE) || !isUuid(id)) throw new UserError("Unknown item.");
    await session.db.update(ORDERABLE[list], { id }, { visible: visible === true });
    revalidateSite();
    revalidatePath(PATHS[list]);
    return undefined;
  }, visible ? "Shown on the website." : "Hidden from the website.");
}

export async function deleteRow(list: Orderable, id: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!(list in ORDERABLE) || !isUuid(id)) throw new UserError("Unknown item.");
    await session.db.remove(ORDERABLE[list], { id });
    revalidateSite();
    revalidatePath(PATHS[list]);
    return undefined;
  }, "Deleted.");
}

export async function reorderRows(list: Orderable, ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!(list in ORDERABLE) || !Array.isArray(ids) || !ids.every(isUuid)) throw new UserError("Invalid order.");
    await session.db.rpc("cms_reorder", { p_table: ORDERABLE[list], p_ids: ids });
    revalidateSite();
    revalidatePath(PATHS[list]);
    return undefined;
  }, "New order saved.");
}

/* ---- Social media ------------------------------------------------------------------- */

export async function saveSocial(platform: string, url: string, visible: boolean): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!SOCIAL_PLATFORMS.some((p) => p.value === platform)) throw new UserError("Unknown platform.");
    const href = typeof url === "string" ? url.trim() : "";
    if (!/^https:\/\/[^/\s]+/i.test(href) || !isSafeHref(href)) throw new UserError("Enter the full profile address, starting with https://", [{ path: "url", message: "Enter the full profile address, starting with https://" }]);
    const { rows } = await session.db.select<{ id: string }>("social_links", { columns: "id", where: { platform } });
    if (rows[0]) await session.db.update("social_links", { id: rows[0].id }, { url: href, visible: visible !== false });
    else {
      const { rows: last } = await session.db.select<{ sort_order: number }>("social_links", { columns: "sort_order", order: [["sort_order", false]], limit: 1 });
      await session.db.insert("social_links", { platform, url: href, visible: visible !== false, sort_order: (last[0]?.sort_order ?? 0) + 10 });
    }
    revalidateSite();
    revalidatePath("/admin/social");
    return undefined;
  }, "Saved. The website is updated.");
}

/* ---- Navigation ----------------------------------------------------------------------- */

export interface NavInput {
  label: { ar: string; en: string };
  href: string;
  parentId: string | null;
  showInHeader: boolean;
  showInFooter: boolean;
  openInNewTab: boolean;
  visible: boolean;
}

export async function saveNavItem(id: string | null, input: NavInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const session = await requireAdmin();
    const values = clean(navigationFields, { label: input?.label, href: input?.href });
    const parentId = input.parentId && isUuid(input.parentId) ? input.parentId : null;
    if (parentId) {
      const { rows } = await session.db.select<{ id: string; parent_id: string | null }>("navigation_items", { columns: "id,parent_id", where: { id: parentId } });
      if (!rows[0] || rows[0].parent_id) throw new UserError("Menus have one level: choose a top-level item as the parent.");
      if (parentId === id) throw new UserError("An item cannot be its own parent.");
    }
    if (id && parentId) {
      const { rows: children } = await session.db.select<{ id: string }>("navigation_items", { columns: "id", where: { parent_id: id } });
      if (children.length) throw new UserError("This item has its own dropdown items, so it must stay at the top level.");
    }
    const row = {
      ...docToRow(navigationFields, values),
      parent_id: parentId,
      show_in_header: input.showInHeader === true,
      show_in_footer: input.showInFooter === true,
      open_in_new_tab: input.openInNewTab === true,
      visible: input.visible !== false,
    };
    let savedId = id;
    if (id === null) {
      const { rows: all } = await session.db.select<{ key: string; sort_order: number }>("navigation_items", { columns: "key,sort_order" });
      const base =
        (values.label as { en: string; ar: string }).en
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40) || "link";
      let key = /^[a-z]/.test(base) ? base : `link-${base}`;
      for (let n = 2; all.some((r) => r.key === key); n++) key = `${base}-${n}`;
      const sort = Math.max(0, ...all.map((r) => r.sort_order)) + 10;
      savedId = (await session.db.insert<{ id: string }>("navigation_items", { ...row, key, sort_order: sort })).id;
    } else {
      if (!isUuid(id)) throw new UserError("Unknown item.");
      await session.db.update("navigation_items", { id }, row);
    }
    revalidateSite();
    revalidatePath("/admin/navigation");
    return { id: savedId! };
  }, "Menu item saved.");
}

/* ---- Interface text --------------------------------------------------------------------- */

export async function saveUiStrings(values: Record<string, { ar: string; en: string }>): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    const known = new Set(UI_STRINGS.map((s) => s.key));
    const rows = Object.entries(values ?? {})
      .filter(([key]) => known.has(key))
      .map(([key, value]) => {
        const ar = typeof value?.ar === "string" ? value.ar : "";
        const en = typeof value?.en === "string" ? value.en : "";
        if (ar.length > 600 || en.length > 600) throw new UserError("Interface texts are limited to 600 characters.");
        return { key, value_ar: ar, value_en: en };
      });
    await session.db.upsert("ui_strings", rows, "key");
    revalidateSite();
    revalidatePath("/admin/settings");
    return undefined;
  }, "Interface text saved. The website is updated.");
}
