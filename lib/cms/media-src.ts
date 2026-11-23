import type { MediaRow } from "./types";

/** Public address of a media item: a file shipped with the site, or a Storage object. */
export function mediaSrc(row: Pick<MediaRow, "bucket" | "path">, storageBase: string | null): string {
  if (!row.bucket) return row.path;
  return `${storageBase ?? ""}/${row.bucket}/${row.path.split("/").map(encodeURIComponent).join("/")}`;
}
