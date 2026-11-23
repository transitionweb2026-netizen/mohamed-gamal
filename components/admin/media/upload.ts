"use client";

import * as tus from "tus-js-client";
import { BUCKET_RULES, bucketForMime, mimeOf, storagePathFor } from "@/lib/cms/media-rules";
import type { UploadedFile } from "@/lib/cms/admin/actions/media";
import type { MediaFolder } from "@/lib/cms/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { supabaseUrl } from "@/lib/supabase/env";

export type StorageMode = "supabase" | "local";

/** Files above this size use resumable (TUS) uploads, which survive network interruptions. */
const RESUMABLE_FROM = 6 * 1024 * 1024;

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

/** Width / height of images and videos, duration of videos (read in the browser). */
export async function readMediaMeta(file: File): Promise<{ width: number | null; height: number | null; durationSeconds: number | null }> {
  const mime = mimeOf(file);
  const url = URL.createObjectURL(file);
  try {
    if (mime.startsWith("image/")) {
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => undefined);
      return { width: img.naturalWidth || null, height: img.naturalHeight || null, durationSeconds: null };
    }
    if (mime.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => resolve();
        setTimeout(resolve, 8000);
      });
      return { width: video.videoWidth || null, height: video.videoHeight || null, durationSeconds: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) / 1000 : null };
    }
    return { width: null, height: null, durationSeconds: null };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Uploads a file straight from the browser to Supabase Storage with the
 * administrator's own session (Storage policies allow administrators only).
 * Large files use resumable uploads. In local development mode the file goes
 * to the dev server instead.
 */
export async function uploadFile(file: File, folder: MediaFolder, mode: StorageMode, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<UploadedFile> {
  const mimeType = mimeOf(file);
  const bucket = bucketForMime(mimeType);
  if (!bucket) throw new Error("This file type is not accepted.");
  const path = storagePathFor(folder, file.name, randomId());
  const meta = await readMediaMeta(file);
  const result: UploadedFile = { bucket, path, mimeType, sizeBytes: file.size, ...meta };

  if (mode === "local") {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const body = new FormData();
      body.set("file", file);
      body.set("bucket", bucket);
      body.set("path", path);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("The upload was refused.")));
      xhr.onerror = () => reject(new Error("The upload failed. Check the connection and try again."));
      signal?.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Upload cancelled", "AbortError"));
      });
      xhr.open("POST", "/admin/api/local-upload");
      xhr.send(body);
    });
    onProgress(1);
    return result;
  }

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again to upload.");

  if (file.size < RESUMABLE_FROM) {
    onProgress(0.15);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: mimeType, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(storageMessage(error.message));
    onProgress(1);
    return result;
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: bucket, objectName: path, contentType: mimeType, cacheControl: "31536000" },
      chunkSize: 6 * 1024 * 1024, // required by Supabase
      onError: (error) => reject(new Error(storageMessage(error.message))),
      onProgress: (sent, total) => onProgress(total ? sent / total : 0),
      onSuccess: () => resolve(),
    });
    signal?.addEventListener("abort", () => {
      upload.abort(true).catch(() => undefined);
      reject(new DOMException("Upload cancelled", "AbortError"));
    });
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
  return result;
}

function storageMessage(message: string): string {
  if (/maximum allowed size|too large|413/i.test(message)) return "The file is larger than the storage limit allows.";
  if (/mime|type/i.test(message)) return "This file type is not accepted by the storage bucket.";
  if (/row-level security|unauthorized|403/i.test(message)) return "Your account is not allowed to upload files.";
  return `The upload failed: ${message}`;
}

export const acceptFor = (kind: "image" | "video" | "document" | "any") =>
  kind === "any" ? Object.values(BUCKET_RULES).map((r) => r.accept).join(",") : BUCKET_RULES[kind === "image" ? "images" : kind === "video" ? "videos" : "documents"].accept;
