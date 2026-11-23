/**
 * Field definitions: one declarative description of every editable shape.
 * Used by the dashboard forms, by validation (in the browser and again on
 * the server), by the missing-translation checks and to map form documents
 * to table columns.
 *
 * A "document" is what a form edits: plain JSON in which every translated
 * value is `{ ar, en }`. Collections store documents as table columns
 * (`title` → `title_ar` / `title_en`, see docToRow / rowToDoc); sections store
 * them as-is in page_sections.content.
 */
import type { L } from "./types";
import { emptyRichDoc, isSafeLink, sanitizeRichDoc } from "./richtext";

export type Option = { value: string; label: string };

interface Base {
  key: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Table column (collections / settings), when it differs from the key in snake_case. */
  column?: string;
  /** Only shown (and validated, and saved) when another field of the same object has this value. */
  when?: { key: string; equals: unknown };
  /** Half-width in two-column form layouts. */
  half?: boolean;
}

export type Field =
  /** Text; translated unless `localized: false`. */
  | (Base & { type: "text"; localized?: boolean; multiline?: boolean; rows?: number; max?: number; dir?: "ltr"; placeholder?: string })
  /** Lines of text (paragraphs, bullets), per language. */
  | (Base & { type: "stringList"; itemLabel: string; multiline?: boolean; maxItems?: number; max?: number })
  | (Base & { type: "icon" })
  /** A link: site path, #anchor, https URL, tel: or mailto:. */
  | (Base & { type: "href" })
  /** Button: label per language + destination. */
  | (Base & { type: "cta"; optional?: boolean })
  /** Image chosen from the media library + focal point (sections). */
  | (Base & { type: "image" })
  /** A media library item id (collections / settings). */
  | (Base & { type: "media"; kind: "image" | "video" | "document" })
  | (Base & { type: "group"; fields: Field[] })
  | (Base & { type: "list"; itemLabel: string; fields: Field[]; min?: number; max?: number })
  | (Base & { type: "boolean" })
  | (Base & { type: "number"; min?: number; max?: number; step?: number; nullable?: boolean })
  | (Base & { type: "select"; options: Option[] })
  | (Base & { type: "date"; nullable?: boolean })
  /** URL-safe identifier; fixed once created so links never break. */
  | (Base & { type: "slug" })
  /** Free text matching a pattern (YouTube ids, digits …). */
  | (Base & { type: "pattern"; pattern: string; patternHelp: string; max?: number; nullable?: boolean; dir?: "ltr"; placeholder?: string })
  /** Rich text (articles), per language. */
  | (Base & { type: "richtext" })
  /** Another record (value: its id). */
  | (Base & { type: "reference"; collection: "articleCategories" });

export type FieldType = Field["type"];

export const LOCALES = ["ar", "en"] as const;

/** Field types whose stored value is `{ ar, en }`. */
export function isLocalized(field: Field): boolean {
  switch (field.type) {
    case "text":
      return field.localized !== false;
    case "stringList":
    case "richtext":
      return true;
    default:
      return false;
  }
}

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const POSITION_PATTERN = /^([a-z0-9%. -]{1,40})?$/;

export function isSafeHref(value: unknown): value is string {
  return isSafeLink(value);
}

/* ---- Empty values ------------------------------------------------------------ */

const pair = <T>(make: () => T): L<T> => ({ ar: make(), en: make() });

export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "text":
      return isLocalized(field) ? pair(() => "") : "";
    case "stringList":
      return pair((): string[] => []);
    case "richtext":
      return pair(emptyRichDoc);
    case "icon":
      return "Sparkles";
    case "href":
      return "/";
    case "cta":
      return field.optional ? null : { label: pair(() => ""), href: "/" };
    case "image":
      return { id: null, position: "" };
    case "media":
    case "reference":
      return null;
    case "group":
      return emptyDoc(field.fields);
    case "list":
      return [];
    case "boolean":
      return false;
    case "number":
      return field.nullable ? null : (field.min ?? 0);
    case "select":
      return field.options[0]?.value ?? "";
    case "date":
      return field.nullable ? null : new Date().toISOString().slice(0, 10);
    case "slug":
    case "pattern":
      return field.type === "pattern" && field.nullable ? null : "";
  }
}

export function emptyDoc(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.key, emptyValue(field)]));
}

/**
 * A stored document completed with empty values for fields it does not have
 * yet (e.g. fields added after the content was written), so forms always get
 * the full shape. Unknown keys are dropped.
 */
export function withDefaults(fields: Field[], doc: unknown): Record<string, unknown> {
  const record = typeof doc === "object" && doc !== null && !Array.isArray(doc) ? (doc as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = record[field.key];
    if (value === undefined) out[field.key] = emptyValue(field);
    else if (field.type === "group") out[field.key] = withDefaults(field.fields, value);
    else if (field.type === "list") out[field.key] = Array.isArray(value) ? value.map((item) => withDefaults(field.fields, item)) : [];
    else if (isLocalized(field) && (typeof value !== "object" || value === null || !("ar" in value) || !("en" in value))) {
      const empty = emptyValue(field) as Record<string, unknown>;
      out[field.key] = typeof value === "object" && value !== null ? { ...empty, ...(value as object) } : empty;
    } else if (field.type === "cta" && value !== null && typeof value === "object") {
      const empty = { label: { ar: "", en: "" }, href: "/" };
      out[field.key] = { ...empty, ...(value as object) };
    } else out[field.key] = value;
  }
  return out;
}

/* ---- Validation -------------------------------------------------------------- */

export interface FieldError {
  /** Dotted path in the document, e.g. "cta.href" or "items.2.title.en". */
  path: string;
  message: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isL = (value: unknown): value is L<unknown> => isObject(value) && "ar" in value && "en" in value;
const str = (value: unknown) => (typeof value === "string" ? value : "");

/** Whether a field applies, given the other values of its object. */
export function isActive(field: Field, siblings: Record<string, unknown>): boolean {
  return !field.when || siblings[field.when.key] === field.when.equals;
}

export function validateDoc(fields: Field[], doc: unknown, base = ""): FieldError[] {
  const errors: FieldError[] = [];
  const record = isObject(doc) ? doc : {};
  for (const field of fields) {
    if (!isActive(field, record)) continue;
    errors.push(...validateField(field, record[field.key], base ? `${base}.${field.key}` : field.key));
  }
  return errors;
}

function checkText(value: unknown, path: string, label: string, max: number | undefined, errors: FieldError[]) {
  if (typeof value !== "string") errors.push({ path, message: `${label}: expected text.` });
  else if (max && value.length > max) errors.push({ path, message: `${label}: at most ${max} characters (now ${value.length}).` });
}

export function validateField(field: Field, value: unknown, path: string): FieldError[] {
  const errors: FieldError[] = [];
  const fail = (message: string, where = path) => errors.push({ path: where, message: `${field.label}: ${message}` });

  switch (field.type) {
    case "text": {
      if (isLocalized(field)) {
        if (!isL(value)) return [{ path, message: `${field.label}: expected Arabic and English text.` }];
        checkText(value.ar, `${path}.ar`, field.label, field.max, errors);
        checkText(value.en, `${path}.en`, field.label, field.max, errors);
        if (field.required && !str(value.ar).trim() && !str(value.en).trim()) fail("required (in at least one language).");
      } else {
        checkText(value, path, field.label, field.max, errors);
        if (field.required && !str(value).trim()) fail("required.");
      }
      break;
    }
    case "stringList": {
      if (!isL(value)) return [{ path, message: `${field.label}: expected Arabic and English lists.` }];
      for (const lang of LOCALES) {
        const list = value[lang];
        if (!Array.isArray(list) || !list.every((v) => typeof v === "string")) fail("expected a list of texts.", `${path}.${lang}`);
        else {
          if (field.maxItems && list.length > field.maxItems) fail(`at most ${field.maxItems} lines.`, `${path}.${lang}`);
          list.forEach((v, i) => field.max && v.length > field.max && fail(`line ${i + 1} is longer than ${field.max} characters.`, `${path}.${lang}.${i}`));
        }
      }
      if (field.required && !(value.ar as string[]).some((v) => v.trim()) && !(value.en as string[]).some((v) => v.trim())) fail("add at least one line.");
      break;
    }
    case "richtext": {
      if (!isL(value) || !isObject(value.ar) || !isObject(value.en)) return [{ path, message: `${field.label}: expected Arabic and English text.` }];
      break;
    }
    case "icon":
      if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9]{1,39}$/.test(value)) fail("choose an icon.");
      break;
    case "href":
      if (!isSafeHref(value)) fail("use a site path (/contact), #anchor, https:// address, tel: or mailto: link.");
      break;
    case "cta": {
      if (value === null && field.optional) break;
      if (!isObject(value)) return [{ path, message: `${field.label}: expected a button.` }];
      errors.push(...validateField({ type: "text", key: "label", label: `${field.label} — label`, max: 60 }, value.label, `${path}.label`));
      if (!isSafeHref(value.href)) fail("the destination must be a site path (/contact), #anchor, https:// address, tel: or mailto: link.", `${path}.href`);
      break;
    }
    case "image": {
      if (!isObject(value)) return [{ path, message: `${field.label}: expected an image.` }];
      if (value.id !== null && !isUuid(value.id)) fail("choose an image from the media library.");
      if (field.required && !value.id) fail("an image is required.");
      if (!POSITION_PATTERN.test(str(value.position))) fail('focal point like "50% 30%" or "center top".', `${path}.position`);
      break;
    }
    case "media":
    case "reference":
      if (value !== null && !isUuid(value)) fail("invalid selection.");
      if (field.required && !value) fail("required.");
      break;
    case "group":
      errors.push(...validateDoc(field.fields, value, path));
      break;
    case "list": {
      if (!Array.isArray(value)) return [{ path, message: `${field.label}: expected a list.` }];
      if (field.min !== undefined && value.length < field.min) fail(`at least ${field.min} ${field.itemLabel.toLowerCase()}(s).`);
      if (field.max !== undefined && value.length > field.max) fail(`at most ${field.max} ${field.itemLabel.toLowerCase()}(s).`);
      value.forEach((item, i) => errors.push(...validateDoc(field.fields, item, `${path}.${i}`)));
      break;
    }
    case "boolean":
      if (typeof value !== "boolean") fail("expected yes or no.");
      break;
    case "number":
      if (value === null && field.nullable) break;
      if (typeof value !== "number" || !Number.isFinite(value)) fail("expected a number.");
      else if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) fail(`between ${field.min ?? "−∞"} and ${field.max ?? "∞"}.`);
      break;
    case "select":
      if (!field.options.some((o) => o.value === value)) fail("choose one of the options.");
      break;
    case "date":
      if (value === null && field.nullable) break;
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) fail("expected a date.");
      break;
    case "slug":
      if (typeof value !== "string" || !SLUG_PATTERN.test(value) || value.length > 80) fail("lowercase letters, digits and hyphens only (e.g. low-back-pain).");
      break;
    case "pattern": {
      if ((value === null || value === "") && field.nullable) break;
      if (typeof value !== "string") fail("expected text.");
      else if (field.max && value.length > field.max) fail(`at most ${field.max} characters.`);
      else if ((value || field.required) && !new RegExp(field.pattern).test(value)) fail(field.patternHelp);
      break;
    }
  }
  return errors;
}

/* ---- Pruning (what gets saved) -------------------------------------------------- */

const pick = (value: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
const pickL = (value: unknown) => (isL(value) ? pick(value as Record<string, unknown>, ["ar", "en"]) : value);

/**
 * The document with only known, active fields (groups and lists pruned
 * recursively, rich text sanitized) — stale or injected keys never reach the
 * database.
 */
export function pruneDoc(fields: Field[], doc: unknown): Record<string, unknown> {
  const record = isObject(doc) ? doc : {};
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (!isActive(field, record)) continue;
    const value = record[field.key];
    if (value === undefined) continue;
    out[field.key] = cleanValue(field, value);
  }
  return out;
}

function cleanValue(field: Field, value: unknown): unknown {
  switch (field.type) {
    case "group":
      return pruneDoc(field.fields, value);
    case "list":
      return Array.isArray(value) ? value.map((item) => pruneDoc(field.fields, item)) : [];
    case "text":
      return isLocalized(field) ? pickL(value) : value;
    case "stringList":
      return isL(value) ? { ar: Array.isArray(value.ar) ? value.ar : [], en: Array.isArray(value.en) ? value.en : [] } : value;
    case "richtext":
      return isL(value) ? { ar: sanitizeRichDoc(value.ar), en: sanitizeRichDoc(value.en) } : value;
    case "cta": {
      if (!isObject(value)) return value;
      const out = pick(value, ["label", "href"]);
      if (out.label !== undefined) out.label = pickL(out.label);
      if (typeof out.href === "string") out.href = out.href.trim();
      return out;
    }
    case "image":
      return isObject(value) ? { id: value.id ?? null, position: str(value.position).trim() } : value;
    case "pattern":
      return typeof value === "string" ? (value.trim() === "" && field.nullable ? null : value.trim()) : value;
    case "href":
    case "slug":
      return typeof value === "string" ? value.trim() : value;
    default:
      return value;
  }
}

/* ---- Missing translations ----------------------------------------------------- */

/** Paths of texts filled in one language but empty in the other. */
export function missingTranslations(fields: Field[], doc: unknown, base = ""): { path: string; label: string; missing: "ar" | "en" }[] {
  const out: { path: string; label: string; missing: "ar" | "en" }[] = [];
  const record = isObject(doc) ? doc : {};
  for (const field of fields) {
    if (!isActive(field, record)) continue;
    const value = record[field.key];
    const path = base ? `${base}.${field.key}` : field.key;
    const check = (ar: boolean, en: boolean, label = field.label) => {
      if (ar && !en) out.push({ path, label, missing: "en" });
      if (en && !ar) out.push({ path, label, missing: "ar" });
    };
    if (field.type === "text" && isLocalized(field) && isL(value)) check(!!str(value.ar).trim(), !!str(value.en).trim());
    else if (field.type === "stringList" && isL(value))
      check((value.ar as string[]).some((v) => v.trim()), (value.en as string[]).some((v) => v.trim()));
    else if (field.type === "cta" && isObject(value) && isL(value.label)) check(!!str(value.label.ar).trim(), !!str(value.label.en).trim());
    else if (field.type === "group") out.push(...missingTranslations(field.fields, value, path));
    else if (field.type === "list" && Array.isArray(value)) value.forEach((item, i) => out.push(...missingTranslations(field.fields, item, `${path}.${i}`)));
  }
  return out;
}

/* ---- Documents ↔ table columns (collections, settings, SEO) ---------------------- */

const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Base column of a field: explicit `column`, or the key in snake_case (+ `_id` for media / references). */
export function columnOf(field: Field): string {
  if (field.column) return field.column;
  const base = snake(field.key);
  return field.type === "media" || field.type === "reference" ? `${base}_id` : base;
}

/** Every table column a field writes. */
export function columnsOf(field: Field): string[] {
  const column = columnOf(field);
  return isLocalized(field) ? [`${column}_ar`, `${column}_en`] : [column];
}

export function docToRow(fields: Field[], doc: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of fields) {
    const value = doc[field.key];
    if (value === undefined) continue;
    const column = columnOf(field);
    if (isLocalized(field) && isL(value)) {
      row[`${column}_ar`] = value.ar;
      row[`${column}_en`] = value.en;
    } else row[column] = value;
  }
  return row;
}

export function rowToDoc(fields: Field[], row: Record<string, unknown>): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  for (const field of fields) {
    const column = columnOf(field);
    if (isLocalized(field)) {
      const fallback = emptyValue(field) as L<unknown>;
      doc[field.key] = { ar: row[`${column}_ar`] ?? fallback.ar, en: row[`${column}_en`] ?? fallback.en };
    } else doc[field.key] = row[column] ?? emptyValue(field);
  }
  return doc;
}
