/**
 * The dashboard forms can save every piece of seeded content as it is: each
 * section, collection item and settings group passes the same validation the
 * Server Actions run. Also checks the upload rules.
 */
import { describe, expect, it } from "vitest";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { pruneDoc, rowToDoc, validateDoc, withDefaults } from "@/lib/cms/fields";
import { BUCKET_RULES, STORAGE_PATH_PATTERN, storagePathFor, uploadProblem } from "@/lib/cms/media-rules";
import { collections, pageSeoFields, PAGES, sectionTypeDef, settingsFields, type CollectionKey } from "@/lib/cms/registry";

const snapshot = buildBundledSnapshot();
const tables: Record<CollectionKey, Record<string, unknown>[]> = {
  services: snapshot.services as never,
  conditions: snapshot.conditions as never,
  processSteps: snapshot.processSteps as never,
  stats: snapshot.stats as never,
  videos: snapshot.videos as never,
  articles: snapshot.articles as never,
  articleCategories: snapshot.articleCategories as never,
  testimonials: snapshot.testimonials as never,
  faqs: snapshot.faqs as never,
  credentials: snapshot.credentials as never,
};

describe("seeded content passes the dashboard's validation", () => {
  it("every section of every page", () => {
    for (const page of PAGES) {
      for (const def of page.sections) {
        const section = snapshot.sections.find((s) => s.page_key === page.key && s.key === def.key);
        expect(section, `${page.key}.${def.key}`).toBeDefined();
        const fields = sectionTypeDef(section!.type)!.fields;
        const doc = pruneDoc(fields, withDefaults(fields, section!.content));
        expect(validateDoc(fields, doc), `${page.key}.${def.key}`).toEqual([]);
      }
    }
  });

  it("every collection item", () => {
    for (const [key, rows] of Object.entries(tables) as [CollectionKey, Record<string, unknown>[]][]) {
      const def = collections[key];
      expect(rows.length, key).toBeGreaterThan(0);
      for (const row of rows) {
        const doc = pruneDoc(def.fields, withDefaults(def.fields, rowToDoc(def.fields, row)));
        expect(validateDoc(def.fields, doc), `${key} ${String(row.slug ?? row.key ?? row.id)}`).toEqual([]);
      }
    }
  });

  it("the settings and page SEO", () => {
    const settings = rowToDoc(settingsFields, snapshot.settings as unknown as Record<string, unknown>);
    expect(validateDoc(settingsFields, pruneDoc(settingsFields, settings))).toEqual([]);
    for (const page of snapshot.pages) expect(validateDoc(pageSeoFields, rowToDoc(pageSeoFields, page as unknown as Record<string, unknown>)), page.key).toEqual([]);
  });
});

describe("withDefaults", () => {
  it("completes missing fields (nested) and drops unknown keys", () => {
    const fields = sectionTypeDef("contactChannels")!.fields;
    const doc = withDefaults(fields, { heading: { title: { ar: "أ", en: "A" } }, injected: "<script>" });
    expect(doc).not.toHaveProperty("injected");
    expect(doc.heading).toMatchObject({ title: { ar: "أ", en: "A" }, eyebrow: { ar: "", en: "" } });
    expect(doc.phone).toMatchObject({ title: { ar: "", en: "" } });
  });
});

describe("upload rules", () => {
  it("builds storage paths the server accepts", () => {
    for (const name of ["Photo 1.JPG", "صورة.png", "../../etc/passwd", "x", "clip.final.MOV"]) {
      const path = storagePathFor("website", name, "abc123def456");
      expect(STORAGE_PATH_PATTERN.test(path), path).toBe(true);
      expect(path).not.toContain("..");
    }
  });

  it("refuses unsupported, oversized and mismatched files", () => {
    expect(uploadProblem({ name: "a.svg", type: "image/svg+xml", size: 10 })).toMatch(/not accepted/);
    expect(uploadProblem({ name: "a.jpg", type: "image/jpeg", size: BUCKET_RULES.images.maxBytes + 1 })).toMatch(/too large/);
    expect(uploadProblem({ name: "a.mp4", type: "video/mp4", size: 10 }, "image")).toMatch(/choose an image/);
    expect(uploadProblem({ name: "a.ico", type: "", size: 10 }, "image")).toBeNull();
    expect(uploadProblem({ name: "a.pdf", type: "application/pdf", size: 10 })).toBeNull();
  });
});
