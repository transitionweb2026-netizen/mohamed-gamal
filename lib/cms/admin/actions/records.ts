"use server";

import { revalidatePath } from "next/cache";
import { columnsOf, docToRow, emptyValue, isActive, isUuid, pruneDoc, validateDoc } from "@/lib/cms/fields";
import { collections, type CollectionDef, type CollectionKey } from "@/lib/cms/registry";
import { assertMediaRefs, collectMediaRefs } from "../media-refs";
import { requireAdmin } from "../session";
import { revalidateSite, run, UserError } from "../result";
import type { ActionResult } from "../result-types";

function collectionOf(key: unknown): CollectionDef {
  if (typeof key !== "string" || !(key in collections)) throw new UserError("Unknown content type.");
  return collections[key as CollectionKey];
}

const listPath = (def: CollectionDef) => `/admin/${def.route}`;

/**
 * Creates (id = null) or updates an item. The identifier (slug / key) is set
 * once at creation and ignored afterwards, so public addresses never change.
 */
export async function saveRecord(collection: CollectionKey, id: string | null, doc: unknown, status?: "draft" | "published"): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const session = await requireAdmin();
    const def = collectionOf(collection);
    if (id !== null && !isUuid(id)) throw new UserError("Unknown item.");

    const clean = pruneDoc(def.fields, doc);
    const errors = validateDoc(def.fields, clean);
    if (errors.length) throw new UserError("Some fields need attention before saving.", errors);
    await assertMediaRefs(session.db, collectMediaRefs(def.fields, clean));

    const row = docToRow(def.fields, clean);
    // Fields that no longer apply (e.g. the YouTube ID after switching to an uploaded file) are cleared.
    const raw = typeof doc === "object" && doc !== null ? (doc as Record<string, unknown>) : {};
    for (const field of def.fields) {
      if (field.when && !isActive(field, raw)) for (const column of columnsOf(field)) row[column] = emptyValue(field);
    }
    if (def.hasStatus && status) {
      if (status !== "draft" && status !== "published") throw new UserError("Unknown status.");
      row.status = status;
    }

    let savedId = id;
    if (id === null) {
      const { rows: last } = await session.db.select<{ sort_order: number }>(def.table, { columns: "sort_order", order: [["sort_order", false]], limit: 1 });
      row.sort_order = (last[0]?.sort_order ?? 0) + 10;
      const inserted = await session.db.insert<{ id: string }>(def.table, row);
      savedId = inserted.id;
    } else {
      if (def.naturalKey) delete row[def.naturalKey];
      const updated = await session.db.update<{ id: string }>(def.table, { id }, row);
      if (!updated.length) throw new UserError("This item no longer exists, or your account may not change it.");
    }

    revalidateSite();
    revalidatePath(listPath(def));
    return { id: savedId! };
  }, id === null ? "Created." : "Saved.");
}

export async function setRecordStatus(collection: CollectionKey, ids: string[], status: "draft" | "published"): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    const def = collectionOf(collection);
    if (!def.hasStatus || (status !== "draft" && status !== "published")) throw new UserError("This content has no publish status.");
    if (!Array.isArray(ids) || !ids.length || !ids.every(isUuid)) throw new UserError("Nothing selected.");
    await session.db.update(def.table, { id: ids }, { status });
    revalidateSite();
    revalidatePath(listPath(def));
    return undefined;
  }, status === "published" ? "Published." : "Moved to drafts — no longer visible on the website.");
}

export async function deleteRecords(collection: CollectionKey, ids: string[]): Promise<ActionResult<number>> {
  return run(async () => {
    const session = await requireAdmin();
    const def = collectionOf(collection);
    if (!Array.isArray(ids) || !ids.length || !ids.every(isUuid)) throw new UserError("Nothing selected.");
    const count = await session.db.remove(def.table, { id: ids });
    revalidateSite();
    revalidatePath(listPath(def));
    return count;
  }, "Deleted.");
}

export async function reorderRecords(collection: CollectionKey, ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    const def = collectionOf(collection);
    if (!Array.isArray(ids) || !ids.every(isUuid)) throw new UserError("Invalid order.");
    const { rows } = await session.db.select<{ id: string }>(def.table, { columns: "id" });
    if (rows.length !== ids.length || !rows.every((r) => ids.includes(r.id))) throw new UserError("The list changed meanwhile. Reload the page and try again.");
    await session.db.rpc("cms_reorder", { p_table: def.table, p_ids: ids });
    revalidateSite();
    revalidatePath(listPath(def));
    return undefined;
  }, "New order saved.");
}

/** A copy of an item as a draft, with a new identifier. */
export async function duplicateRecord(collection: CollectionKey, id: string): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const session = await requireAdmin();
    const def = collectionOf(collection);
    if (!isUuid(id)) throw new UserError("Unknown item.");
    const { rows } = await session.db.select<Record<string, unknown>>(def.table, { where: { id } });
    const source = rows[0];
    if (!source) throw new UserError("This item no longer exists.");
    const copy: Record<string, unknown> = { ...source };
    for (const column of ["id", "created_at", "updated_at"]) delete copy[column];
    if (def.hasStatus) copy.status = "draft";
    if ("featured" in copy) copy.featured = false;
    if (def.naturalKey) {
      const base = String(source[def.naturalKey]).slice(0, 70);
      const { rows: existing } = await session.db.select<Record<string, string>>(def.table, { columns: def.naturalKey });
      const taken = new Set(existing.map((r) => r[def.naturalKey!]));
      let n = 2;
      while (taken.has(`${base}-copy${n === 2 ? "" : `-${n}`}`)) n++;
      copy[def.naturalKey] = `${base}-copy${n === 2 ? "" : `-${n}`}`;
    }
    const { rows: last } = await session.db.select<{ sort_order: number }>(def.table, { columns: "sort_order", order: [["sort_order", false]], limit: 1 });
    copy.sort_order = (last[0]?.sort_order ?? 0) + 10;
    const inserted = await session.db.insert<{ id: string }>(def.table, copy);
    revalidatePath(listPath(def));
    return { id: inserted.id };
  }, "Copy created as a draft.");
}
