/**
 * The dashboard's database operations (lib/cms/admin/db.ts interface) over
 * the real migrations, as the signed-in user with Row Level Security — the
 * same SQL the local development backend runs.
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { DbFailure, type Db } from "@/lib/cms/admin/db";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { stableId } from "@/lib/cms/ids";
import { pgliteDb } from "@/lib/cms/local/local-db";
import { seedSql } from "@/lib/cms/seed-sql";
import { createAdmin, createDatabase, createUser } from "./harness";

let pg: PGlite;
let owner: Db;
let editor: Db;
let stranger: Db;
let anon: Db;
let ownerId: string;
let editorId: string;

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof DbFailure ? error.error : { message: String(error) };
  }
};

beforeAll(async () => {
  pg = await createDatabase();
  await pg.exec(seedSql(buildBundledSnapshot()));
  ownerId = await createAdmin(pg, "owner@clinic.test", "owner");
  editorId = await createAdmin(pg, "editor@clinic.test", "editor");
  const strangerId = await createUser(pg, "someone@else.test");
  const get = async () => pg;
  owner = pgliteDb(get, { userId: ownerId });
  editor = pgliteDb(get, { userId: editorId });
  stranger = pgliteDb(get, { userId: strangerId });
  anon = pgliteDb(get, "anon");
});

describe("select", () => {
  it("filters, orders, limits and counts", async () => {
    const { rows, count } = await editor.select<{ slug: string; sort_order: number }>("services", { columns: "slug,sort_order", where: { status: "published" }, order: [["sort_order", false]], limit: 2, count: true });
    expect(rows).toHaveLength(2);
    expect(rows[0].sort_order).toBeGreaterThanOrEqual(rows[1].sort_order);
    expect(count).toBe(9);
  });

  it("supports lists (in) and null filters", async () => {
    const { rows: all } = await editor.select<{ id: string }>("services", { columns: "id" });
    const { rows } = await editor.select<{ id: string }>("services", { columns: "id", where: { id: all.slice(0, 3).map((r) => r.id) } });
    expect(rows).toHaveLength(3);
    const { rows: noIds } = await editor.select("videos", { columns: "id", where: { youtube_id: null } });
    expect(noIds).toHaveLength(9);
  });

  it("refuses unsafe identifiers", async () => {
    await expect(editor.select("services; drop table services", {})).rejects.toThrow();
    await expect(editor.select("services", { columns: "id, (select 1)" })).rejects.toThrow();
  });

  it("applies Row Level Security like PostgREST", async () => {
    // Visitors see published rows only and no drafts or activity.
    await pg.query(`update public.services set status = 'draft' where slug = (select slug from public.services order by sort_order limit 1)`);
    const visitor = await anon.select("services", { columns: "id" });
    const admin = await editor.select("services", { columns: "id" });
    expect(visitor.rows.length).toBe(admin.rows.length - 1);
    await pg.query(`update public.services set status = 'published'`);
    expect(await failure(anon.select("section_drafts"))).not.toBeNull();
    expect((await stranger.select("activity_logs")).rows).toHaveLength(0);
  });
});

describe("writes", () => {
  it("inserts, updates and deletes with arrays and JSON", async () => {
    const row = await editor.insert<{ id: string; points_en: string[] }>("services", { slug: "qa-service", icon: "Activity", status: "draft", title_en: "QA", points_en: ["one", "two"], points_ar: [] });
    expect(row.points_en).toEqual(["one", "two"]);
    const updated = await editor.update<{ title_ar: string }>("services", { id: row.id }, { title_ar: "اختبار" });
    expect(updated[0].title_ar).toBe("اختبار");
    const article = (await editor.select<{ id: string }>("articles", { columns: "id", limit: 1 })).rows[0];
    const body = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };
    const [saved] = await editor.update<{ body_en: unknown }>("articles", { id: article.id }, { body_en: body });
    expect(saved.body_en).toEqual(body);
    expect(await editor.remove("services", { id: row.id })).toBe(1);
  });

  it("is refused for visitors and non-administrators", async () => {
    const denied = await failure(anon.insert("services", { slug: "nope", icon: "Activity" }));
    expect(denied?.code).toBe("42501");
    const strangerUpdate = await stranger.update("services", { status: "published" }, { title_en: "hacked" });
    expect(strangerUpdate).toHaveLength(0);
  });

  it("upserts section drafts and publishes them", async () => {
    const heroId = stableId("section", "home.hero");
    const content = { eyebrow: { ar: "تجربة", en: "Draft eyebrow" } };
    await editor.upsert("section_drafts", [{ section_id: heroId, content, updated_by: editorId }], "section_id");
    await editor.upsert("section_drafts", [{ section_id: heroId, content: { ...content, eyebrow: { ar: "ب", en: "Second" } }, updated_by: editorId }], "section_id");
    const drafts = await editor.select<{ content: { eyebrow: { en: string } } }>("section_drafts", { where: { section_id: heroId } });
    expect(drafts.rows[0].content.eyebrow.en).toBe("Second");
    const published = await editor.rpc<{ id: string; content: { eyebrow: { en: string } } }>("section_publish", { p_id: heroId });
    expect(published.id).toBe(heroId);
    expect(published.content.eyebrow.en).toBe("Second");
    expect((await editor.select("section_drafts", { where: { section_id: heroId } })).rows).toHaveLength(0);
  });

  it("does not delete a media file that is in use", async () => {
    const { rows } = await editor.select<{ id: string }>("media", { columns: "id", where: { legacy_path: "/images/brand/logo-mark.png" } });
    const blocked = await failure(editor.remove("media", { id: rows[0].id }));
    expect(blocked?.message).toContain("still used");
  });
});

describe("functions", () => {
  it("returns sets, rows and values", async () => {
    const admins = await owner.rpc<{ email: string }[]>("admin_list");
    expect(admins.map((a) => a.email).sort()).toEqual(["editor@clinic.test", "owner@clinic.test"]);
    expect(await editor.rpc<unknown[]>("admin_list")).toEqual([]);
    const stats = await editor.rpc<{ pages: number; activityByDay: unknown[] }>("cms_dashboard_stats");
    expect(stats.pages).toBe(6);
    expect(stats.activityByDay).toHaveLength(14);
    const { rows: logo } = await editor.select<{ id: string }>("media", { columns: "id", where: { legacy_path: "/images/brand/logo-mark.png" } });
    const usages = await editor.rpc<{ field: string }[]>("media_usages", { p_media_id: logo[0].id });
    expect(usages.map((u) => u.field)).toContain("logo");
  });

  it("reorders with a uuid array and logs once", async () => {
    const { rows } = await editor.select<{ id: string }>("faqs", { columns: "id", where: { group_key: "home" }, order: [["sort_order", true]] });
    const reversed = rows.map((r) => r.id).reverse();
    await editor.rpc("cms_reorder", { p_table: "faqs", p_ids: reversed });
    const { rows: after } = await editor.select<{ id: string }>("faqs", { columns: "id", where: { group_key: "home" }, order: [["sort_order", true]] });
    expect(after.map((r) => r.id)).toEqual(reversed);
    const log = await editor.select<{ action: string }>("activity_logs", { where: { action: "reorder", entity_type: "faqs" } });
    expect(log.rows).toHaveLength(1);
  });

  it("grants access to existing accounts only (owners only)", async () => {
    await createUser(pg, "new.editor@clinic.test");
    const denied = await failure(editor.rpc("admin_grant", { p_email: "new.editor@clinic.test", p_role: "editor", p_display_name: "" }));
    expect(denied?.message).toContain("Only owners");
    const granted = await owner.rpc<{ email: string; role: string }>("admin_grant", { p_email: "New.Editor@clinic.test", p_role: "editor", p_display_name: "New" });
    expect(granted).toMatchObject({ email: "new.editor@clinic.test", role: "editor" });
    const missing = await failure(owner.rpc("admin_grant", { p_email: "nobody@clinic.test", p_role: "editor", p_display_name: "" }));
    expect(missing?.message).toContain("No Supabase Auth user");
  });
});
