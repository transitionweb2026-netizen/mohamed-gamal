-- =============================================================================
-- Dr. Mohamed Gamal — media storage
--
-- Three public buckets (files are shown on the public website, so anyone may
-- view them by URL). Only CMS administrators may upload, replace or delete.
-- Each bucket enforces a size limit and the accepted file types; the
-- dashboard checks the same rules before uploading (lib/cms/media-rules.ts).
--
--   images     website / hero / doctor / articles / video-thumbnails / icons
--   videos     uploaded video files (resumable uploads)
--   documents  PDF files
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', true, 15728640, -- 15 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']),
  ('videos', 'videos', true, 524288000, -- 500 MB (the project-wide upload limit may be lower; see docs/cms/SETUP.md)
    array['video/mp4', 'video/webm', 'video/quicktime']),
  ('documents', 'documents', true, 26214400, -- 25 MB
    array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cms media: admins read" on storage.objects;
create policy "cms media: admins read" on storage.objects
  for select to authenticated
  using (bucket_id in ('images', 'videos', 'documents') and public.is_admin());

drop policy if exists "cms media: admins upload" on storage.objects;
create policy "cms media: admins upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('images', 'videos', 'documents') and public.is_admin());

drop policy if exists "cms media: admins update" on storage.objects;
create policy "cms media: admins update" on storage.objects
  for update to authenticated
  using (bucket_id in ('images', 'videos', 'documents') and public.is_admin())
  with check (bucket_id in ('images', 'videos', 'documents') and public.is_admin());

drop policy if exists "cms media: admins delete" on storage.objects;
create policy "cms media: admins delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('images', 'videos', 'documents') and public.is_admin());
