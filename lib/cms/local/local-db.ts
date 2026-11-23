import "server-only";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { DbFailure, type Db, type Where } from "@/lib/cms/admin/db";
import { buildBundledSnapshot } from "@/lib/cms/bundled";
import { seedSql } from "@/lib/cms/seed-sql";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SERVICE_ROLE_GRANTS, SUPABASE_STUB } from "./stub";

/**
 * DEVELOPMENT ONLY — a local Postgres (PGlite, stored in .cms-local/) with the
 * real migrations, seed and Row Level Security, so the dashboard can be used
 * and tested end to end before a Supabase project is connected.
 * Enabled with CMS_LOCAL=1 in `next dev`; never active in production or once
 * Supabase is configured.
 */
export const isLocalCms = process.env.NODE_ENV !== "production" && process.env.CMS_LOCAL === "1" && !isSupabaseConfigured;

export const LOCAL_ADMIN = { id: "00000000-0000-4000-8000-00000000a11a", email: "local-admin@localhost" } as const;

const store = globalThis as unknown as { __cmsLocalDb?: Promise<PGlite> };

async function open(): Promise<PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = join(process.cwd(), ".cms-local", "pgdata");
  const fresh = !existsSync(dir);
  mkdirSync(join(process.cwd(), ".cms-local"), { recursive: true });
  // Same value formats as Supabase (PostgREST): timestamps as ISO strings, dates as "YYYY-MM-DD".
  const isoTimestamp = (value: string) => {
    const date = new Date(value.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"));
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  };
  const db = new PGlite(dir, { parsers: { 1184: isoTimestamp, 1114: isoTimestamp, 1082: (value: string) => value } });
  if (fresh) {
    await db.exec(SUPABASE_STUB);
    const migrations = join(process.cwd(), "supabase", "migrations");
    for (const file of readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(migrations, file), "utf8"));
    await db.exec(SERVICE_ROLE_GRANTS);
    await db.exec(seedSql(buildBundledSnapshot()));
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [LOCAL_ADMIN.id, LOCAL_ADMIN.email]);
    await db.query(`insert into public.admins (user_id, email, role, display_name) values ($1, $2, 'owner', 'Local admin')`, [LOCAL_ADMIN.id, LOCAL_ADMIN.email]);
  }
  return db;
}

export function localPg(): Promise<PGlite> {
  if (!isLocalCms) throw new Error("The local CMS database is only available in development with CMS_LOCAL=1.");
  store.__cmsLocalDb ??= open();
  return store.__cmsLocalDb;
}

/* ---- SQL for the Db operations ------------------------------------------------- */

const IDENT = /^[a-z_][a-z0-9_]*$/;
const ident = (name: string) => {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return name;
};

/** Functions returning a set of rows / a single row type (others return one value). */
const SET_FUNCTIONS = new Set(["admin_list", "media_usages"]);
const ROW_FUNCTIONS = new Set(["section_publish", "admin_grant"]);

function whereSql(where: Where | undefined, params: unknown[]): string {
  const parts = Object.entries(where ?? {}).map(([column, value]) => {
    if (Array.isArray(value)) {
      params.push(value);
      return `${ident(column)} = any($${params.length})`;
    }
    if (value === null) return `${ident(column)} is null`;
    params.push(value);
    return `${ident(column)} = $${params.length}`;
  });
  return parts.length ? ` where ${parts.join(" and ")}` : "";
}

const param = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? JSON.stringify(value) : value);

type Actor = { userId: string } | "anon";

/** The development database, as the given user. */
export function localDb(actor: Actor): Db {
  return pgliteDb(localPg, actor);
}

/**
 * The dashboard's database operations over a PGlite database, run exactly as
 * PostgREST runs them: one transaction per call, as the `anon` or
 * `authenticated` role with the user's JWT claims, so RLS applies.
 */
export function pgliteDb(getPg: () => Promise<PGlite>, actor: Actor): Db {
  const run = async <T>(fn: (tx: Parameters<Parameters<PGlite["transaction"]>[0]>[0]) => Promise<T>): Promise<T> => {
    const pg = await getPg();
    try {
      return await pg.transaction(async (tx) => {
        const claims = actor === "anon" ? { role: "anon" } : { sub: actor.userId, role: "authenticated" };
        await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
        await tx.exec(`set local role ${actor === "anon" ? "anon" : "authenticated"}`);
        return fn(tx);
      });
    } catch (error) {
      if (error instanceof DbFailure) throw error;
      const e = error as { code?: string; message?: string; detail?: string };
      throw new DbFailure({ code: e.code, message: e.message ?? String(error), details: e.detail });
    }
  };

  return {
    select: (table, options = {}) =>
      run(async (tx) => {
        const params: unknown[] = [];
        const columns = options.columns && options.columns !== "*" ? options.columns.split(",").map((c) => ident(c.trim())).join(", ") : "*";
        let sql = `select ${columns} from public.${ident(table)}${whereSql(options.where, params)}`;
        const order = (options.order ?? []).map(([c, asc]) => `${ident(c)} ${asc ? "asc" : "desc"}`);
        if (order.length) sql += ` order by ${order.join(", ")}`;
        if (options.limit !== undefined) sql += ` limit ${Math.floor(options.limit)} offset ${Math.floor(options.offset ?? 0)}`;
        const { rows } = await tx.query(sql, params);
        let count: number | null = null;
        if (options.count) {
          const countParams: unknown[] = [];
          const r = await tx.query<{ n: number }>(`select count(*)::int as n from public.${ident(table)}${whereSql(options.where, countParams)}`, countParams);
          count = r.rows[0].n;
        }
        return { rows: rows as never[], count };
      }),
    insert: (table, row) =>
      run(async (tx) => {
        const columns = Object.keys(row).map(ident);
        const { rows } = await tx.query(
          `insert into public.${ident(table)} (${columns.join(", ")}) values (${columns.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
          Object.values(row).map(param),
        );
        return rows[0] as never;
      }),
    update: (table, where, patch) =>
      run(async (tx) => {
        const params: unknown[] = Object.values(patch).map(param);
        const set = Object.keys(patch).map((c, i) => `${ident(c)} = $${i + 1}`).join(", ");
        const { rows } = await tx.query(`update public.${ident(table)} set ${set}${whereSql(where, params)} returning *`, params);
        return rows as never[];
      }),
    upsert: (table, rows, onConflict) =>
      run(async (tx) => {
        for (const row of rows) {
          const columns = Object.keys(row).map(ident);
          const conflict = onConflict.split(",").map((c) => ident(c.trim()));
          const updates = columns.filter((c) => !conflict.includes(c)).map((c) => `${c} = excluded.${c}`);
          await tx.query(
            `insert into public.${ident(table)} (${columns.join(", ")}) values (${columns.map((_, i) => `$${i + 1}`).join(", ")}) on conflict (${conflict.join(", ")}) do ${updates.length ? `update set ${updates.join(", ")}` : "nothing"}`,
            Object.values(row).map(param),
          );
        }
      }),
    remove: (table, where) =>
      run(async (tx) => {
        const params: unknown[] = [];
        const { rows } = await tx.query(`delete from public.${ident(table)}${whereSql(where, params)} returning 1`, params);
        return rows.length;
      }),
    rpc: (fn, args = {}) =>
      run(async (tx) => {
        const names = Object.keys(args).map(ident);
        const call = `public.${ident(fn)}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")})`;
        const values = Object.values(args).map(param);
        if (SET_FUNCTIONS.has(fn)) return (await tx.query(`select * from ${call}`, values)).rows as never;
        if (ROW_FUNCTIONS.has(fn)) return (await tx.query(`select * from ${call}`, values)).rows[0] as never;
        const { rows } = await tx.query<{ result: unknown }>(`select ${call} as result`, values);
        return rows[0]?.result as never;
      }),
  };
}

/** Local uploads are written under public/uploads/<bucket>/<path> (development only). */
export const LOCAL_STORAGE_BASE = "/uploads";
