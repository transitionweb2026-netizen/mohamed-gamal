"use server";

import { revalidatePath } from "next/cache";
import { pruneDoc, validateDoc, isUuid } from "@/lib/cms/fields";
import { pageDef, sectionTypeDef } from "@/lib/cms/registry";
import type { Db } from "../db";
import { assertMediaRefs, collectMediaRefs } from "../media-refs";
import { requireAdmin } from "../session";
import { revalidateSite, run, UserError } from "../result";
import type { ActionResult } from "../result-types";

interface SectionRef {
  id: string;
  page_key: string;
  type: string;
}

async function loadSection(id: unknown): Promise<{ section: SectionRef; session: Awaited<ReturnType<typeof requireAdmin>> }> {
  const session = await requireAdmin();
  if (!isUuid(id)) throw new UserError("Unknown section.");
  const { rows } = await session.db.select<SectionRef>("page_sections", { columns: "id,page_key,type", where: { id } });
  if (!rows[0]) throw new UserError("This section no longer exists. Reload the page.");
  return { section: rows[0], session };
}

const adminPath = (pageKey: string) => `/admin/pages/${pageKey}`;

async function cleanContent(db: Db, type: string, content: unknown) {
  const def = sectionTypeDef(type);
  if (!def) throw new UserError("This section type cannot be edited.");
  const doc = pruneDoc(def.fields, content);
  const errors = validateDoc(def.fields, doc);
  if (errors.length) throw new UserError("Some fields need attention before saving.", errors);
  await assertMediaRefs(db, collectMediaRefs(def.fields, doc));
  return doc;
}

/** Saves edits as a draft (visitors keep seeing the published version). */
export async function saveSectionDraft(id: string, content: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return run(async () => {
    const { section, session } = await loadSection(id);
    const doc = await cleanContent(session.db, section.type, content);
    await session.db.upsert("section_drafts", [{ section_id: section.id, content: doc, updated_by: session.userId }], "section_id");
    revalidatePath(adminPath(section.page_key));
    return { updatedAt: new Date().toISOString() };
  }, "Draft saved. Visitors still see the published version.");
}

/** Saves the edits and publishes them immediately. */
export async function saveAndPublishSection(id: string, content: unknown): Promise<ActionResult> {
  return run(async () => {
    const { section, session } = await loadSection(id);
    const doc = await cleanContent(session.db, section.type, content);
    await session.db.upsert("section_drafts", [{ section_id: section.id, content: doc, updated_by: session.userId }], "section_id");
    await session.db.rpc("section_publish", { p_id: section.id });
    revalidateSite();
    revalidatePath(adminPath(section.page_key));
    return undefined;
  }, "Published. The website is updated.");
}

export async function publishSection(id: string): Promise<ActionResult> {
  return run(async () => {
    const { section, session } = await loadSection(id);
    await session.db.rpc("section_publish", { p_id: section.id });
    revalidateSite();
    revalidatePath(adminPath(section.page_key));
    return undefined;
  }, "Published. The website is updated.");
}

export async function discardSectionDraft(id: string): Promise<ActionResult> {
  return run(async () => {
    const { section, session } = await loadSection(id);
    await session.db.remove("section_drafts", { section_id: section.id });
    revalidatePath(adminPath(section.page_key));
    return undefined;
  }, "Draft discarded.");
}

export async function setSectionVisible(id: string, visible: boolean): Promise<ActionResult> {
  return run(async () => {
    const { section, session } = await loadSection(id);
    await session.db.update("page_sections", { id: section.id }, { visible: visible === true, updated_by: session.userId });
    revalidateSite();
    revalidatePath(adminPath(section.page_key));
    return undefined;
  }, visible ? "Section shown on the website." : "Section hidden from the website.");
}

export async function publishPage(pageKey: string): Promise<ActionResult<number>> {
  return run(async () => {
    const session = await requireAdmin();
    if (!pageDef(pageKey)) throw new UserError("Unknown page.");
    const count = await session.db.rpc<number>("page_publish_all", { p_page_key: pageKey });
    revalidateSite();
    revalidatePath(adminPath(pageKey));
    return count;
  }, "All drafts of this page are published.");
}

export async function reorderSections(pageKey: string, ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!pageDef(pageKey) || !Array.isArray(ids) || !ids.every(isUuid)) throw new UserError("Invalid order.");
    const { rows } = await session.db.select<{ id: string }>("page_sections", { columns: "id", where: { page_key: pageKey } });
    const own = new Set(rows.map((r) => r.id));
    if (ids.length !== own.size || !ids.every((id) => own.has(id))) throw new UserError("The sections changed meanwhile. Reload the page and try again.");
    await session.db.rpc("cms_reorder", { p_table: "page_sections", p_ids: ids });
    revalidateSite();
    revalidatePath(adminPath(pageKey));
    return undefined;
  }, "New order saved.");
}
