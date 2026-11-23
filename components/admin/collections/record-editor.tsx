"use client";

import { ArrowLeft, Copy, ExternalLink, Languages, Save, Send, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteRecords, duplicateRecord, saveRecord } from "@/lib/cms/admin/actions/records";
import { missingTranslations, validateDoc, type FieldError } from "@/lib/cms/fields";
import type { CollectionDef } from "@/lib/cms/registry";
import { DocForm, type FormContext } from "../form/doc-form";
import { useAdminPrefs } from "../shell/admin-shell";
import { previewHref } from "../shell/preview";
import { useConfirm, useToast } from "../ui/feedback";
import { Spinner, StatusBadge, TimeAgo } from "../ui/primitives";
import { useUnsavedChanges } from "../ui/use-unsaved";

type Doc = Record<string, unknown>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const en = (v: unknown) => (v && typeof v === "object" && "en" in v ? String((v as { en: string }).en ?? "") : "");
const ar = (v: unknown) => (v && typeof v === "object" && "ar" in v ? String((v as { ar: string }).ar ?? "") : "");

/** Where an item appears on the website (for previews). */
function previewPath(def: CollectionDef, doc: Doc): string {
  switch (def.key) {
    case "articles":
      return `/articles/${doc.slug}`;
    case "videos":
      return "/videos";
    case "stats":
    case "testimonials":
      return "/";
    case "faqs":
      return doc.group === "services" ? "/services" : "/";
    case "credentials":
      return "/about";
    case "articleCategories":
      return "/articles";
    default:
      return "/services";
  }
}

export function RecordEditor({ def, id, initial, status: initialStatus, updatedAt, references }: { def: CollectionDef; id: string | null; initial: Doc; status: "draft" | "published" | null; updatedAt: string | null; references: FormContext["references"] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { lang } = useAdminPrefs();
  const [doc, setDoc] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState<null | "save" | "publish" | "draft" | "delete">(null);
  const [tab, setTab] = useState(0);
  const dirty = !same(doc, saved);
  useUnsavedChanges(dirty && busy === null);

  const titleValue = doc.title ?? doc.name ?? doc.region ?? doc.label ?? doc.question;
  const heading = (lang === "ar" ? ar(titleValue) || en(titleValue) : en(titleValue) || ar(titleValue)) || (id ? `Untitled ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`);
  const missing = useMemo(() => missingTranslations(def.fields, doc), [def.fields, doc]);
  const tabs = def.tabs ?? [{ label: "Content", keys: def.fields.map((f) => f.key) }];
  const tabFields = def.fields.filter((f) => tabs[tab]?.keys.includes(f.key));
  const errorTabs = new Set(errors.map((e) => tabs.findIndex((t) => t.keys.includes(e.path.split(".")[0]))));

  const submit = async (nextStatus: "draft" | "published" | undefined, kind: "save" | "publish" | "draft") => {
    const found = validateDoc(def.fields, doc);
    setErrors(found);
    if (found.length) {
      const first = tabs.findIndex((t) => t.keys.includes(found[0].path.split(".")[0]));
      if (first >= 0) setTab(first);
      return toast.error("Some fields need attention — they are highlighted.");
    }
    setBusy(kind);
    const result = await saveRecord(def.key, id, doc, nextStatus);
    setBusy(null);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    setSaved(doc);
    if (nextStatus) setStatus(nextStatus);
    toast.success(nextStatus === "published" ? "Published. The website is updated." : nextStatus === "draft" && status === "published" ? "Moved to drafts — no longer visible on the website." : id ? (status === "published" ? "Saved. The website is updated." : "Draft saved.") : "Created.");
    if (!id) router.replace(`/admin/${def.route}/${result.data.id}`);
    else router.refresh();
  };

  const remove = async () => {
    if (!id) return;
    const ok = await confirm({ title: `Delete this ${def.singular.toLowerCase()}?`, body: "It is removed from the website and cannot be restored. To hide it but keep it, move it to drafts instead.", confirmLabel: "Delete permanently", tone: "danger" });
    if (!ok) return;
    setBusy("delete");
    const result = await deleteRecords(def.key, [id]);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success("Deleted.");
    setSaved(doc);
    router.push(`/admin/${def.route}`);
  };

  const duplicate = async () => {
    if (!id) return;
    if (dirty && !(await confirm({ title: "Duplicate without your unsaved edits?", body: "The copy is made from the last saved version.", confirmLabel: "Duplicate" }))) return;
    const result = await duplicateRecord(def.key, id);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Copied.");
    router.push(`/admin/${def.route}/${result.data.id}`);
  };

  const context: FormContext = { references, identifierLocked: !!id, slugSource: en(titleValue) };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <Link href={`/admin/${def.route}`} className="ad-muted mb-2 inline-flex items-center gap-1.5 text-sm hover:text-ink-900">
            <ArrowLeft size={15} /> {def.label}
          </Link>
          <h1 className="ad-h1 truncate" dir={lang === "ar" && ar(titleValue) ? "rtl" : undefined}>
            {heading}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {def.hasStatus ? <StatusBadge status={id ? status : "draft"} /> : null}
            {dirty ? <span className="ad-badge ad-badge-warn">Unsaved changes</span> : null}
            {updatedAt && id ? (
              <span className="ad-muted text-xs">
                Last saved <TimeAgo value={updatedAt} />
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {id && def.hasStatus ? (
            <a href={previewHref(lang, previewPath(def, saved))} target="_blank" rel="noreferrer" className="ad-btn ad-btn-ghost" title="Preview (shows drafts)">
              <ExternalLink size={16} /> Preview
            </a>
          ) : null}
          {!def.hasStatus ? (
            <button type="button" className="ad-btn ad-btn-primary" disabled={(!dirty && !!id) || !!busy} onClick={() => submit(undefined, "save")}>
              {busy === "save" ? <Spinner /> : <Save size={16} />} Save
            </button>
          ) : status === "published" && id ? (
            <>
              <button type="button" className="ad-btn ad-btn-ghost" disabled={!!busy} onClick={() => submit("draft", "draft")}>
                {busy === "draft" ? <Spinner /> : <Undo2 size={16} />} Unpublish
              </button>
              <button type="button" className="ad-btn ad-btn-primary" disabled={!dirty || !!busy} onClick={() => submit(undefined, "save")}>
                {busy === "save" ? <Spinner /> : <Save size={16} />} Save changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ad-btn ad-btn-ghost" disabled={(!dirty && !!id) || !!busy} onClick={() => submit("draft", "save")}>
                {busy === "save" ? <Spinner /> : <Save size={16} />} Save draft
              </button>
              <button type="button" className="ad-btn ad-btn-primary" disabled={!!busy} onClick={() => submit("published", "publish")}>
                {busy === "publish" ? <Spinner /> : <Send size={16} />} Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="ad-card ad-card-pad min-w-0">
          {tabs.length > 1 ? (
            <div className="ad-tabs mb-5" role="tablist">
              {tabs.map((t, i) => (
                <button key={t.label} type="button" role="tab" aria-selected={tab === i} className="ad-tab" onClick={() => setTab(i)}>
                  {t.label}
                  {errorTabs.has(i) ? <span className="ms-1.5 inline-block size-1.5 rounded-full bg-[var(--danger)] align-middle" aria-label="has errors" /> : null}
                </button>
              ))}
            </div>
          ) : null}
          <DocForm
            fields={tabFields}
            value={doc}
            onChange={(partial) => setDoc((current) => ({ ...current, ...partial }))}
            errors={errors}
            context={context}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="ad-card ad-card-pad text-sm">
            <h2 className="ad-h2 mb-3 !text-base">About this {def.singular.toLowerCase()}</h2>
            <p className="ad-muted">{def.description}</p>
            {def.hasStatus ? <p className="ad-muted mt-3">{status === "published" && id ? "Saving updates the website immediately." : "Drafts are not visible to visitors. Use Preview to see them on the website."}</p> : null}
          </div>
          <div className="ad-card ad-card-pad text-sm">
            <h2 className="ad-h2 mb-2 flex items-center gap-2 !text-base">
              <Languages size={16} className="text-aqua-700" /> Translations
            </h2>
            {missing.length ? (
              <ul className="space-y-1.5">
                {missing.slice(0, 8).map((m) => (
                  <li key={m.path + m.missing} className="flex items-start gap-2">
                    <span className="ad-badge ad-badge-warn shrink-0">{m.missing === "ar" ? "AR" : "EN"}</span>
                    <span className="ad-muted">{m.label}</span>
                  </li>
                ))}
                {missing.length > 8 ? <li className="ad-muted">and {missing.length - 8} more</li> : null}
              </ul>
            ) : (
              <p className="ad-muted">Arabic and English are complete. Empty texts fall back to the other language on the website.</p>
            )}
          </div>
          {id ? (
            <div className="ad-card ad-card-pad flex flex-col gap-2 text-sm">
              <button type="button" className="ad-btn ad-btn-ghost w-full" onClick={duplicate}>
                <Copy size={15} /> Duplicate as a draft
              </button>
              <button type="button" className="ad-btn ad-btn-danger-ghost w-full" disabled={!!busy} onClick={remove}>
                {busy === "delete" ? <Spinner /> : <Trash2 size={15} />} Delete
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
