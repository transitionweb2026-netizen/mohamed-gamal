"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Copy, GripVertical, Lock, Plus, Trash2, Wand2 } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { emptyValue, isActive, isLocalized, type Field, type FieldError } from "@/lib/cms/fields";
import type { RichDoc } from "@/lib/cms/richtext";
import { Switch } from "../ui/primitives";
import { IconPicker } from "./icon-picker";
import { MediaField } from "./media-field";
import { RichTextEditor } from "./rich-text-editor";

type Doc = Record<string, unknown>;
type Lang = "ar" | "en";
type LValue<T = string> = { ar: T; en: T };

export interface FormContext {
  /** Options of reference fields, by collection. */
  references?: Record<string, { value: string; label: string }[]>;
  /** The identifier (slug / key) can no longer change (existing items). */
  identifierLocked?: boolean;
  /** Text to build a new identifier from (usually the English title). */
  slugSource?: string;
}

const SITE_PATHS = ["/", "/about", "/services", "/videos", "/articles", "/contact", "#booking", "#faq"];
const LANG_LABEL: Record<Lang, string> = { ar: "العربية", en: "English" };

const own = (errors: FieldError[], path: string) => errors.filter((e) => e.path === path || e.path.startsWith(`${path}.`));
const exact = (errors: FieldError[], path: string) => errors.filter((e) => e.path === path);
const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Renders and edits a document described by `fields` (every editor in the dashboard uses this). */
export function DocForm({ fields, value, onChange, errors = [], path = "", context = {} }: { fields: Field[]; value: Doc; onChange: (next: Doc) => void; errors?: FieldError[]; path?: string; context?: FormContext }) {
  return (
    <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
      {fields.map((field) =>
        isActive(field, value) ? (
          <div key={field.key} className={field.half ? "" : "md:col-span-2"}>
            <FieldControl field={field} value={value[field.key]} onChange={(v) => onChange({ ...value, [field.key]: v })} errors={errors} path={path ? `${path}.${field.key}` : field.key} context={context} />
          </div>
        ) : null,
      )}
    </div>
  );
}

function FieldShell({ label, help, htmlFor, errors, aside, children, required }: { label: ReactNode; help?: string; htmlFor?: string; errors: FieldError[]; aside?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={htmlFor} className="ad-label">
          {label}
          {required ? <span className="text-[var(--danger)]"> *</span> : null}
        </label>
        {aside}
      </div>
      {children}
      {help ? <p className="ad-help">{help}</p> : null}
      {errors.map((e) => (
        <p key={e.path + e.message} className="ad-error-text" role="alert">
          {e.message}
        </p>
      ))}
    </div>
  );
}

function FieldControl({ field, value, onChange, errors, path, context }: { field: Field; value: unknown; onChange: (v: unknown) => void; errors: FieldError[]; path: string; context: FormContext }) {
  const id = useId();
  const mine = own(errors, path);
  const invalid = mine.length > 0;

  switch (field.type) {
    case "text":
      if (isLocalized(field)) return <LocalizedText field={field} value={value as LValue} onChange={onChange} errors={mine} id={id} />;
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine} required={field.required} aside={field.max ? <Counter value={String(value ?? "")} max={field.max} /> : null}>
          <TextInput id={id} value={String(value ?? "")} onChange={onChange} multiline={field.multiline} rows={field.rows} dir={field.dir} placeholder={field.placeholder} invalid={invalid} />
        </FieldShell>
      );

    case "stringList":
      return <LocalizedLines field={field} value={value as LValue<string[]>} onChange={onChange} errors={mine} />;

    case "richtext": {
      const v = value as LValue<RichDoc>;
      return (
        <FieldShell label={field.label} help={field.help} errors={mine}>
          <div className="grid gap-4 2xl:grid-cols-2">
            {(["ar", "en"] as const).map((lang) => (
              <div key={lang}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="ad-lang-tag">{LANG_LABEL[lang]}</span>
                  {!hasRich(v[lang]) && hasRich(v[lang === "ar" ? "en" : "ar"]) ? <span className="ad-badge ad-badge-warn">Not translated yet</span> : null}
                </div>
                <RichTextEditor value={v[lang]} onChange={(doc) => onChange({ ...v, [lang]: doc })} dir={lang === "ar" ? "rtl" : "ltr"} label={`${field.label} (${LANG_LABEL[lang]})`} invalid={invalid} />
              </div>
            ))}
          </div>
        </FieldShell>
      );
    }

    case "icon":
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine}>
          <IconPicker id={id} value={String(value ?? "")} onChange={onChange} invalid={invalid} />
        </FieldShell>
      );

    case "href":
      return (
        <FieldShell label={field.label} help={field.help ?? "A page of the website (/contact), a section (#booking), or a full https:// address."} htmlFor={id} errors={mine}>
          <HrefInput id={id} value={String(value ?? "")} onChange={onChange} invalid={invalid} />
        </FieldShell>
      );

    case "cta":
      return <CtaControl field={field} value={value as { label: LValue; href: string } | null} onChange={onChange} errors={errors} path={path} />;

    case "image": {
      const v = (value as { id: string | null; position: string }) ?? { id: null, position: "" };
      return (
        <FieldShell label={field.label} help={field.help} errors={mine} required={field.required}>
          <MediaField id={id} kind="image" value={v.id} onChange={(mid) => onChange({ ...v, id: mid })} position={v.position} onPositionChange={(position) => onChange({ ...v, position })} invalid={invalid} />
        </FieldShell>
      );
    }

    case "media":
      return (
        <FieldShell label={field.label} help={field.help} errors={mine} required={field.required}>
          <MediaField id={id} kind={field.kind} value={(value as string | null) ?? null} onChange={onChange} invalid={invalid} />
        </FieldShell>
      );

    case "group":
      return (
        <fieldset className="ad-field-group">
          <legend className="ad-label px-1">{field.label}</legend>
          {field.help ? <p className="ad-help -mt-1 mb-3">{field.help}</p> : null}
          <DocForm fields={field.fields} value={(value as Doc) ?? {}} onChange={onChange} errors={errors} path={path} context={context} />
        </fieldset>
      );

    case "list":
      return <ListControl field={field} value={Array.isArray(value) ? (value as Doc[]) : []} onChange={onChange} errors={errors} path={path} context={context} />;

    case "boolean":
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/50 px-3.5 py-3">
          <Switch id={id} checked={value === true} onChange={onChange} label={field.label} />
          <label htmlFor={id} className="min-w-0 cursor-pointer text-sm">
            <span className="font-medium">{field.label}</span>
            {field.help ? <span className="ad-help block">{field.help}</span> : null}
          </label>
        </div>
      );

    case "number":
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine} required={field.required}>
          <input
            id={id}
            type="number"
            className="ad-input max-w-48"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={value === null || value === undefined ? "" : String(value)}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value === "" ? (field.nullable ? null : (field.min ?? 0)) : Number(e.target.value))}
          />
        </FieldShell>
      );

    case "select":
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine}>
          <select id={id} className="ad-input" value={String(value ?? "")} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );

    case "date":
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine}>
          <div className="flex items-center gap-2">
            <input id={id} type="date" className="ad-input max-w-56" value={String(value ?? "")} aria-invalid={invalid} onChange={(e) => onChange(e.target.value || (field.nullable ? null : ""))} />
            {field.nullable && value ? (
              <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm" onClick={() => onChange(null)}>
                Clear
              </button>
            ) : null}
          </div>
        </FieldShell>
      );

    case "slug": {
      const locked = !!context.identifierLocked;
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine} required={field.required}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input id={id} className="ad-input font-mono text-[0.85rem]" dir="ltr" value={String(value ?? "")} readOnly={locked} aria-invalid={invalid} onChange={(e) => onChange(e.target.value.toLowerCase())} />
              {locked ? <Lock size={14} className="ad-muted absolute end-3 top-1/2 -translate-y-1/2" aria-label="Fixed" /> : null}
            </div>
            {!locked ? (
              <button type="button" className="ad-btn ad-btn-ghost" disabled={!context.slugSource} onClick={() => onChange(slugify(context.slugSource ?? ""))} title="Create from the English title">
                <Wand2 size={15} /> From title
              </button>
            ) : null}
          </div>
        </FieldShell>
      );
    }

    case "pattern":
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine} required={field.required}>
          <input id={id} className="ad-input" dir={field.dir} value={String(value ?? "")} placeholder={field.placeholder} maxLength={field.max} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
        </FieldShell>
      );

    case "reference": {
      const options = context.references?.[field.collection] ?? [];
      return (
        <FieldShell label={field.label} help={field.help} htmlFor={id} errors={mine}>
          <select id={id} className="ad-input" value={String(value ?? "")} aria-invalid={invalid} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">— None —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );
    }
  }
}

const hasRich = (doc: RichDoc | undefined) => !!doc?.content?.some((n) => JSON.stringify(n).includes('"text"') || n.type === "image" || n.type === "youtube");

function Counter({ value, max }: { value: string; max: number }) {
  const near = value.length > max * 0.9;
  return <span className={`text-[0.7rem] tabular-nums ${value.length > max ? "text-[var(--danger)]" : near ? "text-[var(--warn)]" : "ad-muted"}`}>{`${value.length}/${max}`}</span>;
}

function TextInput({ id, value, onChange, multiline, rows, dir, placeholder, invalid }: { id?: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; dir?: "ltr" | "rtl"; placeholder?: string; invalid?: boolean }) {
  return multiline ? (
    <textarea id={id} className="ad-input" rows={rows ?? 3} dir={dir} value={value} placeholder={placeholder} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input id={id} className="ad-input" dir={dir} value={value} placeholder={placeholder} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
  );
}

/** Arabic and English side by side, with a missing-translation hint and a copy shortcut. */
function LocalizedText({ field, value, onChange, errors, id }: { field: Extract<Field, { type: "text" }>; value: LValue; onChange: (v: LValue) => void; errors: FieldError[]; id: string }) {
  const v = value ?? { ar: "", en: "" };
  return (
    <FieldShell label={field.label} help={field.help} errors={errors} required={field.required} htmlFor={`${id}-ar`}>
      <div className="grid gap-2 md:grid-cols-2">
        {(["ar", "en"] as const).map((lang) => {
          const other = lang === "ar" ? "en" : "ar";
          const missing = !v[lang]?.trim() && !!v[other]?.trim();
          return (
            <div key={lang} className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="ad-lang-tag">{LANG_LABEL[lang]}</span>
                <span className="flex items-center gap-2">
                  {missing ? (
                    <button type="button" className="ad-badge ad-badge-warn cursor-pointer" title={`Copy the ${LANG_LABEL[other]} text as a starting point`} onClick={() => onChange({ ...v, [lang]: v[other] })}>
                      <Copy size={11} /> Missing — copy
                    </button>
                  ) : null}
                  {field.max ? <Counter value={v[lang] ?? ""} max={field.max} /> : null}
                </span>
              </div>
              <TextInput
                id={`${id}-${lang}`}
                value={v[lang] ?? ""}
                onChange={(text) => onChange({ ...v, [lang]: text })}
                multiline={field.multiline}
                rows={field.rows}
                dir={lang === "ar" ? "rtl" : "ltr"}
                placeholder={field.placeholder}
                invalid={errors.some((e) => e.path.endsWith(`.${lang}`) || !e.path.match(/\.(ar|en)$/))}
              />
            </div>
          );
        })}
      </div>
    </FieldShell>
  );
}

function LocalizedLines({ field, value, onChange, errors }: { field: Extract<Field, { type: "stringList" }>; value: LValue<string[]>; onChange: (v: LValue<string[]>) => void; errors: FieldError[] }) {
  const v = value ?? { ar: [], en: [] };
  return (
    <FieldShell label={field.label} help={field.help} errors={errors}>
      <div className="grid gap-3 md:grid-cols-2">
        {(["ar", "en"] as const).map((lang) => {
          const lines = v[lang] ?? [];
          const set = (next: string[]) => onChange({ ...v, [lang]: next });
          return (
            <div key={lang} className="min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="ad-lang-tag">{LANG_LABEL[lang]}</span>
                {lines.length !== (v[lang === "ar" ? "en" : "ar"] ?? []).length ? <span className="ad-badge ad-badge-warn">{`${lines.length} vs ${(v[lang === "ar" ? "en" : "ar"] ?? []).length} lines`}</span> : null}
              </div>
              {lines.map((line, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="ad-muted mt-2.5 w-5 shrink-0 text-end text-xs tabular-nums">{i + 1}</span>
                  <TextInput value={line} onChange={(text) => set(lines.map((l, j) => (j === i ? text : l)))} multiline={field.multiline} rows={field.multiline ? 3 : undefined} dir={lang === "ar" ? "rtl" : "ltr"} />
                  <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon mt-1" aria-label={`Remove ${field.itemLabel.toLowerCase()} ${i + 1}`} onClick={() => set(lines.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" disabled={!!field.maxItems && lines.length >= field.maxItems} onClick={() => set([...lines, ""])}>
                <Plus size={14} /> Add {field.itemLabel.toLowerCase()}
              </button>
            </div>
          );
        })}
      </div>
    </FieldShell>
  );
}

function HrefInput({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const listId = `${id}-paths`;
  return (
    <>
      <input id={id} className="ad-input" dir="ltr" list={listId} value={value} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} placeholder="/contact" />
      <datalist id={listId}>
        {SITE_PATHS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}

function CtaControl({ field, value, onChange, errors, path }: { field: Extract<Field, { type: "cta" }>; value: { label: LValue; href: string } | null; onChange: (v: unknown) => void; errors: FieldError[]; path: string }) {
  const id = useId();
  const enabled = value !== null && value !== undefined;
  return (
    <fieldset className="ad-field-group">
      <div className="flex items-center justify-between gap-3">
        <legend className="ad-label mb-0">{field.label}</legend>
        {field.optional ? (
          <span className="flex items-center gap-2 text-xs font-medium">
            {enabled ? "Shown" : "Hidden"}
            <Switch checked={enabled} label={`Show ${field.label.toLowerCase()}`} onChange={(on) => onChange(on ? { label: { ar: "", en: "" }, href: "/contact" } : null)} />
          </span>
        ) : null}
      </div>
      {enabled ? (
        <div className="mt-3 grid gap-4">
          <LocalizedText field={{ type: "text", key: "label", label: "Button text", max: 60 }} value={value.label} onChange={(label) => onChange({ ...value, label })} errors={own(errors, `${path}.label`)} id={id} />
          <FieldShell label="Destination" htmlFor={`${id}-href`} errors={own(errors, `${path}.href`)} help="A page (/contact), a section (#booking), a full https:// address, or tel: / mailto:.">
            <HrefInput id={`${id}-href`} value={value.href} onChange={(href) => onChange({ ...value, href })} invalid={own(errors, `${path}.href`).length > 0} />
          </FieldShell>
        </div>
      ) : (
        <p className="ad-muted mt-1 text-sm">This button is not shown on the website.</p>
      )}
      {exact(errors, path).map((e) => (
        <p key={e.message} className="ad-error-text">
          {e.message}
        </p>
      ))}
    </fieldset>
  );
}

/* ---- Repeatable items (cards, badges, points …) ------------------------------------- */

function itemTitle(fields: Field[], item: Doc): string {
  for (const f of fields) {
    const v = item[f.key];
    if (f.type === "text" && v) {
      const text = typeof v === "string" ? v : (v as LValue).en || (v as LValue).ar;
      if (text?.trim()) return text;
    }
  }
  return "";
}

function ListControl({ field, value, onChange, errors, path, context }: { field: Extract<Field, { type: "list" }>; value: Doc[]; onChange: (v: Doc[]) => void; errors: FieldError[]; path: string; context: FormContext }) {
  // Stable ids for drag-and-drop (positions change while sorting).
  const [ids, setIds] = useState<string[]>(() => value.map((_, i) => `item-${i}`));
  const dndId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const keys = useMemo(() => (ids.length === value.length ? ids : value.map((_, i) => ids[i] ?? `item-${i}`)), [ids, value]);
  if (ids.length !== value.length) setIds(keys);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    setIds(arrayMove(keys, from, to));
    onChange(arrayMove(value, from, to));
  };
  const add = () => {
    const key = crypto.randomUUID();
    setIds([...keys, key]);
    onChange([...value, Object.fromEntries(field.fields.map((f) => [f.key, emptyValue(f)]))]);
    setOpen(key);
  };
  const remove = (i: number) => {
    setIds(keys.filter((_, j) => j !== i));
    onChange(value.filter((_, j) => j !== i));
  };
  const full = field.max !== undefined && value.length >= field.max;

  return (
    <fieldset>
      <div className="mb-2 flex items-end justify-between gap-3">
        <legend className="ad-label mb-0">{field.label}</legend>
        <span className="ad-muted text-xs">
          {value.length}
          {field.max !== undefined ? ` of ${field.max}` : ""}
        </span>
      </div>
      {field.help ? <p className="ad-help -mt-1 mb-2">{field.help}</p> : null}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={keys} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {value.map((item, i) => (
              <SortableItem key={keys[i]} id={keys[i]}>
                {(handle) => (
                  <div className={`rounded-2xl border bg-white/60 ${own(errors, `${path}.${i}`).length ? "border-[var(--danger)]" : "border-[var(--line)]"}`}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <button type="button" className="ad-drag-handle ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Drag to reorder ${field.itemLabel.toLowerCase()} ${i + 1}`} {...handle}>
                        <GripVertical size={15} />
                      </button>
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 py-1 text-start text-sm" aria-expanded={open === keys[i]} onClick={() => setOpen(open === keys[i] ? null : keys[i])}>
                        <span className="ad-badge shrink-0">
                          {field.itemLabel} {i + 1}
                        </span>
                        <span className="truncate font-medium">{itemTitle(field.fields, item) || <span className="ad-muted">Empty</span>}</span>
                        <ChevronDown size={15} className={`ad-muted ms-auto shrink-0 transition ${open === keys[i] ? "rotate-180" : ""}`} />
                      </button>
                      <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Remove ${field.itemLabel.toLowerCase()} ${i + 1}`} disabled={field.min !== undefined && value.length <= field.min} onClick={() => remove(i)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {open === keys[i] ? (
                      <div className="border-t border-[var(--line)] p-3">
                        <DocForm fields={field.fields} value={item} onChange={(next) => onChange(value.map((it, j) => (j === i ? next : it)))} errors={errors} path={`${path}.${i}`} context={context} />
                      </div>
                    ) : null}
                  </div>
                )}
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm mt-2" onClick={add} disabled={full}>
        <Plus size={14} /> Add {field.itemLabel.toLowerCase()}
      </button>
      {full ? <span className="ad-muted ms-2 text-xs">Maximum reached — this layout fits {field.max}.</span> : null}
      {exact(errors, path).map((e) => (
        <p key={e.message} className="ad-error-text">
          {e.message}
        </p>
      ))}
    </fieldset>
  );
}

export function SortableItem({ id, children, as = "li" }: { id: string; children: (handle: Record<string, unknown>) => ReactNode; as?: "li" | "div" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: "relative" as const, opacity: isDragging ? 0.85 : 1 };
  const Tag = as;
  return (
    <Tag ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </Tag>
  );
}

