"use server";

import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/cms/fields";
import { BUCKET_RULES, FOLDERS, STORAGE_PATH_PATTERN } from "@/lib/cms/media-rules";
import type { MediaBucket, MediaFolder, MediaKind, MediaRow } from "@/lib/cms/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storageBaseFor, toMediaItem } from "../repo";
import { requireAdmin, type AdminSession } from "../session";
import { revalidateSite, run, UserError } from "../result";
import type { ActionResult } from "../result-types";
import type { MediaItem } from "../shapes";

/** Describes a file the browser has just uploaded to Storage. */
export interface UploadedFile {
  bucket: MediaBucket;
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

function checkUpload(file: UploadedFile, folder?: MediaFolder): { kind: MediaKind } {
  const rule = BUCKET_RULES[file?.bucket];
  if (!rule) throw new UserError("Unknown storage bucket.");
  if (!rule.mimeTypes.includes(file.mimeType)) throw new UserError("This file type is not accepted.");
  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes <= 0 || file.sizeBytes > rule.maxBytes) throw new UserError("The file is empty or larger than allowed.");
  if (typeof file.path !== "string" || !STORAGE_PATH_PATTERN.test(file.path)) throw new UserError("Invalid file location.");
  if (folder !== undefined) {
    const def = FOLDERS.find((f) => f.value === folder);
    if (!def || def.kind !== rule.kind) throw new UserError("This folder does not accept this kind of file.");
    if (!file.path.startsWith(`${folder}/`)) throw new UserError("Invalid file location.");
  }
  const dim = (v: number | null) => v === null || (Number.isInteger(v) && v > 0 && v < 100000);
  if (!dim(file.width) || !dim(file.height)) throw new UserError("Invalid image dimensions.");
  if (file.durationSeconds !== null && !(Number.isFinite(file.durationSeconds) && file.durationSeconds >= 0)) throw new UserError("Invalid video duration.");
  return { kind: rule.kind };
}

async function removeObject(session: AdminSession, bucket: MediaBucket, path: string) {
  try {
    if (session.mode === "local") {
      if (!STORAGE_PATH_PATTERN.test(path)) return;
      await unlink(join(process.cwd(), "public", "uploads", bucket, ...path.split("/")));
    } else {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) console.error("[cms] could not remove a storage object", bucket, path, error.message);
    }
  } catch (error) {
    // The database row is what the website uses; a leftover file is harmless.
    console.error("[cms] could not remove a stored file", bucket, path, error);
  }
}

const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Registers an uploaded file in the media library. */
export async function registerMedia(file: UploadedFile, meta: { folder: MediaFolder; title: string; altAr: string; altEn: string }): Promise<ActionResult<MediaItem>> {
  return run(async () => {
    const session = await requireAdmin();
    const { kind } = checkUpload(file, meta?.folder);
    const row = await session.db.insert<MediaRow>("media", {
      kind,
      bucket: file.bucket,
      path: file.path,
      folder: meta.folder,
      mime_type: file.mimeType,
      size_bytes: Math.round(file.sizeBytes),
      width: file.width,
      height: file.height,
      duration_seconds: file.durationSeconds,
      title: cleanText(meta.title, 200),
      alt_ar: cleanText(meta.altAr, 400),
      alt_en: cleanText(meta.altEn, 400),
      created_by: session.userId,
    });
    await session.db.rpc("log_event", { p_action: "upload", p_entity_type: "media", p_entity_id: row.id, p_label: row.title || file.path.split("/").pop(), p_details: { bucket: file.bucket, size: file.sizeBytes } });
    revalidatePath("/admin/media");
    return toMediaItem(row, storageBaseFor(session));
  }, "Uploaded.");
}

export async function updateMediaDetails(id: string, meta: { title: string; altAr: string; altEn: string; folder: MediaFolder }): Promise<ActionResult<MediaItem>> {
  return run(async () => {
    const session = await requireAdmin();
    if (!isUuid(id)) throw new UserError("Unknown file.");
    const { rows } = await session.db.select<MediaRow>("media", { columns: "id,kind", where: { id } });
    if (!rows[0]) throw new UserError("This file no longer exists.");
    const folder = FOLDERS.find((f) => f.value === meta?.folder);
    if (!folder || folder.kind !== rows[0].kind) throw new UserError("This folder does not accept this kind of file.");
    const [row] = await session.db.update<MediaRow>("media", { id }, { title: cleanText(meta.title, 200), alt_ar: cleanText(meta.altAr, 400), alt_en: cleanText(meta.altEn, 400), folder: folder.value });
    revalidateSite();
    revalidatePath("/admin/media");
    return toMediaItem(row, storageBaseFor(session));
  }, "Details saved.");
}

/** Points an existing media item at a newly uploaded file (everywhere it is used), then removes the old file. */
export async function replaceMediaFile(id: string, file: UploadedFile): Promise<ActionResult<MediaItem>> {
  return run(async () => {
    const session = await requireAdmin();
    if (!isUuid(id)) throw new UserError("Unknown file.");
    const { kind } = checkUpload(file);
    const { rows } = await session.db.select<MediaRow>("media", { where: { id } });
    const old = rows[0];
    if (!old) throw new UserError("This file no longer exists.");
    if (old.kind !== kind) throw new UserError(`Replace ${old.kind === "image" ? "an image with another image" : old.kind === "video" ? "a video with another video" : "a PDF with another PDF"}.`);
    const [row] = await session.db.update<MediaRow>("media", { id }, {
      bucket: file.bucket,
      path: file.path,
      mime_type: file.mimeType,
      size_bytes: Math.round(file.sizeBytes),
      width: file.width,
      height: file.height,
      duration_seconds: file.durationSeconds,
      legacy_path: null,
    });
    await session.db.rpc("log_event", { p_action: "replace", p_entity_type: "media", p_entity_id: id, p_label: row.title || file.path.split("/").pop(), p_details: {} });
    if (old.bucket && (old.bucket !== file.bucket || old.path !== file.path)) await removeObject(session, old.bucket, old.path);
    revalidateSite();
    revalidatePath("/admin/media");
    return toMediaItem(row, storageBaseFor(session));
  }, "File replaced everywhere it is used.");
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!isUuid(id)) throw new UserError("Unknown file.");
    const { rows } = await session.db.select<MediaRow>("media", { columns: "id,bucket,path", where: { id } });
    const row = rows[0];
    if (!row) throw new UserError("This file was already deleted.");
    await session.db.remove("media", { id }); // refused by the database while the file is in use
    if (row.bucket) await removeObject(session, row.bucket, row.path);
    revalidatePath("/admin/media");
    return undefined;
  }, "File deleted.");
}

/** Where a file is used (shown before deleting or replacing). */
export async function getMediaUsages(id: string): Promise<ActionResult<{ source: string; record_id: string; label: string; field: string }[]>> {
  return run(async () => {
    const session = await requireAdmin();
    if (!isUuid(id)) throw new UserError("Unknown file.");
    return session.db.rpc<{ source: string; record_id: string; label: string; field: string }[]>("media_usages", { p_media_id: id });
  });
}

/** Removes a file uploaded by the browser that was never registered (e.g. the dialog was closed). */
export async function discardUpload(bucket: MediaBucket, path: string): Promise<ActionResult> {
  return run(async () => {
    const session = await requireAdmin();
    if (!BUCKET_RULES[bucket] || !STORAGE_PATH_PATTERN.test(path)) throw new UserError("Invalid file location.");
    const { rows } = await session.db.select<{ id: string }>("media", { columns: "id", where: { bucket, path } });
    if (!rows.length) await removeObject(session, bucket, path);
    return undefined;
  });
}
