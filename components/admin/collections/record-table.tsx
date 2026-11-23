/* eslint-disable @next/next/no-img-element -- small dashboard thumbnails */
"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Copy, FilePlus2, GripVertical, ImageOff, Pencil, Search, Send, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type ReactNode } from "react";
import { deleteRecords, duplicateRecord, reorderRecords, setRecordStatus } from "@/lib/cms/admin/actions/records";
import type { RecordListRow } from "@/lib/cms/admin/shapes";
import type { CollectionDef } from "@/lib/cms/registry";
import { useAdminPrefs } from "../shell/admin-shell";
import { useConfirm, useToast } from "../ui/feedback";
import { EmptyState, StatusBadge, TimeAgo } from "../ui/primitives";

const PAGE_SIZE = 20;
type Sort = "manual" | "title" | "updated";

function Cell({ value, column, def }: { value: unknown; column: string; def: CollectionDef }) {
  if (typeof value === "boolean") return value ? <span className="ad-badge ad-badge-aqua">Yes</span> : <span className="ad-muted">—</span>;
  if (value === null || value === undefined || value === "") return <span className="ad-muted">—</span>;
  const option = def.filter?.column === column ? def.filter.options.find((o) => o.value === value) : null;
  if (option) return <span className="ad-badge">{option.label}</span>;
  if (column === "published_on") return <span className="tabular-nums">{new Date(String(value)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>;
  if (column === "source") return <span className="ad-badge">{({ youtube: "YouTube", url: "Video address", file: "Uploaded file" } as Record<string, string>)[String(value)] ?? String(value)}</span>;
  return <span className="font-medium">{String(value)}</span>;
}

function Row({ id, sortable, children }: { id: string; sortable: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !sortable });
  const handle = sortable ? (
    <button type="button" className="ad-drag-handle ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label="Drag to reorder" {...attributes} {...listeners}>
      <GripVertical size={15} />
    </button>
  ) : null;
  return (
    <tr ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, position: "relative", zIndex: isDragging ? 5 : undefined, background: isDragging ? "rgb(255 255 255 / .95)" : undefined }}>
      {children(handle)}
    </tr>
  );
}

export function RecordTable({ def, rows: initial, preset }: { def: CollectionDef; rows: RecordListRow[]; preset?: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { lang } = useAdminPrefs();
  const dndId = useId();
  const [rows, setRows] = useState(initial);
  const [source, setSource] = useState(initial);
  if (source !== initial) {
    setSource(initial);
    setRows(initial);
  }
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [filter, setFilter] = useState<string>(preset && def.filter?.options.some((o) => o.value === preset) ? preset : "all");
  const [sort, setSort] = useState<Sort>("manual");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const title = (r: RecordListRow) => (lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr) || "Untitled";
  const subtitle = (r: RecordListRow) => (lang === "ar" ? r.titleEn : r.titleAr);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (filter === "all" || !def.filter || r.values[def.filter.column] === filter) &&
        (!q || [r.titleAr, r.titleEn, r.identifier].some((v) => v?.toLowerCase().includes(q))),
    );
    if (sort === "title") return [...list].sort((a, b) => title(a).localeCompare(title(b)));
    if (sort === "updated") return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- title depends on lang only
  }, [rows, query, status, filter, sort, def.filter, lang]);

  const manual = sort === "manual" && !query.trim() && status === "all" && filter === "all";
  const pages = manual ? 1 : Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = manual ? filtered : filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = rows;
    const next = arrayMove(rows, rows.findIndex((r) => r.id === active.id), rows.findIndex((r) => r.id === over.id));
    setRows(next);
    const result = await reorderRecords(def.key, next.map((r) => r.id));
    if (result.ok) {
      toast.success("New order saved. The website is updated.");
      router.refresh();
    } else {
      setRows(previous);
      toast.error(result.error);
    }
  };

  const bulk = async (action: "publish" | "draft" | "delete", ids: string[]) => {
    if (!ids.length) return;
    if (action === "delete") {
      const ok = await confirm({
        title: ids.length === 1 ? `Delete this ${def.singular.toLowerCase()}?` : `Delete ${ids.length} items?`,
        body: "Deleted items are removed from the website and cannot be restored. To hide an item but keep it, move it to drafts instead.",
        confirmLabel: "Delete permanently",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusy(true);
    const result = action === "delete" ? await deleteRecords(def.key, ids) : await setRecordStatus(def.key, ids, action === "publish" ? "published" : "draft");
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Done.");
    setSelected(new Set());
    router.refresh();
  };

  const duplicate = async (id: string) => {
    const result = await duplicateRecord(def.key, id);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Copied.");
    router.push(`/admin/${def.route}/${result.data.id}`);
  };

  const counts = { all: rows.length, published: rows.filter((r) => r.status === "published").length, draft: rows.filter((r) => r.status === "draft").length };
  const newHref = `/admin/${def.route}/new${filter !== "all" && def.filter ? `?${def.filter.column === "group_key" ? "group" : def.filter.column}=${filter}` : ""}`;

  return (
    <div className="ad-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search {def.label.toLowerCase()}</span>
          <Search size={16} className="ad-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            className="ad-input ps-9"
            placeholder={`Search ${def.label.toLowerCase()} in Arabic or English`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {def.hasStatus ? (
            <div className="ad-tabs" role="tablist" aria-label="Status">
              {(["all", "published", "draft"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={status === s}
                  className="ad-tab"
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                >
                  {s === "all" ? "All" : s === "published" ? "Published" : "Drafts"} <span className="ad-muted ms-1 text-xs">{counts[s]}</span>
                </button>
              ))}
            </div>
          ) : null}
          {def.filter ? (
            <select
              className="ad-input w-auto"
              aria-label={def.filter.label}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All — {def.filter.label.toLowerCase()}</option>
              {def.filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}
          <select className="ad-input w-auto" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="manual">Website order</option>
            <option value="title">Title A–Z</option>
            <option value="updated">Recently edited</option>
          </select>
          <Link href={newHref} className="ad-btn ad-btn-primary">
            <FilePlus2 size={16} /> New {def.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      {selected.size ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] bg-aqua-50 px-4 py-2 text-sm">
          <strong>{selected.size} selected</strong>
          {def.hasStatus ? (
            <>
              <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy} onClick={() => bulk("publish", [...selected])}>
                <Send size={14} /> Publish
              </button>
              <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy} onClick={() => bulk("draft", [...selected])}>
                <Undo2 size={14} /> Move to drafts
              </button>
            </>
          ) : null}
          <button type="button" className="ad-btn ad-btn-danger-ghost ad-btn-sm" disabled={busy} onClick={() => bulk("delete", [...selected])}>
            <Trash2 size={14} /> Delete
          </button>
          <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ms-auto" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      ) : null}

      {visible.length ? (
        <div className="overflow-x-auto">
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allSelected}
                      onChange={(e) => setSelected(e.target.checked ? new Set([...selected, ...visible.map((r) => r.id)]) : new Set([...selected].filter((id) => !visible.some((r) => r.id === id))))}
                      className="size-4 accent-[var(--color-ink-900)]"
                    />
                  </th>
                  {manual ? <th className="w-10" aria-label="Order" /> : null}
                  <th>{def.singular}</th>
                  {(def.listColumns ?? []).map((c) => (
                    <th key={c.column}>{c.label}</th>
                  ))}
                  {def.hasStatus ? <th>Status</th> : null}
                  <th>Edited</th>
                  <th className="text-end">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <SortableContext items={visible.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {visible.map((r) => (
                    <Row key={r.id} id={r.id} sortable={manual}>
                      {(handle) => (
                        <>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${title(r)}`}
                              checked={selected.has(r.id)}
                              onChange={(e) => {
                                const next = new Set(selected);
                                if (e.target.checked) next.add(r.id);
                                else next.delete(r.id);
                                setSelected(next);
                              }}
                              className="size-4 accent-[var(--color-ink-900)]"
                            />
                          </td>
                          {manual ? <td className="!px-1">{handle}</td> : null}
                          <td className="min-w-64">
                            <Link href={`/admin/${def.route}/${r.id}`} className="group flex items-center gap-3">
                              {def.imageColumn ? (
                                r.image ? (
                                  <img src={r.image} alt="" className="size-11 shrink-0 rounded-xl object-cover" loading="lazy" />
                                ) : (
                                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-900/5 text-ink-400">
                                    <ImageOff size={16} />
                                  </span>
                                )
                              ) : null}
                              <span className="min-w-0">
                                <span className="block truncate font-semibold group-hover:text-aqua-700" dir={lang === "ar" && r.titleAr ? "rtl" : undefined}>
                                  {title(r)}
                                </span>
                                <span className="ad-muted block truncate text-xs" dir={lang === "ar" ? undefined : "rtl"}>
                                  {subtitle(r) || (r.identifier ? <code dir="ltr">{r.identifier}</code> : null)}
                                </span>
                                {def.key === "videos" && r.values.source === "youtube" && !r.values.youtube_id ? <span className="ad-badge ad-badge-warn mt-1">No YouTube ID — shows “coming soon”</span> : null}
                              </span>
                            </Link>
                          </td>
                          {(def.listColumns ?? []).map((c) => (
                            <td key={c.column}>
                              <Cell value={r.values[c.column]} column={c.column} def={def} />
                            </td>
                          ))}
                          {def.hasStatus ? (
                            <td>
                              <StatusBadge status={r.status} />
                            </td>
                          ) : null}
                          <td className="ad-muted whitespace-nowrap text-xs">
                            <TimeAgo value={r.updatedAt} />
                          </td>
                          <td>
                            <div className="flex justify-end gap-0.5">
                              <Link href={`/admin/${def.route}/${r.id}`} className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Edit ${title(r)}`}>
                                <Pencil size={15} />
                              </Link>
                              {def.hasStatus ? (
                                <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" disabled={busy} aria-label={r.status === "published" ? "Move to drafts" : "Publish"} title={r.status === "published" ? "Move to drafts" : "Publish"} onClick={() => bulk(r.status === "published" ? "draft" : "publish", [r.id])}>
                                  {r.status === "published" ? <Undo2 size={15} /> : <Send size={15} />}
                                </button>
                              ) : null}
                              <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Duplicate ${title(r)}`} title="Duplicate" onClick={() => duplicate(r.id)}>
                                <Copy size={15} />
                              </button>
                              <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon text-[var(--danger)]" disabled={busy} aria-label={`Delete ${title(r)}`} title="Delete" onClick={() => bulk("delete", [r.id])}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </Row>
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      ) : (
        <EmptyState
          icon={<FilePlus2 size={24} />}
          title={rows.length ? "Nothing matches these filters" : `No ${def.label.toLowerCase()} yet`}
          text={rows.length ? "Change the search or filters to see more." : def.description}
          action={
            !rows.length ? (
              <Link href={newHref} className="ad-btn ad-btn-primary">
                <FilePlus2 size={16} /> Create the first one
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3 text-sm">
        <p className="ad-muted">
          {manual ? (
            <>Drag the handles to change the order on the website.</>
          ) : (
            <>
              Showing {visible.length ? (current - 1) * PAGE_SIZE + 1 : 0}–{(current - 1) * PAGE_SIZE + visible.length} of {filtered.length}. Reordering is available in “Website order” without filters.
            </>
          )}
        </p>
        {pages > 1 ? (
          <div className="flex items-center gap-1">
            <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm ad-btn-icon" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 tabular-nums">
              {current} / {pages}
            </span>
            <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm ad-btn-icon" disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="Next page">
              <ChevronRight size={15} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
