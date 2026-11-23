import "server-only";
import type { Db } from "./db";
import { UserError } from "./result";
import { isActive, isUuid, type Field } from "@/lib/cms/fields";
import type { MediaKind } from "@/lib/cms/types";

interface MediaRef {
  id: string;
  kind: MediaKind;
  label: string;
}

/** Every media item a document points to (image / media fields, at any depth). */
export function collectMediaRefs(fields: Field[], doc: unknown): MediaRef[] {
  const record = typeof doc === "object" && doc !== null ? (doc as Record<string, unknown>) : {};
  const refs: MediaRef[] = [];
  for (const field of fields) {
    if (!isActive(field, record)) continue;
    const value = record[field.key];
    if (field.type === "image") {
      const id = (value as { id?: unknown } | null)?.id;
      if (isUuid(id)) refs.push({ id, kind: "image", label: field.label });
    } else if (field.type === "media" && isUuid(value)) refs.push({ id: value, kind: field.kind, label: field.label });
    else if (field.type === "group") refs.push(...collectMediaRefs(field.fields, value));
    else if (field.type === "list" && Array.isArray(value)) for (const item of value) refs.push(...collectMediaRefs(field.fields, item));
  }
  return refs;
}

/** Fails when a chosen file no longer exists or is of the wrong kind (e.g. a video as a cover image). */
export async function assertMediaRefs(db: Db, refs: MediaRef[]): Promise<void> {
  if (!refs.length) return;
  const ids = [...new Set(refs.map((r) => r.id))];
  const { rows } = await db.select<{ id: string; kind: MediaKind }>("media", { columns: "id,kind", where: { id: ids } });
  const kinds = new Map(rows.map((r) => [r.id, r.kind]));
  for (const ref of refs) {
    const kind = kinds.get(ref.id);
    if (!kind) throw new UserError(`${ref.label}: the chosen file no longer exists in the media library. Choose another one.`);
    if (kind !== ref.kind) throw new UserError(`${ref.label}: please choose ${ref.kind === "image" ? "an image" : ref.kind === "video" ? "a video file" : "a PDF document"}.`);
  }
}
