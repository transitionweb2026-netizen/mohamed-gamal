"use client";

import { RotateCcw, Save, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveUiStrings } from "@/lib/cms/admin/actions/settings";
import { UI_STRINGS } from "@/lib/cms/registry";
import { useToast } from "../ui/feedback";
import { Spinner } from "../ui/primitives";
import { useUnsavedChanges } from "../ui/use-unsaved";

type Values = Record<string, { ar: string; en: string }>;

/** Small texts of the website interface (buttons, labels, screen-reader texts), in both languages. */
export function UiStringsForm({ rows }: { rows: { key: string; value_ar: string; value_en: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const initial = useMemo<Values>(() => Object.fromEntries(UI_STRINGS.map((s) => {
    const row = rows.find((r) => r.key === s.key);
    return [s.key, { ar: row?.value_ar ?? "", en: row?.value_en ?? "" }];
  })), [rows]);
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty && !busy);

  const groups = [...new Set(UI_STRINGS.map((s) => s.group))];
  const q = query.trim().toLowerCase();
  const matches = (key: string, label: string) => !q || label.toLowerCase().includes(q) || values[key].ar.includes(q) || values[key].en.toLowerCase().includes(q);

  const save = async () => {
    setBusy(true);
    const changed = Object.fromEntries(Object.entries(values).filter(([key, v]) => JSON.stringify(v) !== JSON.stringify(saved[key])));
    const result = await saveUiStrings(changed);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    setSaved(values);
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  return (
    <section className="ad-card">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="ad-h2">Interface text</h2>
          <p className="ad-muted text-sm">Empty texts fall back to the other language.</p>
        </div>
        <label className="relative md:w-72">
          <span className="sr-only">Filter texts</span>
          <Search size={15} className="ad-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
          <input className="ad-input ps-9" placeholder="Filter" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="space-y-6 p-4 md:p-6">
        {groups.map((group) => {
          const items = UI_STRINGS.filter((s) => s.group === group && matches(s.key, s.label));
          if (!items.length) return null;
          return (
            <fieldset key={group}>
              <legend className="ad-eyebrow mb-3">{group}</legend>
              <div className="space-y-3">
                {items.map((s) => (
                  <div key={s.key} className="grid gap-2 md:grid-cols-[14rem_1fr_1fr] md:items-center">
                    <label htmlFor={`${s.key}-ar`} className="text-sm font-medium">
                      {s.label}
                    </label>
                    <input id={`${s.key}-ar`} className="ad-input" dir="rtl" aria-label={`${s.label} (Arabic)`} value={values[s.key].ar} onChange={(e) => setValues({ ...values, [s.key]: { ...values[s.key], ar: e.target.value } })} />
                    <input className="ad-input" dir="ltr" aria-label={`${s.label} (English)`} value={values[s.key].en} onChange={(e) => setValues({ ...values, [s.key]: { ...values[s.key], en: e.target.value } })} />
                  </div>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="ad-glass sticky bottom-0 flex flex-wrap items-center gap-2 rounded-b-[20px] border-x-0 border-b-0 px-4 py-3 md:px-6">
        <button type="button" className="ad-btn ad-btn-primary" disabled={!dirty || busy} onClick={save}>
          {busy ? <Spinner /> : <Save size={16} />} Save
        </button>
        {dirty ? (
          <button type="button" className="ad-btn ad-btn-quiet" onClick={() => setValues(saved)}>
            <RotateCcw size={15} /> Undo changes
          </button>
        ) : null}
      </div>
    </section>
  );
}
