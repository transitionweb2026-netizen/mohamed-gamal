/**
 * Upload rules, shared by the dashboard (checked before uploading) and the
 * server (checked again before a file is registered). The storage buckets
 * enforce the same limits (supabase/migrations/*_cms_storage.sql).
 */
import type { MediaBucket, MediaFolder, MediaKind } from "./types";

export interface BucketRule {
  bucket: MediaBucket;
  kind: MediaKind;
  maxBytes: number;
  mimeTypes: string[];
  /** For the file input's accept attribute. */
  accept: string;
  label: string;
}

export const BUCKET_RULES: Record<MediaBucket, BucketRule> = {
  images: {
    bucket: "images",
    kind: "image",
    maxBytes: 15 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"],
    accept: "image/jpeg,image/png,image/webp,image/avif,image/gif,image/x-icon,.ico",
    label: "JPG, PNG, WebP, AVIF, GIF or ICO — up to 15 MB",
  },
  videos: {
    bucket: "videos",
    kind: "video",
    maxBytes: 500 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    accept: "video/mp4,video/webm,video/quicktime,.mov",
    label: "MP4, WebM or MOV — up to 500 MB (resumable upload)",
  },
  documents: {
    bucket: "documents",
    kind: "document",
    maxBytes: 25 * 1024 * 1024,
    mimeTypes: ["application/pdf"],
    accept: "application/pdf",
    label: "PDF — up to 25 MB",
  },
};

export const KIND_BUCKET: Record<MediaKind, MediaBucket> = { image: "images", video: "videos", document: "documents" };

export const FOLDERS: { value: MediaFolder; label: string; kind: MediaKind }[] = [
  { value: "website", label: "Website", kind: "image" },
  { value: "hero", label: "Hero covers", kind: "image" },
  { value: "doctor", label: "Doctor", kind: "image" },
  { value: "articles", label: "Articles", kind: "image" },
  { value: "video-thumbnails", label: "Video thumbnails", kind: "image" },
  { value: "icons", label: "Icons & logos", kind: "image" },
  { value: "videos", label: "Videos", kind: "video" },
  { value: "documents", label: "Documents", kind: "document" },
];

export const folderLabel = (folder: string) => FOLDERS.find((f) => f.value === folder)?.label ?? folder;

/** MIME type of a file, with fallbacks for types browsers often leave empty. */
export function mimeOf(file: { name: string; type: string }): string {
  if (file.type) return file.type === "image/jpg" ? "image/jpeg" : file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ({ ico: "image/x-icon", mov: "video/quicktime", mp4: "video/mp4", webm: "video/webm", pdf: "application/pdf", avif: "image/avif", webp: "image/webp" } as Record<string, string>)[ext ?? ""] ?? "";
}

export function bucketForMime(mime: string): MediaBucket | null {
  for (const rule of Object.values(BUCKET_RULES)) if (rule.mimeTypes.includes(mime)) return rule.bucket;
  return null;
}

/** Why a file cannot be uploaded, or null when it can. */
export function uploadProblem(file: { name: string; type: string; size: number }, expected?: MediaKind): string | null {
  const mime = mimeOf(file);
  const bucket = bucketForMime(mime);
  if (!bucket) return `${file.name}: this file type is not accepted (images, MP4/WebM/MOV videos and PDF documents only; SVG is not allowed).`;
  const rule = BUCKET_RULES[bucket];
  if (expected && rule.kind !== expected) return `${file.name}: please choose ${expected === "image" ? "an image" : expected === "video" ? "a video" : "a PDF document"}.`;
  if (file.size > rule.maxBytes) return `${file.name}: too large (${formatBytes(file.size)}); the limit is ${formatBytes(rule.maxBytes)}.`;
  if (file.size === 0) return `${file.name}: the file is empty.`;
  return null;
}

/** Storage path for a new upload: folder/yyyy/mm/<random>-<name>.<ext> */
export function storagePathFor(folder: MediaFolder, fileName: string, random: string): string {
  const now = new Date();
  const name = fileName.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  const rawExt = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const ext = rawExt.length <= 8 ? rawExt : "";
  const base =
    (dot > 0 ? name.slice(0, dot) : name)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${random}-${base}${ext ? `.${ext}` : ""}`;
}

export const STORAGE_PATH_PATTERN = /^(website|hero|doctor|articles|video-thumbnails|icons|videos|documents)\/\d{4}\/\d{2}\/[a-z0-9]{6,40}-[a-z0-9-]{1,60}(\.[a-z0-9]{1,8})?$/;

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
