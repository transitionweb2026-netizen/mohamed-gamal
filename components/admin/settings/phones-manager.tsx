"use client";

import { Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRow, reorderRows, savePhone, setRowVisible } from "@/lib/cms/admin/actions/settings";
import { validateDoc, type FieldError } from "@/lib/cms/fields";
import { phoneFields } from "@/lib/cms/registry";
import { DocForm } from "../form/doc-form";
import { Dialog } from "../ui/dialog";
import { useConfirm, useToast } from "../ui/feedback";
import { EmptyState, Spinner, Switch } from "../ui/primitives";
import { SortableRows } from "./sortable-rows";

interface PhoneRow {
  id: string;
  label_ar: string;
  label_en: string;
  display: string;
  digits: string;
  visible: boolean;
}

type Draft = { id: string | null; doc: Record<string, unknown>; visible: boolean };

export function PhonesManager({ phones: initial }: { phones: PhoneRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [phones, setPhones] = useState(initial);
  const [source, setSource] = useState(initial);
  if (source !== initial) {
    setSource(initial);
    setPhones(initial);
  }
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState(false);

  const open = (row?: PhoneRow) => {
    setErrors([]);
    setEditing(row ? { id: row.id, visible: row.visible, doc: { display: row.display, digits: row.digits, label: { ar: row.label_ar, en: row.label_en } } } : { id: null, visible: true, doc: { display: "", digits: "20", label: { ar: "", en: "" } } });
  };

  const save = async () => {
    if (!editing) return;
    const found = validateDoc(phoneFields, editing.doc);
    setErrors(found);
    if (found.length) return;
    setBusy(true);
    const result = await savePhone(editing.id, editing.doc, editing.visible);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    toast.success("Phone number saved. The website is updated.");
    setEditing(null);
    router.refresh();
  };

  const remove = async (row: PhoneRow) => {
    if (!(await confirm({ title: `Delete ${row.display}?`, body: "The number disappears from every page of the website. This cannot be undone — to hide it temporarily, switch it off instead.", confirmLabel: "Delete", tone: "danger" }))) return;
    const result = await deleteRow("phones", row.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Deleted.");
    router.refresh();
  };

  const toggle = async (row: PhoneRow, visible: boolean) => {
    setPhones((list) => list.map((p) => (p.id === row.id ? { ...p, visible } : p)));
    const result = await setRowVisible("phones", row.id, visible);
    if (!result.ok) {
      setPhones((list) => list.map((p) => (p.id === row.id ? { ...p, visible: !visible } : p)));
      return toast.error(result.error);
    }
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  const reorder = async (next: PhoneRow[]) => {
    const previous = phones;
    setPhones(next);
    const result = await reorderRows("phones", next.map((p) => p.id));
    if (!result.ok) {
      setPhones(previous);
      return toast.error(result.error);
    }
    toast.success("New order saved.");
    router.refresh();
  };

  return (
    <section className="ad-card ad-card-pad">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="ad-h2">Phone numbers</h2>
          <p className="ad-muted mt-1 text-sm">The first visible number is the main one (navigation bar and call buttons).</p>
        </div>
        <button type="button" className="ad-btn ad-btn-primary ad-btn-sm" onClick={() => open()}>
          <Plus size={15} /> Add
        </button>
      </header>
      {phones.length ? (
        <SortableRows
          items={phones}
          onReorder={reorder}
          render={(row, handle) => (
            <div className={`flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/60 px-2 py-2 ${row.visible ? "" : "opacity-60"}`}>
              {handle}
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-aqua-100 text-aqua-700">
                <Phone size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold tabular-nums" dir="ltr">
                  {row.display}
                </span>
                <span className="ad-muted block truncate text-xs">{[row.label_en, row.label_ar].filter(Boolean).join(" · ") || "No label"}</span>
              </span>
              <Switch checked={row.visible} label={`Show ${row.display} on the website`} onChange={(v) => toggle(row, v)} />
              <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Edit ${row.display}`} onClick={() => open(row)}>
                <Pencil size={15} />
              </button>
              <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon text-[var(--danger)]" aria-label={`Delete ${row.display}`} onClick={() => remove(row)}>
                <Trash2 size={15} />
              </button>
            </div>
          )}
        />
      ) : (
        <EmptyState icon={<Phone size={22} />} title="No phone numbers" text="Add the clinic's booking number so visitors can call." />
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        size="md"
        title={editing?.id ? "Edit phone number" : "Add a phone number"}
        footer={
          <>
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="ad-btn ad-btn-primary" disabled={busy} onClick={save}>
              {busy ? <Spinner /> : null} Save
            </button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <DocForm fields={phoneFields} value={editing.doc} onChange={(doc) => setEditing({ ...editing, doc })} errors={errors} />
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={editing.visible} label="Show on the website" onChange={(visible) => setEditing({ ...editing, visible })} />
              Show on the website
            </label>
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
