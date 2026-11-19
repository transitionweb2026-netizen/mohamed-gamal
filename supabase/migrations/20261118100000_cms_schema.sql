-- =============================================================================
-- Dr. Mohamed Gamal — CMS schema
--
-- Content of the public website (Arabic + English), media metadata, admin
-- authorization and the activity log. Every table has Row Level Security:
--   * visitors (anon / authenticated) read only published / visible rows;
--   * administrators (rows in public.admins, checked by public.is_admin())
--     read and write everything; owners also manage administrators;
--   * the activity log is written by triggers and readable by admins only.
--
-- Idempotent where practical (IF NOT EXISTS / OR REPLACE); never drops data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Safe link check: site paths, in-page anchors, http(s), tel: and mailto:
-- only (no javascript:, data:, protocol-relative URLs).
create or replace function public.is_safe_href(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
     and length(value) <= 2048
     and value !~ '[[:cntrl:][:space:]]'
     and (
       (value ~ '^/' and value !~ '^//')
       or value ~ '^#[A-Za-z0-9_-]*$'
       or value ~* '^https?://[^/[:space:]]+'
       or value ~* '^tel:\+?[0-9]{4,20}$'
       or value ~* '^mailto:[^@[:space:]]+@[^@[:space:]]+$'
     );
$$;

-- -----------------------------------------------------------------------------
-- Administrators and authorization
-- -----------------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '' check (length(display_name) <= 80),
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'CMS administrators. A row here (never a client-side flag) is what grants access; owners manage this list.';

-- SECURITY DEFINER so policies can call them without granting read access to
-- public.admins; search_path is pinned and every name is schema-qualified.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'owner');
$$;

-- The CMS always keeps at least one owner.
create or replace function public.admins_keep_an_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    if not exists (select 1 from public.admins a where a.role = 'owner' and a.user_id <> old.user_id) then
      raise exception 'The CMS must keep at least one owner.' using errcode = 'check_violation';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists admins_keep_an_owner on public.admins;
create trigger admins_keep_an_owner
  before update or delete on public.admins
  for each row execute function public.admins_keep_an_owner();

-- Grants CMS access to an existing Supabase Auth user (owners only).
create or replace function public.admin_grant(p_email text, p_role text default 'editor', p_display_name text default '')
returns public.admins
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_email text;
  v_row public.admins;
begin
  if not public.is_owner() then
    raise exception 'Only owners can manage administrators.' using errcode = 'insufficient_privilege';
  end if;
  if p_role not in ('owner', 'editor') then
    raise exception 'Unknown role %.', p_role using errcode = 'check_violation';
  end if;
  select u.id, u.email into v_user_id, v_email from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if v_user_id is null then
    raise exception 'No Supabase Auth user with this email. Create or invite the user first (Authentication → Users).'
      using errcode = 'no_data_found';
  end if;
  insert into public.admins (user_id, email, role, display_name)
  values (v_user_id, lower(v_email), p_role, left(coalesce(trim(p_display_name), ''), 80))
  on conflict (user_id) do update
    set role = excluded.role,
        email = excluded.email,
        display_name = case when excluded.display_name <> '' then excluded.display_name else public.admins.display_name end
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_revoke(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only owners can manage administrators.' using errcode = 'insufficient_privilege';
  end if;
  delete from public.admins where user_id = p_user_id;
end;
$$;

-- Last sign-in time of each administrator (owners only; auth.users is not exposed otherwise).
create or replace function public.admin_list()
returns table (user_id uuid, email text, display_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.user_id, a.email, a.display_name, a.role, a.created_at, u.last_sign_in_at
  from public.admins a
  join auth.users u on u.id = a.user_id
  where public.is_owner()
  order by a.role desc, a.email;
$$;

-- -----------------------------------------------------------------------------
-- Media library
-- -----------------------------------------------------------------------------

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'document')),
  -- Storage bucket, or NULL for a file shipped with the site (path = '/images/…').
  bucket text check (bucket in ('images', 'videos', 'documents')),
  path text not null,
  folder text not null default 'website'
    check (folder in ('website', 'hero', 'doctor', 'articles', 'video-thumbnails', 'icons', 'videos', 'documents')),
  mime_type text not null check (mime_type ~ '^(image|video|application)/[a-z0-9.+-]+$'),
  size_bytes bigint check (size_bytes >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  duration_seconds numeric(10, 3) check (duration_seconds >= 0),
  title text not null default '' check (length(title) <= 200),
  alt_ar text not null default '' check (length(alt_ar) <= 400),
  alt_en text not null default '' check (length(alt_en) <= 400),
  -- Path of the original file in /public when imported (keeps imports idempotent).
  legacy_path text unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path),
  check ((bucket is null and path ~ '^/') or (bucket is not null and path !~ '^/' and path !~ '\.\.')),
  check (
    (kind = 'image' and mime_type ~ '^image/')
    or (kind = 'video' and mime_type ~ '^video/')
    or (kind = 'document' and mime_type = 'application/pdf')
  )
);

create index if not exists media_kind_created_idx on public.media (kind, created_at desc);
create index if not exists media_folder_idx on public.media (folder, created_at desc);

-- -----------------------------------------------------------------------------
-- Global settings (single row), phone numbers, social links, navigation
-- -----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  -- Identity (header, footer, metadata, doctor cards)
  site_name_ar text not null default '' check (length(site_name_ar) <= 120),
  site_name_en text not null default '' check (length(site_name_en) <= 120),
  doctor_name_ar text not null default '' check (length(doctor_name_ar) <= 120),
  doctor_name_en text not null default '' check (length(doctor_name_en) <= 120),
  doctor_role_ar text not null default '' check (length(doctor_role_ar) <= 160),
  doctor_role_en text not null default '' check (length(doctor_role_en) <= 160),
  doctor_tagline_ar text not null default '' check (length(doctor_tagline_ar) <= 120),
  doctor_tagline_en text not null default '' check (length(doctor_tagline_en) <= 120),
  monogram text not null default '' check (length(monogram) <= 4),
  logo_id uuid references public.media (id) on delete restrict,
  favicon_id uuid references public.media (id) on delete restrict,
  portrait_id uuid references public.media (id) on delete restrict,
  -- SEO defaults for pages without their own values
  default_title_ar text not null default '' check (length(default_title_ar) <= 160),
  default_title_en text not null default '' check (length(default_title_en) <= 160),
  default_description_ar text not null default '' check (length(default_description_ar) <= 500),
  default_description_en text not null default '' check (length(default_description_en) <= 500),
  og_image_id uuid references public.media (id) on delete restrict,
  site_url text not null default '' check (site_url = '' or site_url ~* '^https://[a-z0-9.-]+(:[0-9]+)?$'),
  default_locale text not null default 'ar' check (default_locale in ('ar', 'en')),
  robots_index boolean not null default true,
  -- Contact (shared by the hero panels, contact page, footer and global CTA)
  whatsapp_digits text not null default '' check (whatsapp_digits ~ '^([0-9]{8,15})?$'),
  whatsapp_message_ar text not null default '' check (length(whatsapp_message_ar) <= 300),
  whatsapp_message_en text not null default '' check (length(whatsapp_message_en) <= 300),
  email text not null default '' check (email = '' or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  address_ar text not null default '' check (length(address_ar) <= 300),
  address_en text not null default '' check (length(address_en) <= 300),
  hours_ar text not null default '' check (length(hours_ar) <= 300),
  hours_en text not null default '' check (length(hours_en) <= 300),
  map_embed_url text not null default '' check (map_embed_url = '' or map_embed_url ~* '^https://(www\.)?google\.[a-z.]+/maps/embed\?[^[:space:]"<>]+$'),
  map_link_url text not null default '' check (map_link_url = '' or (map_link_url ~* '^https://' and public.is_safe_href(map_link_url))),
  updated_at timestamptz not null default now()
);

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null default '' check (length(label_ar) <= 60),
  label_en text not null default '' check (length(label_en) <= 60),
  -- Shown to visitors exactly as written, e.g. "0114 654 0705".
  display text not null check (length(display) between 4 and 40),
  -- International format, digits only (tel: links), e.g. 201146540705.
  digits text not null check (digits ~ '^[0-9]{8,15}$'),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique
    check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'x', 'linkedin', 'snapchat', 'threads')),
  url text not null check (url ~* '^https://[^/[:space:]]+' and public.is_safe_href(url)),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9-]*$'),
  -- A child item is shown in its parent's dropdown (one level).
  parent_id uuid references public.navigation_items (id) on delete cascade,
  href text not null check (public.is_safe_href(href)),
  label_ar text not null default '' check (length(label_ar) <= 80),
  label_en text not null default '' check (length(label_en) <= 80),
  sort_order integer not null default 0,
  visible boolean not null default true,
  show_in_header boolean not null default true,
  show_in_footer boolean not null default true,
  open_in_new_tab boolean not null default false,
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

-- -----------------------------------------------------------------------------
-- Pages (SEO) and their sections
-- -----------------------------------------------------------------------------

create table if not exists public.pages (
  key text primary key check (key ~ '^[a-z][a-z0-9-]*$'),
  -- Public path ("/", "/about" …); NULL for the shared "global" sections.
  path text check (path is null or (path ~ '^/' and public.is_safe_href(path))),
  sort_order integer not null default 0,
  name_ar text not null default '' check (length(name_ar) <= 80),
  name_en text not null default '' check (length(name_en) <= 80),
  seo_title_ar text not null default '' check (length(seo_title_ar) <= 160),
  seo_title_en text not null default '' check (length(seo_title_en) <= 160),
  seo_description_ar text not null default '' check (length(seo_description_ar) <= 500),
  seo_description_en text not null default '' check (length(seo_description_en) <= 500),
  og_title_ar text not null default '' check (length(og_title_ar) <= 160),
  og_title_en text not null default '' check (length(og_title_en) <= 160),
  og_description_ar text not null default '' check (length(og_description_ar) <= 500),
  og_description_en text not null default '' check (length(og_description_en) <= 500),
  og_image_id uuid references public.media (id) on delete restrict,
  -- Empty = the page's own address. Only for pages whose content lives elsewhere.
  canonical_url text not null default '' check (canonical_url = '' or (canonical_url ~* '^https://' and public.is_safe_href(canonical_url))),
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  twitter_card text not null default 'summary_large_image' check (twitter_card in ('summary', 'summary_large_image')),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null references public.pages (key) on update cascade on delete restrict,
  key text not null check (key ~ '^[a-z][a-zA-Z0-9]*$'),
  type text not null check (type ~ '^[a-z][a-zA-Z0-9]*$'),
  sort_order integer not null default 0,
  visible boolean not null default true,
  -- Published content (what visitors see). Unpublished edits live in section_drafts.
  content jsonb not null default '{}' check (jsonb_typeof(content) = 'object'),
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (page_key, key)
);

create index if not exists page_sections_page_order_idx on public.page_sections (page_key, sort_order);

-- Unpublished edits of a section (administrators only — never public).
create table if not exists public.section_drafts (
  section_id uuid primary key references public.page_sections (id) on delete cascade,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Collections
-- -----------------------------------------------------------------------------

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text not null check (icon ~ '^[A-Za-z][A-Za-z0-9]{1,39}$'),
  image_id uuid references public.media (id) on delete restrict,
  -- Featured services are the large cards on the services page.
  featured boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  title_ar text not null default '' check (length(title_ar) <= 160),
  title_en text not null default '' check (length(title_en) <= 160),
  summary_ar text not null default '' check (length(summary_ar) <= 600),
  summary_en text not null default '' check (length(summary_en) <= 600),
  points_ar text[] not null default '{}' check (cardinality(points_ar) <= 8),
  points_en text[] not null default '{}' check (cardinality(points_en) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text not null check (icon ~ '^[A-Za-z][A-Za-z0-9]{1,39}$'),
  image_id uuid references public.media (id) on delete restrict,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  region_ar text not null default '' check (length(region_ar) <= 120),
  region_en text not null default '' check (length(region_en) <= 120),
  text_ar text not null default '' check (length(text_ar) <= 600),
  text_en text not null default '' check (length(text_en) <= 600),
  items_ar text[] not null default '{}' check (cardinality(items_ar) <= 12),
  items_en text[] not null default '{}' check (cardinality(items_en) <= 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text not null check (icon ~ '^[A-Za-z][A-Za-z0-9]{1,39}$'),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  title_ar text not null default '' check (length(title_ar) <= 120),
  title_en text not null default '' check (length(title_en) <= 120),
  text_ar text not null default '' check (length(text_ar) <= 400),
  text_en text not null default '' check (length(text_en) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stats (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text not null check (icon ~ '^[A-Za-z][A-Za-z0-9]{1,39}$'),
  -- Shown as written ("15+", "98%"); numbers count up on the website.
  value text not null default '' check (length(value) <= 24),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  label_ar text not null default '' check (length(label_ar) <= 120),
  label_en text not null default '' check (length(label_en) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Where the video plays from: a YouTube video, an external URL or an uploaded file.
  source text not null default 'youtube' check (source in ('youtube', 'url', 'file')),
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  video_url text check (video_url is null or (video_url ~* '^https://' and public.is_safe_href(video_url))),
  file_id uuid references public.media (id) on delete restrict,
  poster_id uuid references public.media (id) on delete restrict,
  featured boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  category_ar text not null default '' check (length(category_ar) <= 60),
  category_en text not null default '' check (length(category_en) <= 60),
  title_ar text not null default '' check (length(title_ar) <= 160),
  title_en text not null default '' check (length(title_en) <= 160),
  description_ar text not null default '' check (length(description_ar) <= 600),
  description_en text not null default '' check (length(description_en) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  name_ar text not null default '' check (length(name_ar) <= 80),
  name_en text not null default '' check (length(name_en) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid references public.article_categories (id) on delete restrict,
  cover_id uuid references public.media (id) on delete restrict,
  og_image_id uuid references public.media (id) on delete restrict,
  published_on date,
  -- The one main article on the articles page (see articles_single_featured).
  featured boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  title_ar text not null default '' check (length(title_ar) <= 200),
  title_en text not null default '' check (length(title_en) <= 200),
  excerpt_ar text not null default '' check (length(excerpt_ar) <= 600),
  excerpt_en text not null default '' check (length(excerpt_en) <= 600),
  author_ar text not null default '' check (length(author_ar) <= 120),
  author_en text not null default '' check (length(author_en) <= 120),
  cover_alt_ar text not null default '' check (length(cover_alt_ar) <= 400),
  cover_alt_en text not null default '' check (length(cover_alt_en) <= 400),
  -- Rich text as a structured document (never HTML), per language.
  body_ar jsonb not null default '{"type": "doc", "content": []}' check (jsonb_typeof(body_ar) = 'object' and body_ar ->> 'type' = 'doc'),
  body_en jsonb not null default '{"type": "doc", "content": []}' check (jsonb_typeof(body_en) = 'object' and body_en ->> 'type' = 'doc'),
  seo_title_ar text not null default '' check (length(seo_title_ar) <= 160),
  seo_title_en text not null default '' check (length(seo_title_en) <= 160),
  seo_description_ar text not null default '' check (length(seo_description_ar) <= 500),
  seo_description_en text not null default '' check (length(seo_description_en) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Making an article featured un-features the others.
create or replace function public.articles_single_featured()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.featured then
    update public.articles set featured = false where featured and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_single_featured on public.articles;
create trigger articles_single_featured
  after insert or update of featured on public.articles
  for each row when (new.featured) execute function public.articles_single_featured();

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  rating smallint check (rating between 1 and 5),
  avatar_id uuid references public.media (id) on delete restrict,
  -- Marks layout placeholders so they are never mistaken for real feedback.
  is_placeholder boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  quote_ar text not null default '' check (length(quote_ar) <= 1200),
  quote_en text not null default '' check (length(quote_en) <= 1200),
  name_ar text not null default '' check (length(name_ar) <= 120),
  name_en text not null default '' check (length(name_en) <= 120),
  meta_ar text not null default '' check (length(meta_ar) <= 160),
  meta_en text not null default '' check (length(meta_en) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  group_key text not null check (group_key in ('home', 'services')),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  question_ar text not null default '' check (length(question_ar) <= 300),
  question_en text not null default '' check (length(question_en) <= 300),
  answer_ar text not null default '' check (length(answer_ar) <= 1500),
  answer_en text not null default '' check (length(answer_en) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Education, experience, certifications and achievements of the doctor.
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('education', 'experience', 'certification', 'achievement')),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  title_ar text not null default '' check (length(title_ar) <= 200),
  title_en text not null default '' check (length(title_en) <= 200),
  place_ar text not null default '' check (length(place_ar) <= 200),
  place_en text not null default '' check (length(place_en) <= 200),
  period_ar text not null default '' check (length(period_ar) <= 60),
  period_en text not null default '' check (length(period_en) <= 60),
  text_ar text not null default '' check (length(text_ar) <= 600),
  text_en text not null default '' check (length(text_en) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Interface strings (button labels, accessible names, small messages)
-- -----------------------------------------------------------------------------

create table if not exists public.ui_strings (
  key text primary key check (key ~ '^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$'),
  value_ar text not null default '' check (length(value_ar) <= 600),
  value_en text not null default '' check (length(value_en) <= 600),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Activity log (written by triggers and the dashboard; never edited)
-- -----------------------------------------------------------------------------

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text not null default '',
  action text not null check (action in (
    'create', 'update', 'delete', 'publish', 'unpublish', 'save_draft', 'discard_draft',
    'reorder', 'show', 'hide', 'upload', 'replace', 'sign_in', 'grant', 'revoke'
  )),
  entity_type text not null check (length(entity_type) <= 60),
  entity_id text not null default '' check (length(entity_id) <= 120),
  entity_label text not null default '' check (length(entity_label) <= 200),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object')
);

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);

-- One trigger function for every content table. Only changes made by a
-- signed-in user are logged (imports and migrations run without one).
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_action text;
  v_changed text[];
  v_label text;
  v_id text;
begin
  if v_uid is null then
    return coalesce(new, old);
  end if;

  -- Section drafts: saving and discarding (publishing is logged on the section).
  if tg_table_name = 'section_drafts' then
    if tg_op = 'DELETE' and current_setting('cms.publishing', true) = 'on' then
      return old;
    end if;
    insert into public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label)
    select v_uid, coalesce((select a.email from public.admins a where a.user_id = v_uid), ''),
           case when tg_op = 'DELETE' then 'discard_draft' else 'save_draft' end,
           'page_sections', ps.id::text, ps.page_key || ' › ' || ps.key
    from public.page_sections ps where ps.id = (v_row ->> 'section_id')::uuid;
    return coalesce(new, old);
  end if;

  -- Administrators: access granted, changed or revoked.
  if tg_table_name = 'admins' then
    insert into public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, details)
    values (
      v_uid, coalesce((select a.email from public.admins a where a.user_id = v_uid), ''),
      case when tg_op = 'DELETE' then 'revoke' else 'grant' end,
      'admins', v_row ->> 'user_id', v_row ->> 'email', jsonb_build_object('role', v_row ->> 'role')
    );
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  else
    select coalesce(array_agg(k order by k), '{}') into v_changed
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at', 'updated_by') and (v_new -> k) is distinct from (v_old -> k);
    if cardinality(v_changed) = 0 then
      return new;
    end if;
    -- Reorders are logged once by the reorder function, not per row.
    if v_changed = array['sort_order'] then
      return new;
    end if;
    v_action := case
      when 'status' = any (v_changed) and v_new ->> 'status' = 'published' then 'publish'
      when 'status' = any (v_changed) and v_new ->> 'status' = 'draft' then 'unpublish'
      when tg_table_name = 'page_sections' and 'content' = any (v_changed) then 'publish'
      when v_changed = array['visible'] and (v_new ->> 'visible')::boolean then 'show'
      when v_changed = array['visible'] then 'hide'
      else 'update'
    end;
  end if;

  v_id := coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'user_id', '');
  v_label := coalesce(
    nullif(v_row ->> 'title_en', ''), nullif(v_row ->> 'title_ar', ''),
    nullif(v_row ->> 'question_en', ''), nullif(v_row ->> 'label_en', ''),
    nullif(v_row ->> 'name_en', ''), nullif(v_row ->> 'region_en', ''),
    nullif(v_row ->> 'title', ''), nullif(v_row ->> 'platform', ''),
    nullif(v_row ->> 'display', ''), nullif(v_row ->> 'email', ''),
    case when tg_table_name = 'page_sections' then (v_row ->> 'page_key') || ' › ' || (v_row ->> 'key') end,
    nullif(v_row ->> 'slug', ''), nullif(v_row ->> 'key', ''), v_id
  );

  insert into public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, details)
  values (
    v_uid,
    coalesce((select a.email from public.admins a where a.user_id = v_uid), ''),
    v_action,
    tg_table_name,
    left(v_id, 120),
    left(coalesce(v_label, ''), 200),
    case when v_changed is not null then jsonb_build_object('fields', to_jsonb(v_changed)) else '{}'::jsonb end
  );
  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- Indexes on foreign keys and list orders
-- -----------------------------------------------------------------------------

create index if not exists services_image_idx on public.services (image_id);
create index if not exists services_order_idx on public.services (status, sort_order);
create index if not exists conditions_image_idx on public.conditions (image_id);
create index if not exists conditions_order_idx on public.conditions (status, sort_order);
create index if not exists process_steps_order_idx on public.process_steps (status, sort_order);
create index if not exists stats_order_idx on public.stats (status, sort_order);
create index if not exists videos_file_idx on public.videos (file_id);
create index if not exists videos_poster_idx on public.videos (poster_id);
create index if not exists videos_order_idx on public.videos (status, sort_order);
create index if not exists articles_category_idx on public.articles (category_id);
create index if not exists articles_cover_idx on public.articles (cover_id);
create index if not exists articles_og_idx on public.articles (og_image_id);
create index if not exists articles_order_idx on public.articles (status, sort_order);
create index if not exists testimonials_avatar_idx on public.testimonials (avatar_id);
create index if not exists testimonials_order_idx on public.testimonials (status, sort_order);
create index if not exists faqs_group_idx on public.faqs (group_key, status, sort_order);
create index if not exists credentials_kind_idx on public.credentials (kind, status, sort_order);
create index if not exists navigation_parent_idx on public.navigation_items (parent_id);
create index if not exists pages_og_idx on public.pages (og_image_id);

-- -----------------------------------------------------------------------------
-- updated_at and activity triggers
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'media', 'site_settings', 'phone_numbers', 'social_links', 'navigation_items', 'pages', 'page_sections',
    'section_drafts', 'services', 'conditions', 'process_steps', 'stats', 'videos', 'article_categories', 'articles',
    'testimonials', 'faqs', 'credentials', 'ui_strings'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('drop trigger if exists log_activity on public.%I', t);
    execute format('create trigger log_activity after insert or update or delete on public.%I for each row execute function public.log_activity()', t);
  end loop;
end;
$$;

drop trigger if exists log_activity on public.admins;
create trigger log_activity
  after insert or update of role or delete on public.admins
  for each row execute function public.log_activity();

-- -----------------------------------------------------------------------------
-- Media usage: where each file is used (dashboard + delete guard)
-- -----------------------------------------------------------------------------

create or replace function public.media_usages(p_media_id uuid)
returns table (source text, record_id text, label text, field text)
language sql
stable
set search_path = ''
as $$
  select 'services', s.id::text, s.title_en, 'image' from public.services s where s.image_id = p_media_id
  union all select 'conditions', c.id::text, c.region_en, 'image' from public.conditions c where c.image_id = p_media_id
  union all select 'videos', v.id::text, v.title_en, 'file' from public.videos v where v.file_id = p_media_id
  union all select 'videos', v.id::text, v.title_en, 'thumbnail' from public.videos v where v.poster_id = p_media_id
  union all select 'articles', a.id::text, a.title_en, 'cover' from public.articles a where a.cover_id = p_media_id
  union all select 'articles', a.id::text, a.title_en, 'sharing image' from public.articles a where a.og_image_id = p_media_id
  union all select 'articles', a.id::text, a.title_en, 'body'
    from public.articles a where a.body_ar::text like '%' || p_media_id::text || '%' or a.body_en::text like '%' || p_media_id::text || '%'
  union all select 'testimonials', t.id::text, t.name_en, 'avatar' from public.testimonials t where t.avatar_id = p_media_id
  union all select 'pages', p.key, p.name_en, 'sharing image' from public.pages p where p.og_image_id = p_media_id
  union all select 'sections', ps.id::text, ps.page_key || ' › ' || ps.key, 'content'
    from public.page_sections ps where ps.content::text like '%' || p_media_id::text || '%'
  union all select 'sections', ps.id::text, ps.page_key || ' › ' || ps.key, 'unpublished draft'
    from public.section_drafts d join public.page_sections ps on ps.id = d.section_id
    where d.content::text like '%' || p_media_id::text || '%'
  union all select 'settings', '1', 'Website settings', f.field
    from public.site_settings st,
    lateral (values ('logo', st.logo_id), ('favicon', st.favicon_id), ('doctor portrait', st.portrait_id), ('sharing image', st.og_image_id)) f(field, id)
    where f.id = p_media_id;
$$;

-- A file still used anywhere (including inside section JSON and article bodies) cannot be deleted.
create or replace function public.media_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.media_usages(old.id)) then
    raise exception 'This file is still used on the website. Remove it from those places first.'
      using errcode = 'foreign_key_violation';
  end if;
  return old;
end;
$$;

drop trigger if exists media_guard_delete on public.media;
create trigger media_guard_delete
  before delete on public.media
  for each row execute function public.media_guard_delete();

-- -----------------------------------------------------------------------------
-- Publishing, reordering
-- -----------------------------------------------------------------------------

-- Publishes a section's draft (security invoker: RLS decides who may).
create or replace function public.section_publish(p_id uuid)
returns public.page_sections
language plpgsql
set search_path = ''
as $$
declare
  v_row public.page_sections;
begin
  update public.page_sections ps
     set content = d.content, published_at = now(), updated_by = auth.uid()
    from public.section_drafts d
   where ps.id = p_id and d.section_id = ps.id
  returning ps.* into v_row;
  if v_row.id is null then
    raise exception 'There is no draft to publish, or this account may not publish it.' using errcode = 'insufficient_privilege';
  end if;
  perform set_config('cms.publishing', 'on', true);
  delete from public.section_drafts where section_id = p_id;
  perform set_config('cms.publishing', 'off', true);
  return v_row;
end;
$$;

-- Publishes every pending section draft of one page.
create or replace function public.page_publish_all(p_page_key text)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.page_sections ps
     set content = d.content, published_at = now(), updated_by = auth.uid()
    from public.section_drafts d
   where d.section_id = ps.id and ps.page_key = p_page_key;
  get diagnostics v_count = row_count;
  perform set_config('cms.publishing', 'on', true);
  delete from public.section_drafts d using public.page_sections ps
   where ps.id = d.section_id and ps.page_key = p_page_key;
  perform set_config('cms.publishing', 'off', true);
  return v_count;
end;
$$;

-- Saves a new order for rows of one list. SECURITY DEFINER (so it can write
-- one activity entry); access is checked explicitly and tables are whitelisted.
create or replace function public.cms_reorder(p_table text, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  i integer;
begin
  if p_table not in (
    'page_sections', 'phone_numbers', 'social_links', 'navigation_items', 'services', 'conditions', 'process_steps',
    'stats', 'videos', 'article_categories', 'articles', 'testimonials', 'faqs', 'credentials'
  ) then
    raise exception 'This list cannot be reordered.' using errcode = 'check_violation';
  end if;
  if not public.is_admin() then
    raise exception 'Only administrators can reorder content.' using errcode = 'insufficient_privilege';
  end if;
  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    execute format('update public.%I set sort_order = $1 where id = $2', p_table) using i * 10, p_ids[i];
  end loop;
  insert into public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, details)
  values (
    auth.uid(),
    coalesce((select a.email from public.admins a where a.user_id = auth.uid()), ''),
    'reorder', p_table, '', p_table, jsonb_build_object('count', coalesce(array_length(p_ids, 1), 0))
  );
end;
$$;

-- Activity the dashboard records itself (sign-in, uploads).
create or replace function public.log_event(p_action text, p_entity_type text, p_entity_id text default '', p_label text default '', p_details jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can record activity.' using errcode = 'insufficient_privilege';
  end if;
  if p_action not in ('sign_in', 'upload', 'replace', 'grant', 'revoke') then
    raise exception 'Unknown activity.' using errcode = 'check_violation';
  end if;
  insert into public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, details)
  values (
    auth.uid(),
    coalesce((select a.email from public.admins a where a.user_id = auth.uid()), ''),
    p_action, left(p_entity_type, 60), left(coalesce(p_entity_id, ''), 120), left(coalesce(p_label, ''), 200),
    case when jsonb_typeof(p_details) = 'object' then p_details else '{}'::jsonb end
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Public snapshot: everything the website renders, in one call. Security
-- invoker, so Row Level Security applies; filters to published / visible
-- rows explicitly as well. With p_preview, administrators get drafts too
-- (section drafts replace published content; unpublished items are included).
-- -----------------------------------------------------------------------------

create or replace function public.cms_snapshot(p_preview boolean default false)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_all boolean := p_preview and public.is_admin();
  v_sections jsonb;
begin
  -- Two separate statements: the drafts table (administrators only) is never
  -- part of a visitor's query plan, so a cached generic plan cannot touch it.
  if v_all then
    select coalesce(jsonb_agg(
             (to_jsonb(x) - 'updated_by')
             || jsonb_build_object('content', coalesce((select d.content from public.section_drafts d where d.section_id = x.id), x.content))
             order by x.page_key, x.sort_order, x.key), '[]'::jsonb)
      into v_sections
      from public.page_sections x where x.visible;
  else
    select coalesce(jsonb_agg((to_jsonb(x) - 'updated_by') order by x.page_key, x.sort_order, x.key), '[]'::jsonb)
      into v_sections
      from public.page_sections x where x.visible;
  end if;

  return jsonb_build_object(
    'preview', v_all,
    'settings', (select to_jsonb(s) from public.site_settings s where s.id = 1),
    'phones', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.id) from public.phone_numbers x where x.visible), '[]'::jsonb),
    'socials', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.platform) from public.social_links x where x.visible), '[]'::jsonb),
    'navigation', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.navigation_items x where x.visible), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.pages x), '[]'::jsonb),
    'sections', v_sections,
    'media', coalesce((select jsonb_agg(to_jsonb(x) - 'created_by' order by x.id) from public.media x), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.slug) from public.services x where v_all or x.status = 'published'), '[]'::jsonb),
    'conditions', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.slug) from public.conditions x where v_all or x.status = 'published'), '[]'::jsonb),
    'processSteps', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.process_steps x where v_all or x.status = 'published'), '[]'::jsonb),
    'stats', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.stats x where v_all or x.status = 'published'), '[]'::jsonb),
    'videos', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.slug) from public.videos x where v_all or x.status = 'published'), '[]'::jsonb),
    'articleCategories', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.article_categories x), '[]'::jsonb),
    'articles', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.slug) from public.articles x where v_all or x.status = 'published'), '[]'::jsonb),
    'testimonials', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order, x.key) from public.testimonials x where v_all or x.status = 'published'), '[]'::jsonb),
    'faqs', coalesce((select jsonb_agg(to_jsonb(x) order by x.group_key, x.sort_order, x.id) from public.faqs x where v_all or x.status = 'published'), '[]'::jsonb),
    'credentials', coalesce((select jsonb_agg(to_jsonb(x) order by x.kind, x.sort_order, x.id) from public.credentials x where v_all or x.status = 'published'), '[]'::jsonb),
    'uiStrings', coalesce((select jsonb_agg(to_jsonb(x) order by x.key) from public.ui_strings x), '[]'::jsonb)
  );
end;
$$;

-- Figures for the dashboard overview (administrators only).
create or replace function public.cms_dashboard_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can read dashboard figures.' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'pages', (select count(*) from public.pages where path is not null),
    'sections', (select count(*) from public.page_sections),
    'hiddenSections', (select count(*) from public.page_sections where not visible),
    'pendingDrafts', (select count(*) from public.section_drafts),
    'collections', jsonb_build_object(
      'services', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.services),
      'conditions', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.conditions),
      'videos', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.videos),
      'articles', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.articles),
      'testimonials', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.testimonials),
      'faqs', (select jsonb_build_object('published', count(*) filter (where status = 'published'), 'draft', count(*) filter (where status = 'draft')) from public.faqs)
    ),
    'placeholderTestimonials', (select count(*) from public.testimonials where is_placeholder and status = 'published'),
    'media', (select jsonb_build_object(
      'total', count(*),
      'images', count(*) filter (where kind = 'image'),
      'videos', count(*) filter (where kind = 'video'),
      'documents', count(*) filter (where kind = 'document'),
      'uploadedBytes', coalesce(sum(size_bytes) filter (where bucket is not null), 0)
    ) from public.media),
    'activityByDay', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(c.n, 0)) order by d.day)
      from generate_series((now() - interval '13 days')::date, now()::date, interval '1 day') as d(day)
      left join (
        select created_at::date as day, count(*) as n from public.activity_logs
        where created_at >= now() - interval '14 days' and action not in ('sign_in')
        group by 1
      ) c on c.day = d.day::date
    ), '[]'::jsonb),
    'lastUpdated', coalesce((
      select jsonb_agg(u order by u ->> 'updated_at' desc) from (
        select jsonb_build_object('type', 'section', 'id', ps.id, 'label', ps.page_key || ' › ' || ps.key, 'page', ps.page_key,
                                  'updated_at', greatest(ps.updated_at, d.updated_at), 'draft', d.section_id is not null) as u
          from public.page_sections ps left join public.section_drafts d on d.section_id = ps.id
         order by greatest(ps.updated_at, d.updated_at) desc nulls last limit 6
      ) s
    ), '[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.activity_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'media', 'site_settings', 'phone_numbers', 'social_links', 'navigation_items', 'pages', 'page_sections',
    'services', 'conditions', 'process_steps', 'stats', 'videos', 'article_categories', 'articles',
    'testimonials', 'faqs', 'credentials', 'ui_strings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Administrators: each sees their own row; owners see and manage everyone.
drop policy if exists "admins: read own row or all for owners" on public.admins;
create policy "admins: read own row or all for owners" on public.admins
  for select to authenticated
  using (user_id = auth.uid() or public.is_owner());

drop policy if exists "admins: owners manage" on public.admins;
create policy "admins: owners manage" on public.admins
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- An administrator may change their own display name (not their role).
drop policy if exists "admins: edit own name" on public.admins;
create policy "admins: edit own name" on public.admins
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = (select a.role from public.admins a where a.user_id = auth.uid()));

-- Section drafts: administrators only.
alter table public.section_drafts enable row level security;
drop policy if exists "drafts: admins" on public.section_drafts;
create policy "drafts: admins" on public.section_drafts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Activity log: administrators read; rows only come from the functions above.
drop policy if exists "activity: admins read" on public.activity_logs;
create policy "activity: admins read" on public.activity_logs
  for select to authenticated
  using (public.is_admin());

-- Public read + admin write, generated for every content table.
do $$
declare
  t text;
  visibility text;
begin
  for t, visibility in
    select * from (values
      ('media', 'true'),
      ('site_settings', 'true'),
      ('phone_numbers', 'visible'),
      ('social_links', 'visible'),
      ('navigation_items', 'visible'),
      ('pages', 'true'),
      ('page_sections', 'visible'),
      ('services', $q$status = 'published'$q$),
      ('conditions', $q$status = 'published'$q$),
      ('process_steps', $q$status = 'published'$q$),
      ('stats', $q$status = 'published'$q$),
      ('videos', $q$status = 'published'$q$),
      ('article_categories', 'true'),
      ('articles', $q$status = 'published'$q$),
      ('testimonials', $q$status = 'published'$q$),
      ('faqs', $q$status = 'published'$q$),
      ('credentials', $q$status = 'published'$q$),
      ('ui_strings', 'true')
    ) as v(tbl, vis)
  loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (%s)', t, visibility);
    execute format('drop policy if exists "admins read all" on public.%I', t);
    execute format('create policy "admins read all" on public.%I for select to authenticated using (public.is_admin())', t);
    execute format('drop policy if exists "admins insert" on public.%I', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('drop policy if exists "admins update" on public.%I', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists "admins delete" on public.%I', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privileges (Row Level Security narrows them further)
-- -----------------------------------------------------------------------------

revoke all on
  public.admins, public.activity_logs, public.section_drafts, public.media, public.site_settings, public.phone_numbers,
  public.social_links, public.navigation_items, public.pages, public.page_sections, public.services,
  public.conditions, public.process_steps, public.stats, public.videos, public.article_categories,
  public.articles, public.testimonials, public.faqs, public.credentials, public.ui_strings
  from anon, authenticated;

grant select on
  public.media, public.site_settings, public.phone_numbers, public.social_links, public.navigation_items,
  public.pages, public.page_sections, public.services, public.conditions, public.process_steps, public.stats, public.videos,
  public.article_categories, public.articles, public.testimonials, public.faqs, public.credentials, public.ui_strings
  to anon, authenticated;

grant insert, update, delete on
  public.media, public.site_settings, public.phone_numbers, public.social_links, public.navigation_items,
  public.pages, public.page_sections, public.services, public.conditions, public.process_steps, public.stats,
  public.videos, public.article_categories, public.articles, public.testimonials, public.faqs, public.credentials,
  public.ui_strings
  to authenticated;

grant select, insert, update, delete on public.admins to authenticated;
grant select, insert, update, delete on public.section_drafts to authenticated;
grant select on public.activity_logs to authenticated;

revoke execute on function public.cms_snapshot(boolean) from public;
grant execute on function public.cms_snapshot(boolean) to anon, authenticated;
revoke execute on function public.cms_dashboard_stats() from public, anon;
grant execute on function public.cms_dashboard_stats() to authenticated;
revoke execute on function public.media_usages(uuid) from public, anon;
grant execute on function public.media_usages(uuid) to authenticated;
revoke execute on function public.section_publish(uuid) from public, anon;
grant execute on function public.section_publish(uuid) to authenticated;
revoke execute on function public.page_publish_all(text) from public, anon;
grant execute on function public.page_publish_all(text) to authenticated;
revoke execute on function public.cms_reorder(text, uuid[]) from public, anon;
grant execute on function public.cms_reorder(text, uuid[]) to authenticated;
revoke execute on function public.log_event(text, text, text, text, jsonb) from public, anon;
grant execute on function public.log_event(text, text, text, text, jsonb) to authenticated;
revoke execute on function public.admin_grant(text, text, text) from public, anon;
grant execute on function public.admin_grant(text, text, text) to authenticated;
revoke execute on function public.admin_revoke(uuid) from public, anon;
grant execute on function public.admin_revoke(uuid) to authenticated;
revoke execute on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.is_safe_href(text) to anon, authenticated;
