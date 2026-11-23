"use client";

import { CornerDownRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRow, reorderRows, saveNavItem, setRowVisible, type NavInput } from "@/lib/cms/admin/actions/settings";
import type { NavItemRow } from "@/lib/cms/admin/shapes";
import { validateDoc, type FieldError } from "@/lib/cms/fields";
import { navigationFields } from "@/lib/cms/registry";
import { DocForm } from "../form/doc-form";
import { useAdminPrefs } from "../shell/admin-shell";
import { Dialog } from "../ui/dialog";
import { useConfirm, useToast } from "../ui/feedback";
import { Spinner, Switch } from "../ui/primitives";
import { SortableRows } from "./sortable-rows";

type Draft = { id: string | null; doc: Record<string, unknown>; parentId: string | null; showInHeader: boolean; showInFooter: boolean; openInNewTab: boolean; visible: boolean };

export function NavigationManager({ items: initial }: { items: NavItemRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { lang } = useAdminPrefs();
  const [items, setItems] = useState(initial);
  const [source, setSource] = useState(initial);
  if (source !== initial) {
    setSource(initial);
    setItems(initial);
  }
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState(false);

  const top = items.filter((i) => !i.parent_id);
  const childrenOf = (id: string) => items.filter((i) => i.parent_id === id);
  const name = (i: NavItemRow) => (lang === "ar" ? i.label_ar || i.label_en : i.label_en || i.label_ar) || i.key;

  const open = (item?: NavItemRow, parentId: string | null = null) => {
    setErrors([]);
    setEditing(
      item
        ? { id: item.id, doc: { label: { ar: item.label_ar, en: item.label_en }, href: item.href }, parentId: item.parent_id, showInHeader: item.show_in_header, showInFooter: item.show_in_footer, openInNewTab: item.open_in_new_tab, visible: item.visible }
        : { id: null, doc: { label: { ar: "", en: "" }, href: "/" }, parentId, showInHeader: true, showInFooter: !parentId, openInNewTab: false, visible: true },
    );
  };

  const save = async () => {
    if (!editing) return;
    const found = validateDoc(navigationFields, editing.doc);
    setErrors(found);
    if (found.length) return;
    setBusy(true);
    const input: NavInput = {
      label: editing.doc.label as NavInput["label"],
      href: String(editing.doc.href ?? ""),
      parentId: editing.parentId,
      showInHeader: editing.showInHeader,
      showInFooter: editing.showInFooter,
      openInNewTab: editing.openInNewTab,
      visible: editing.visible,
    };
    const result = await saveNavItem(editing.id, input);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    toast.success("Menu item saved. The website is updated.");
    setEditing(null);
    router.refresh();
  };

  const remove = async (item: NavItemRow) => {
    const kids = childrenOf(item.id).length;
    if (!(await confirm({ title: `Delete “${name(item)}”?`, body: kids ? `Its ${kids} dropdown item${kids === 1 ? "" : "s"} will be deleted too. This cannot be undone.` : "The link disappears from the menu. This cannot be undone — switch it off to hide it temporarily.", confirmLabel: "Delete", tone: "danger" }))) return;
    const result = await deleteRow("navigation", item.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Deleted.");
    router.refresh();
  };

  const toggle = async (item: NavItemRow, visible: boolean) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, visible } : i)));
    const result = await setRowVisible("navigation", item.id, visible);
    if (!result.ok) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, visible: !visible } : i)));
      return toast.error(result.error);
    }
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  const reorder = async (level: NavItemRow[], parentId: string | null) => {
    const previous = items;
    const others = items.filter((i) => (i.parent_id ?? null) !== parentId);
    setItems([...level, ...others]);
    const result = await reorderRows("navigation", level.map((i) => i.id));
    if (!result.ok) {
      setItems(previous);
      return toast.error(result.error);
    }
    toast.success("New order saved.");
    router.refresh();
  };

  const renderItem = (item: NavItemRow, handle: React.ReactNode, child = false) => (
    <div className={`flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/70 px-2 py-2 ${item.visible ? "" : "opacity-60"}`}>
      {handle}
      {child ? <CornerDownRight size={15} className="ad-muted shrink-0" /> : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold">{name(item)}</span>
          {item.open_in_new_tab ? <ExternalLink size={13} className="ad-muted" aria-label="Opens in a new tab" /> : null}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <code className="ad-muted text-xs">{item.href}</code>
          {item.show_in_header ? <span className="ad-badge">Header</span> : null}
          {item.show_in_footer ? <span className="ad-badge">Footer</span> : null}
        </span>
      </span>
      {!child ? (
        <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm hidden md:inline-flex" onClick={() => open(undefined, item.id)}>
          <Plus size={14} /> Dropdown item
        </button>
      ) : null}
      <Switch checked={item.visible} label={`Show ${name(item)}`} onChange={(v) => toggle(item, v)} />
      <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Edit ${name(item)}`} onClick={() => open(item)}>
        <Pencil size={15} />
      </button>
      <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon text-[var(--danger)]" aria-label={`Delete ${name(item)}`} onClick={() => remove(item)}>
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <section className="ad-card ad-card-pad">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="ad-h2">Menu items</h2>
          <p className="ad-muted mt-1 text-sm">Drag to reorder. Items with dropdown entries open a submenu in the navigation bar.</p>
        </div>
        <button type="button" className="ad-btn ad-btn-primary ad-btn-sm" onClick={() => open()}>
          <Plus size={15} /> Add menu item
        </button>
      </header>
      <SortableRows
        items={top}
        onReorder={(next) => reorder(next, null)}
        render={(item, handle) => (
          <div className="space-y-2">
            {renderItem(item, handle)}
            {childrenOf(item.id).length ? (
              <div className="ms-8">
                <SortableRows items={childrenOf(item.id)} onReorder={(next) => reorder(next, item.id)} render={(child, childHandle) => renderItem(child, childHandle, true)} />
              </div>
            ) : null}
          </div>
        )}
      />

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        size="md"
        title={editing?.id ? "Edit menu item" : editing?.parentId ? "Add a dropdown item" : "Add a menu item"}
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
            <DocForm fields={navigationFields} value={editing.doc} onChange={(doc) => setEditing({ ...editing, doc })} errors={errors} />
            <label className="block">
              <span className="ad-label">Placed in</span>
              <select className="ad-input" value={editing.parentId ?? ""} onChange={(e) => setEditing({ ...editing, parentId: e.target.value || null })}>
                <option value="">The main menu</option>
                {top
                  .filter((t) => t.id !== editing.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Dropdown of “{name(t)}”
                    </option>
                  ))}
              </select>
            </label>
            {(
              [
                ["showInHeader", "Show in the navigation bar"],
                ["showInFooter", "Show in the footer links"],
                ["openInNewTab", "Open in a new tab (outside websites)"],
                ["visible", "Visible on the website"],
              ] as const
            ).map(([key, text]) => (
              <label key={key} className="flex items-center gap-3 text-sm">
                <Switch checked={editing[key]} label={text} onChange={(v) => setEditing({ ...editing, [key]: v })} />
                {text}
              </label>
            ))}
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
