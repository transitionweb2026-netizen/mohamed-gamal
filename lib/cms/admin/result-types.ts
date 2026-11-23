import type { FieldError } from "@/lib/cms/fields";

/** What every dashboard Server Action returns. */
export type ActionResult<T = undefined> = { ok: true; data: T; message?: string } | { ok: false; error: string; fieldErrors?: FieldError[] };
