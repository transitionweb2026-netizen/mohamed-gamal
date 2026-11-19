/**
 * Regenerates supabase/seed/content.sql from the bundled website content.
 *   npm run cms:seed-sql
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildBundledSnapshot } from "../lib/cms/bundled";
import { seedSql } from "../lib/cms/seed-sql";

const out = join(process.cwd(), "supabase", "seed", "content.sql");
mkdirSync(join(process.cwd(), "supabase", "seed"), { recursive: true });
writeFileSync(out, seedSql(buildBundledSnapshot()), "utf8");
console.log(`Wrote ${out}`);
