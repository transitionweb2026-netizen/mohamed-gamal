"use client";

import { RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/cms/admin/result-types";
import { validateDoc, type Field, type FieldError } from "@/lib/cms/fields";
import { useToast } from "../ui/feedback";
import { Spinner } from "../ui/primitives";
import { useUnsavedChanges } from "../ui/use-unsaved";
import { DocForm } from "./doc-form";

type Doc = Record<string, unknown>;

/** A card with fields and a Save button (settings, contact details, SEO …). Saving updates the website. */
export function FieldsForm({ fields, initial, action, title, description, footnote }: { fields: Field[]; initial: Doc; action: (doc: Doc) => Promise<ActionResult>; title?: string; description?: ReactNode; footnote?: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [doc, setDoc] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [source, setSource] = useState(initial);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(doc) !== JSON.stringify(saved);
  if (source !== initial) {
    setSource(initial);
    setSaved(initial);
    if (!dirty) setDoc(initial);
  }
  useUnsavedChanges(dirty && !busy);

  const save = async () => {
    const found = validateDoc(fields, doc);
    setErrors(found);
    if (found.length) return toast.error("Some fields need attention — they are highlighted.");
    setBusy(true);
    const result = await action(doc);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    setSaved(doc);
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  return (
    <section className="ad-card ad-card-pad">
      {title ? (
        <header className="mb-5">
          <h2 className="ad-h2">{title}</h2>
          {description ? <p className="ad-muted mt-1 text-sm">{description}</p> : null}
        </header>
      ) : null}
      <DocForm fields={fields} value={doc} onChange={setDoc} errors={errors} />
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <button type="button" className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={save}>
          {busy ? <Spinner /> : <Save size={16} />} Save
        </button>
        {dirty ? (
          <button
            type="button"
            className="ad-btn ad-btn-quiet"
            disabled={busy}
            onClick={() => {
              setDoc(saved);
              setErrors([]);
            }}
          >
            <RotateCcw size={15} /> Undo changes
          </button>
        ) : null}
        {dirty ? <span className="ad-badge ad-badge-warn">Unsaved changes</span> : null}
        {footnote ? <span className="ad-muted ms-auto text-xs">{footnote}</span> : null}
      </div>
    </section>
  );
}
