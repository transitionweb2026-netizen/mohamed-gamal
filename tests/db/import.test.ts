import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { seedSql } from "@/lib/cms/seed-sql";
import type { CmsSnapshot } from "@/lib/cms/types";
import { as, createDatabase } from "./harness";

let db: PGlite;
const bundled = buildBundledSnapshot();

/** Drops database-managed timestamps so rows compare with the bundled ones. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !["created_at", "updated_at", "created_by", "updated_by"].includes(k))
        .map(([k, v]) => [k, normalize(v)]),
    );
  }
  return value;
}

const byId = <T extends { id?: string; key?: string }>(rows: T[]) => [...rows].sort((a, b) => String(a.id ?? a.key).localeCompare(String(b.id ?? b.key)));

beforeAll(async () => {
  db = await createDatabase();
  await db.exec(seedSql(bundled));
});

describe("seed import", () => {
  it("imports without errors and can run again (idempotent)", async () => {
    await expect(db.exec(seedSql(bundled))).resolves.toBeDefined();
  });

  it("returns exactly the bundled content through the public snapshot", async () => {
    const snapshot = await as(db, { role: "anon" }, async (tx) => (await tx.query<{ s: CmsSnapshot }>(`select public.cms_snapshot() as s`)).rows[0].s);
    const keys = Object.keys(bundled) as (keyof CmsSnapshot)[];
    for (const key of keys) {
      const fromDb = normalize(snapshot[key]);
      const expected = normalize(bundled[key]);
      if (Array.isArray(expected)) expect(byId(fromDb as never[]), key).toEqual(byId(expected as never[]));
      else expect(fromDb, key).toEqual(expected);
    }
  });

  it("does not log activity for imports (no signed-in user)", async () => {
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.activity_logs`);
    expect(rows[0].n).toBe(0);
  });
});
