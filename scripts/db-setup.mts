/**
 * Prepares the Supabase database for the CMS — run once from your own
 * computer (never on Vercel, never in the browser):
 *
 *   1. applies supabase/migrations/*.sql in order (they are idempotent);
 *   2. imports the website's current content (supabase/seed/content.sql;
 *      existing rows are never overwritten);
 *   3. optionally makes an existing Supabase Auth user the first owner.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_URL = "postgresql://postgres.<ref>:<password>@<host>:5432/postgres"
 *   npm run db:setup -- --owner you@example.com
 *
 * Options:  --owner <email>   grant the owner role to this existing user
 *           --skip-seed       do not import the content
 *           --dry-run         connect and check, change nothing
 *
 * The connection string is read from the environment only and never printed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set. Copy the connection string from Supabase → Project Settings → Database → Connection string (Session pooler), with your database password.");
  process.exit(1);
}
const ownerEmail = option("--owner")?.trim().toLowerCase();
const dryRun = flag("--dry-run");

const client = new pg.Client({
  connectionString: url,
  // Supabase requires TLS. Its certificate is issued by Supabase's own CA, so
  // set PGSSLROOTCERT to the downloaded certificate to verify it fully.
  ssl: process.env.PGSSLROOTCERT ? { ca: readFileSync(process.env.PGSSLROOTCERT, "utf8") } : { rejectUnauthorized: false },
});

const step = (text: string) => console.log(`\n▸ ${text}`);
const ok = (text: string) => console.log(`  ✓ ${text}`);

try {
  step("Connecting");
  await client.connect();
  const { rows: [info] } = await client.query<{ db: string; auth: boolean; storage: boolean }>(
    `select current_database() as db,
            exists (select 1 from information_schema.schemata where schema_name = 'auth') as auth,
            exists (select 1 from information_schema.schemata where schema_name = 'storage') as storage`,
  );
  if (!info.auth || !info.storage) throw new Error("This database has no auth / storage schema — it does not look like a Supabase project.");
  ok(`connected to the Supabase database "${info.db}"`);
  if (dryRun) {
    console.log("\nDry run: nothing was changed.");
    process.exit(0);
  }

  step("Applying migrations");
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await client.query("begin");
    try {
      await client.query(readFileSync(join(dir, file), "utf8"));
      await client.query("commit");
      ok(file);
    } catch (error) {
      await client.query("rollback");
      throw new Error(`${file}: ${(error as Error).message}`);
    }
  }

  if (!flag("--skip-seed")) {
    step("Importing the website content");
    // content.sql has its own transaction; rows that already exist are kept as they are.
    await client.query(readFileSync(join(process.cwd(), "supabase", "seed", "content.sql"), "utf8"));
    const { rows: [counts] } = await client.query<Record<string, number>>(
      `select (select count(*)::int from public.page_sections) as sections, (select count(*)::int from public.media) as media,
              (select count(*)::int from public.articles) as articles, (select count(*)::int from public.videos) as videos`,
    );
    ok(`${counts.sections} sections, ${counts.articles} articles, ${counts.videos} videos, ${counts.media} media items`);
  }

  if (ownerEmail) {
    step(`Granting the owner role to ${ownerEmail}`);
    const { rows } = await client.query<{ id: string; email: string }>(`select id, email from auth.users where lower(email) = $1`, [ownerEmail]);
    if (!rows[0]) {
      console.error(`  ✗ No Supabase Auth user with this email. Create it first: Authentication → Users → Add user → Create new user (with "Auto Confirm User"), then run this again.`);
      process.exitCode = 2;
    } else {
      await client.query(
        `insert into public.admins (user_id, email, role, display_name) values ($1, lower($2), 'owner', '')
         on conflict (user_id) do update set role = 'owner', email = excluded.email`,
        [rows[0].id, rows[0].email],
      );
      ok(`${rows[0].email} is an owner — they can sign in at /admin`);
    }
  }

  const { rows: owners } = await client.query<{ n: number }>(`select count(*)::int as n from public.admins where role = 'owner'`);
  if (!owners[0].n) console.log("\n! No owner yet. Create your user in Supabase Auth and run: npm run db:setup -- --skip-seed --owner <email>");
  console.log("\nDone.");
} catch (error) {
  console.error(`\n✗ ${(error as Error).message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
