import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { applyMigrations, createDatabase } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
});

describe("migrations", () => {
  it("create every CMS table with Row Level Security enabled", async () => {
    const { rows } = await db.query<{ tablename: string; rowsecurity: boolean }>(
      `select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename`,
    );
    const tables = rows.map((r) => r.tablename);
    for (const t of [
      "activity_logs", "admins", "article_categories", "articles", "conditions", "credentials", "faqs", "media",
      "navigation_items", "page_sections", "pages", "phone_numbers", "process_steps", "section_drafts", "services",
      "site_settings", "social_links", "stats", "testimonials", "ui_strings", "videos",
    ]) {
      expect(tables).toContain(t);
    }
    expect(rows.filter((r) => !r.rowsecurity).map((r) => r.tablename)).toEqual([]);
  });

  it("can be applied twice without errors (idempotent)", async () => {
    await expect(applyMigrations(db)).resolves.toBeUndefined();
  });

  it("creates the three storage buckets", async () => {
    const { rows } = await db.query<{ id: string; public: boolean }>(`select id, public from storage.buckets order by id`);
    expect(rows).toEqual([
      { id: "documents", public: true },
      { id: "images", public: true },
      { id: "videos", public: true },
    ]);
  });

  it("returns an empty but well-formed snapshot", async () => {
    const { rows } = await db.query<{ s: Record<string, unknown> }>(`select public.cms_snapshot() as s`);
    expect(rows[0].s.settings).toBeNull();
    expect(rows[0].s.sections).toEqual([]);
    expect(rows[0].s.preview).toBe(false);
  });
});
