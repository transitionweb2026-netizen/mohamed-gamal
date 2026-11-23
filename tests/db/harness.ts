/**
 * In-process Postgres (PGlite) with minimal stand-ins for the parts of
 * Supabase the migrations rely on: the anon / authenticated / service_role
 * roles, auth.users + auth.uid(), and storage.buckets + storage.objects with
 * Row Level Security. The real migration files then run unmodified, and
 * tests act as a given user by switching role and JWT claims, exactly the
 * way PostgREST does.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { SERVICE_ROLE_GRANTS, SUPABASE_STUB } from "../../lib/cms/local/stub";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");


export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

export async function applyMigrations(db: PGlite): Promise<void> {
  for (const file of migrationFiles()) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
}

/** A fresh database with the Supabase stand-ins and every migration applied. */
export async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await applyMigrations(db);
  await db.exec(SERVICE_ROLE_GRANTS);
  return db;
}

export type Actor = { role: "anon" } | { role: "authenticated"; userId: string } | { role: "service_role" };

/**
 * Runs `fn` as the given actor inside a transaction that is rolled back
 * (unless `persist`), so tests never leak changes into each other.
 */
export async function as<T>(db: PGlite, actor: Actor, fn: (tx: Transaction) => Promise<T>, persist = false): Promise<T> {
  let result: T | undefined;
  const ROLLBACK = Symbol("rollback");
  try {
    await db.transaction(async (tx) => {
      const claims = actor.role === "authenticated" ? { sub: actor.userId, role: "authenticated" } : { role: actor.role };
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
      await tx.exec(`set local role ${actor.role}`);
      result = await fn(tx);
      if (!persist) throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }
  return result as T;
}

/** Runs `fn` as `actor` and returns the error message (or null when it succeeds). */
export async function failureOf(db: PGlite, actor: Actor, fn: (tx: Transaction) => Promise<unknown>): Promise<string | null> {
  try {
    await as(db, actor, fn);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function createUser(db: PGlite, email: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [email]);
  return rows[0].id;
}

/** Creates an auth user and registers it as an administrator (as the database owner, like the setup script). */
export async function createAdmin(db: PGlite, email: string, role: "owner" | "editor" = "owner"): Promise<string> {
  const id = await createUser(db, email);
  await db.query(`insert into public.admins (user_id, email, role) values ($1, $2, $3)`, [id, email, role]);
  return id;
}
