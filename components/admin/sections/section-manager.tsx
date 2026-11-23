"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowUpRight, ChevronDown, ExternalLink, Eye, EyeOff, GripVertical, RotateCcw, Send, Save, Trash2, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { discardSectionDraft, publishPage, publishSection, reorderSections, saveAndPublishSection, saveSectionDraft, setSectionVisible } from "@/lib/cms/admin/actions/sections";
import type { SectionEditorData } from "@/lib/cms/admin/shapes";
import { missingTranslations, validateDoc, type FieldError } from "@/lib/cms/fields";
import { sectionTypeDef } from "@/lib/cms/registry";
import { DocForm, SortableItem } from "../form/doc-form";
import { useAdminPrefs } from "../shell/admin-shell";
import { previewHref } from "../shell/preview";
import { useConfirm, useToast } from "../ui/feedback";
import { Spinner, Switch, TimeAgo } from "../ui/primitives";
import { useUnsavedChanges } from "../ui/use-unsaved";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SectionManager({ pageKey, pagePath, sections: initial, reorderable = true, single = false }: { pageKey: string; pagePath: string | null; sections: SectionEditorData[]; reorderable?: boolean; single?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { lang } = useAdminPrefs();
  const [order, setOrder] = useState(initial.map((s) => s.id));
  const [source, setSource] = useState(initial);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [publishing, startPublishing] = useTransition();
  const dndId = useId();
  if (source !== initial) {
    setSource(initial);
    setOrder(initial.map((s) => s.id));
  }
  const byId = useMemo(() => new Map(initial.map((s) => [s.id, s])), [initial]);
  const drafts = initial.filter((s) => s.draft).length;
  const anyDirty = Object.values(dirty).some(Boolean);
  useUnsavedChanges(anyDirty);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = order;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    setOrder(next);
    const result = await reorderSections(pageKey, next);
    if (result.ok) {
      toast.success("New order saved. The website is updated.");
      router.refresh();
    } else {
      setOrder(previous);
      toast.error(result.error);
    }
  };

  const publishAll = async () => {
    if (anyDirty && !(await confirm({ title: "Publish without your unsaved edits?", body: "Some sections have edits that are not saved as drafts yet. Only saved drafts are published. Save them first to include them.", confirmLabel: "Publish saved drafts" }))) return;
    startPublishing(async () => {
      const result = await publishPage(pageKey);
      if (result.ok) {
        toast.success(`${result.data} section${result.data === 1 ? "" : "s"} published. The website is updated.`);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <div>
      {!single ? (
        <div className="ad-card mb-5 flex flex-wrap items-center gap-3 px-4 py-3">
          <Layers size={18} className="text-aqua-700" />
          <p className="min-w-0 flex-1 text-sm">
            <strong>{initial.length} sections</strong> in the order they appear on the page.{" "}
            {drafts ? (
              <span className="text-[var(--warn)]">
                {drafts} with unpublished changes — visitors still see the published version.
              </span>
            ) : (
              <span className="ad-muted">Everything is published.</span>
            )}
          </p>
          {pagePath !== null ? (
            <a href={previewHref(lang, pagePath)} target="_blank" rel="noreferrer" className="ad-btn ad-btn-ghost ad-btn-sm">
              <ExternalLink size={14} /> Preview page
            </a>
          ) : null}
          <button type="button" className="ad-btn ad-btn-accent ad-btn-sm" disabled={!drafts || publishing} onClick={publishAll}>
            {publishing ? <Spinner size={14} /> : <Send size={14} />} Publish all drafts{drafts ? ` (${drafts})` : ""}
          </button>
        </div>
      ) : null}

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {order.map((id, index) => {
              const section = byId.get(id);
              if (!section) return null;
              return (
                <SortableItem key={id} id={id}>
                  {(handle) => (
                    <SectionCard
                      section={section}
                      index={index}
                      handle={reorderable && !single ? handle : null}
                      pagePath={pagePath}
                      defaultOpen={single}
                      onDirty={(value) => setDirty((d) => (d[id] === value ? d : { ...d, [id]: value }))}
                    />
                  )}
                </SortableItem>
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SectionCard({ section, index, handle, pagePath, defaultOpen, onDirty }: { section: SectionEditorData; index: number; handle: Record<string, unknown> | null; pagePath: string | null; defaultOpen: boolean; onDirty: (dirty: boolean) => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { lang } = useAdminPrefs();
  const fields = useMemo(() => sectionTypeDef(section.type)?.fields ?? [], [section.type]);
  const baseline = section.draft ?? section.published;
  const [doc, setDoc] = useState(baseline);
  const [source, setSource] = useState(baseline);
  const [open, setOpen] = useState(defaultOpen);
  const [visible, setVisible] = useState(section.visible);
  const [visibleSource, setVisibleSource] = useState(section.visible);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [busy, setBusy] = useState<null | "draft" | "publish" | "discard" | "visible">(null);
  const dirty = !same(doc, source);

  // Fresh server data: adopt it unless there are local edits.
  if (baseline !== source) {
    setSource(baseline);
    if (!dirty) setDoc(baseline);
  }
  if (section.visible !== visibleSource) {
    setVisibleSource(section.visible);
    setVisible(section.visible);
  }

  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  // Opened from search results or links (…#section-<key>).
  useEffect(() => {
    const check = () => {
      if (location.hash === `#section-${section.key}`) setOpen(true);
    };
    const frame = requestAnimationFrame(check);
    window.addEventListener("hashchange", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", check);
    };
  }, [section.key]);

  const missing = useMemo(() => (open ? missingTranslations(fields, doc) : []), [open, fields, doc]);

  const check = () => {
    const found = validateDoc(fields, doc);
    setErrors(found);
    if (found.length) toast.error("Some fields need attention — they are highlighted below.");
    return !found.length;
  };

  const saveDraft = async () => {
    if (!check()) return;
    setBusy("draft");
    const result = await saveSectionDraft(section.id, doc);
    setBusy(null);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    setSource(doc);
    toast.success(result.message ?? "Draft saved.");
    router.refresh();
  };

  const publish = async () => {
    if (!check()) return;
    setBusy("publish");
    const result = dirty ? await saveAndPublishSection(section.id, doc) : await publishSection(section.id);
    setBusy(null);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? []);
      return toast.error(result.error);
    }
    setSource(doc);
    toast.success(result.message ?? "Published.");
    router.refresh();
  };

  const discard = async () => {
    const ok = await confirm({ title: "Discard the draft?", body: "The unpublished changes of this section are deleted and the editor shows the published version again. This cannot be undone.", confirmLabel: "Discard draft", tone: "danger" });
    if (!ok) return;
    setBusy("discard");
    const result = await discardSectionDraft(section.id);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    setDoc(section.published);
    setSource(section.published);
    setErrors([]);
    toast.success("Draft discarded.");
    router.refresh();
  };

  const toggleVisible = async (next: boolean) => {
    if (!next) {
      const ok = await confirm({ title: `Hide “${section.label}”?`, body: "The section disappears from the website immediately. Its content is kept and you can show it again at any time.", confirmLabel: "Hide section" });
      if (!ok) return;
    }
    setVisible(next);
    setBusy("visible");
    const result = await setSectionVisible(section.id, next);
    setBusy(null);
    if (!result.ok) {
      setVisible(!next);
      return toast.error(result.error);
    }
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  return (
    <div id={`section-${section.key}`} className="ad-card ad-section-card scroll-mt-24" data-hidden={!visible}>
      <div className="ad-section-head flex items-center gap-2 px-3 py-2.5 md:px-4">
        {handle ? (
          <button type="button" className="ad-drag-handle ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Drag to move ${section.label}`} {...handle}>
            <GripVertical size={16} />
          </button>
        ) : null}
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-900/5 text-xs font-semibold tabular-nums text-ink-600">{index + 1}</span>
        <button type="button" className="flex min-w-0 flex-1 flex-col items-start text-start" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className="flex max-w-full items-center gap-2">
            <span className="truncate font-display text-[0.95rem] font-semibold">{section.label}</span>
            {section.label !== section.typeLabel ? <span className="ad-muted hidden truncate text-xs sm:inline">· {section.typeLabel}</span> : null}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {!visible ? (
              <span className="ad-badge">
                <EyeOff size={11} /> Hidden
              </span>
            ) : section.draft || dirty ? (
              <span className="ad-badge ad-badge-warn">
                <span className="ad-dot" />
                {dirty ? "Unsaved changes" : "Draft not published"}
              </span>
            ) : (
              <span className="ad-badge ad-badge-ok">
                <span className="ad-dot" />
                Published
              </span>
            )}
            <span className="ad-muted text-[0.72rem]">
              Updated <TimeAgo value={section.draftUpdatedAt ?? section.updatedAt} />
            </span>
          </span>
        </button>
        <span className="hidden items-center gap-2 text-xs font-medium sm:flex">
          {visible ? <Eye size={14} className="text-aqua-700" /> : <EyeOff size={14} className="ad-muted" />}
          <Switch checked={visible} disabled={busy === "visible"} label={`Show ${section.label} on the website`} onChange={toggleVisible} />
        </span>
        {pagePath !== null ? (
          <a href={previewHref(lang, pagePath)} target="_blank" rel="noreferrer" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Preview ${section.label}`} title="Preview (shows drafts)">
            <ExternalLink size={15} />
          </a>
        ) : null}
        <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={open ? "Collapse" : "Edit"} onClick={() => setOpen((o) => !o)}>
          <ChevronDown size={17} className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--line)] px-4 pt-4 pb-5 md:px-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <p className="ad-muted max-w-2xl text-sm">{section.description}</p>
            <span className="flex items-center gap-2 text-xs font-medium sm:hidden">
              Visible
              <Switch checked={visible} disabled={busy === "visible"} label={`Show ${section.label} on the website`} onChange={toggleVisible} />
            </span>
          </div>
          {section.data ? (
            <Link href={section.data.href} className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-aqua-500/30 bg-aqua-50 px-4 py-3 text-sm hover:border-aqua-600">
              <span>
                The items of this section are managed in <strong>{section.data.label}</strong>.
              </span>
              <ArrowUpRight size={16} className="shrink-0 text-aqua-700" />
            </Link>
          ) : null}

          {fields.length ? (
            <>
              {missing.length ? (
                <p className="mb-4 rounded-xl bg-[var(--warn-bg)] px-3 py-2 text-xs text-[var(--warn)]">
                  {missing.length} text{missing.length === 1 ? " is" : "s are"} filled in one language only. Visitors of the other language see the available text instead.
                </p>
              ) : null}
              <DocForm fields={fields} value={doc} onChange={setDoc} errors={errors} />
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
                <button type="button" className="ad-btn ad-btn-ghost" disabled={!dirty || !!busy} onClick={saveDraft}>
                  {busy === "draft" ? <Spinner /> : <Save size={16} />} Save draft
                </button>
                <button type="button" className="ad-btn ad-btn-primary" disabled={(!dirty && !section.draft) || !!busy} onClick={publish}>
                  {busy === "publish" ? <Spinner /> : <Send size={16} />} {dirty ? "Save & publish" : "Publish draft"}
                </button>
                {dirty ? (
                  <button
                    type="button"
                    className="ad-btn ad-btn-quiet"
                    disabled={!!busy}
                    onClick={() => {
                      setDoc(source);
                      setErrors([]);
                    }}
                  >
                    <RotateCcw size={15} /> Undo changes
                  </button>
                ) : null}
                {section.draft ? (
                  <button type="button" className="ad-btn ad-btn-danger-ghost ms-auto" disabled={!!busy} onClick={discard}>
                    {busy === "discard" ? <Spinner /> : <Trash2 size={15} />} Discard draft
                  </button>
                ) : null}
              </div>
              {section.publishedAt ? (
                <p className="ad-muted mt-3 text-xs">
                  Last published <TimeAgo value={section.publishedAt} />.
                </p>
              ) : null}
            </>
          ) : (
            <p className="ad-muted text-sm">This section has no texts of its own — it shows the items above. You can hide it or move it.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
