import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { pruneDoc, rowToDoc, validateDoc } from "@/lib/cms/fields";
import { collections, PAGES, sectionTypeDef, UI_STRINGS } from "@/lib/cms/registry";
import { seedSql } from "@/lib/cms/seed-sql";
import type { CmsSnapshot } from "@/lib/cms/types";

const snapshot = buildBundledSnapshot();

describe("bundled content", () => {
  it("has a section row for every registered section, in registry order", () => {
    for (const page of PAGES) {
      const rows = snapshot.sections.filter((s) => s.page_key === page.key);
      expect(rows.map((r) => r.key)).toEqual(page.sections.map((s) => s.key));
    }
  });

  it("stores every section in the shape its editor expects (valid, nothing unknown)", () => {
    for (const section of snapshot.sections) {
      const def = sectionTypeDef(section.type);
      expect(def, section.type).toBeDefined();
      expect(validateDoc(def!.fields, section.content), `${section.page_key}.${section.key}`).toEqual([]);
      expect(pruneDoc(def!.fields, section.content), `${section.page_key}.${section.key}`).toEqual(section.content);
    }
  });

  it("stores every collection item in a valid shape", () => {
    const tables: [keyof CmsSnapshot, keyof typeof collections][] = [
      ["services", "services"],
      ["conditions", "conditions"],
      ["processSteps", "processSteps"],
      ["stats", "stats"],
      ["videos", "videos"],
      ["articles", "articles"],
      ["articleCategories", "articleCategories"],
      ["testimonials", "testimonials"],
      ["faqs", "faqs"],
      ["credentials", "credentials"],
    ];
    for (const [snapshotKey, collectionKey] of tables) {
      const def = collections[collectionKey];
      for (const row of snapshot[snapshotKey] as unknown as Record<string, unknown>[]) {
        expect(validateDoc(def.fields, rowToDoc(def.fields, row)), `${collectionKey} ${row.slug ?? row.key ?? row.id}`).toEqual([]);
      }
    }
  });

  it("keeps the launch structure: 9 videos, 1 featured + 6 secondary articles", () => {
    expect(snapshot.videos).toHaveLength(9);
    expect(snapshot.articles).toHaveLength(7);
    expect(snapshot.articles.filter((a) => a.featured)).toHaveLength(1);
  });

  it("references only media that exist", () => {
    const ids = new Set(snapshot.media.map((m) => m.id));
    const json = JSON.stringify({ ...snapshot, media: [] });
    const referenced = [...json.matchAll(/"(?:id|image_id|cover_id|poster_id|logo_id|og_image_id)":"([0-9a-f-]{36})"/g)].map((m) => m[1]);
    const mediaRefs = referenced.filter((id) => !snapshot.sections.some((s) => s.id === id) && ![...snapshot.services, ...snapshot.articles, ...snapshot.videos].some((r) => r.id === id));
    for (const id of mediaRefs) {
      if ([...snapshot.phones, ...snapshot.socials, ...snapshot.navigation, ...snapshot.conditions, ...snapshot.processSteps, ...snapshot.stats, ...snapshot.testimonials, ...snapshot.faqs, ...snapshot.credentials, ...snapshot.articleCategories].some((r) => r.id === id)) continue;
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("has every interface text", () => {
    expect(snapshot.uiStrings.map((u) => u.key).sort()).toEqual(UI_STRINGS.map((u) => u.key).sort());
    for (const u of snapshot.uiStrings) expect(u.value_ar && u.value_en, u.key).toBeTruthy();
  });

  it("matches the committed seed file (run `npm run cms:seed-sql` after changing content/)", () => {
    const committed = readFileSync(join(process.cwd(), "supabase", "seed", "content.sql"), "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(seedSql(snapshot));
  });
});
