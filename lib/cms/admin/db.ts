import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The small set of database operations the dashboard uses, with two
 * implementations: Supabase (production) and a local Postgres for
 * development (lib/cms/local). Every call runs as the signed-in user, so
 * Row Level Security decides what is allowed.
 */

export type Where = Record<string, string | number | boolean | null | (string | number)[]>;

export interface SelectOptions {
  columns?: string;
  where?: Where;
  order?: [column: string, ascending: boolean][];
  limit?: number;
  offset?: number;
  count?: boolean;
}

export interface DbError {
  code?: string;
  message: string;
  details?: string;
}

export interface Db {
  select<T = Record<string, unknown>>(table: string, options?: SelectOptions): Promise<{ rows: T[]; count: number | null }>;
  insert<T = Record<string, unknown>>(table: string, row: Record<string, unknown>): Promise<T>;
  update<T = Record<string, unknown>>(table: string, where: Where, patch: Record<string, unknown>): Promise<T[]>;
  upsert(table: string, rows: Record<string, unknown>[], onConflict: string): Promise<void>;
  remove(table: string, where: Where): Promise<number>;
  rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T>;
}

export class DbFailure extends Error {
  constructor(readonly error: DbError) {
    super(error.message);
  }
}

function fail(error: { code?: string; message: string; details?: string | null } | null): never {
  throw new DbFailure({ code: error?.code, message: error?.message ?? "Unknown database error", details: error?.details ?? undefined });
}

/* eslint-disable @typescript-eslint/no-explicit-any -- the query builder's generic types do not survive chaining */
function applyWhere(query: any, where?: Where) {
  for (const [column, value] of Object.entries(where ?? {})) {
    if (Array.isArray(value)) query = query.in(column, value);
    else if (value === null) query = query.is(column, null);
    else query = query.eq(column, value);
  }
  return query;
}

export function supabaseDb(client: SupabaseClient): Db {
  return {
    async select(table, options = {}) {
      let query: any = client.from(table).select(options.columns ?? "*", options.count ? { count: "exact" } : undefined);
      query = applyWhere(query, options.where);
      for (const [column, ascending] of options.order ?? []) query = query.order(column, { ascending });
      if (options.limit !== undefined) query = query.range(options.offset ?? 0, (options.offset ?? 0) + options.limit - 1);
      const { data, error, count } = await query;
      if (error) fail(error);
      return { rows: data ?? [], count: count ?? null };
    },
    async insert(table, row) {
      const { data, error } = await client.from(table).insert(row).select().single();
      if (error) fail(error);
      return data;
    },
    async update(table, where, patch) {
      const { data, error } = await applyWhere(client.from(table).update(patch), where).select();
      if (error) fail(error);
      return data ?? [];
    },
    async upsert(table, rows, onConflict) {
      if (!rows.length) return;
      const { error } = await client.from(table).upsert(rows, { onConflict });
      if (error) fail(error);
    },
    async remove(table, where) {
      const { data, error } = await applyWhere(client.from(table).delete(), where).select();
      if (error) fail(error);
      return (data ?? []).length;
    },
    async rpc(fn, args) {
      const { data, error } = await client.rpc(fn, args ?? {});
      if (error) fail(error);
      return data;
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
