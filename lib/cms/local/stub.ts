/**
 * Minimal stand-ins for the parts of Supabase the migrations rely on: the
 * anon / authenticated / service_role roles, auth.users + auth.uid(), and
 * storage.buckets + storage.objects with Row Level Security. Used by the
 * database tests and by the local development backend (never in production).
 */
export const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    last_sign_in_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid default auth.uid()
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
`;

export const SERVICE_ROLE_GRANTS = `
  grant all on all tables in schema public to service_role;
  grant execute on all functions in schema public to service_role;
`;
