/* eslint-disable @next/next/no-img-element -- previews of library files */
"use client";

import { Copy, ExternalLink, FileText, Film, ImageIcon, Link2, Replace, Save, Search, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteMedia, discardUpload, getMediaUsages, replaceMediaFile, updateMediaDetails } from "@/lib/cms/admin/actions/media";
import type { MediaItem } from "@/lib/cms/admin/shapes";
import { BUCKET_RULES, FOLDERS, folderLabel, formatBytes, uploadProblem } from "@/lib/cms/media-rules";
import type { MediaFolder, MediaKind } from "@/lib/cms/types";
import { Dialog } from "../ui/dialog";
import { useConfirm, useToast } from "../ui/feedback";
import { EmptyState, Spinner, TimeAgo } from "../ui/primitives";
import { useMedia } from "./media-context";
import { MediaThumb, mediaName } from "./media-thumb";
import { acceptFor, uploadFile } from "./upload";
import { UploadProgress, useUploader } from "./use-uploader";

type Usage = { source: string; record_id: string; label: string; field: string };
const STEP = 48;

function usageHref(u: Usage): string {
  const routes: Record<string, string> = { services: "services", conditions: "conditions", videos: "videos", articles: "articles", testimonials: "testimonials" };
  if (routes[u.source]) return `/admin/${routes[u.source]}/${u.record_id}`;
  if (u.source === "pages") return `/admin/seo/${u.record_id}`;
  if (u.source === "sections") {
    const [page, key] = u.label.split(" › ");
    return `/admin/pages/${page}#section-${key}`;
  }
  return u.field === "doctor portrait" ? "/admin/doctor" : u.field === "sharing image" ? "/admin/seo" : "/admin/settings?tab=brand";
}

function Details({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { upsert, remove, mode } = useMedia();
  const [meta, setMeta] = useState({ title: item.title, altAr: item.alt_ar, altEn: item.alt_en, folder: item.folder });
  const [usages, setUsages] = useState<Usage[] | null>(null);
  const [busy, setBusy] = useState<null | "save" | "replace" | "delete">(null);
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dirty = meta.title !== item.title || meta.altAr !== item.alt_ar || meta.altEn !== item.alt_en || meta.folder !== item.folder;
  const absolute = typeof window !== "undefined" ? new URL(item.src, window.location.origin).href : item.src;

  useEffect(() => {
    let live = true;
    getMediaUsages(item.id).then((r) => live && setUsages(r.ok ? r.data : []));
    return () => {
      live = false;
    };
  }, [item.id]);

  const save = async () => {
    setBusy("save");
    const result = await updateMediaDetails(item.id, meta);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    upsert(result.data);
    toast.success("Details saved.");
    router.refresh();
  };

  const replace = async (file: File | undefined) => {
    if (!file) return;
    const problem = uploadProblem(file, item.kind);
    if (problem) return toast.error(problem);
    if (usages?.length && !(await confirm({ title: "Replace this file everywhere?", body: `The new file replaces it in all ${usages.length} place${usages.length === 1 ? "" : "s"} where it is used, immediately.`, confirmLabel: "Replace" }))) return;
    setBusy("replace");
    try {
      const uploaded = await uploadFile(file, meta.folder, mode, setProgress);
      const result = await replaceMediaFile(item.id, uploaded);
      if (!result.ok) {
        await discardUpload(uploaded.bucket, uploaded.path);
        throw new Error(result.error);
      }
      upsert(result.data);
      toast.success("File replaced everywhere it is used.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The file could not be replaced.");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const destroy = async () => {
    if (!(await confirm({ title: "Delete this file?", body: "It is removed from the media library and from storage. This cannot be undone.", confirmLabel: "Delete permanently", tone: "danger" }))) return;
    setBusy("delete");
    const result = await deleteMedia(item.id);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    remove(item.id);
    toast.success("File deleted.");
    onClose();
    router.refresh();
  };

  return (
    <Dialog open onClose={onClose} size="lg" title={mediaName(item)} description={`${item.kind === "image" ? "Image" : item.kind === "video" ? "Video" : "Document"} · ${folderLabel(item.folder)}`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden rounded-2xl bg-ink-900/5">
            {item.kind === "image" ? (
              <img src={item.src} alt={item.alt_en || item.alt_ar} className="max-h-[52vh] w-full object-contain" />
            ) : item.kind === "video" ? (
              <video src={item.src} controls preload="metadata" className="max-h-[52vh] w-full bg-black" />
            ) : (
              <a href={item.src} target="_blank" rel="noreferrer" className="grid h-48 place-items-center text-aqua-700">
                <span className="flex flex-col items-center gap-2">
                  <FileText size={36} /> Open the PDF
                </span>
              </a>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="ad-muted">Type</dt>
            <dd className="font-mono text-xs">{item.mime_type}</dd>
            {item.width ? (
              <>
                <dt className="ad-muted">Dimensions</dt>
                <dd className="tabular-nums">
                  {item.width} × {item.height} px
                </dd>
              </>
            ) : null}
            {item.duration_seconds ? (
              <>
                <dt className="ad-muted">Duration</dt>
                <dd className="tabular-nums">
                  {Math.floor(item.duration_seconds / 60)}:{String(Math.round(item.duration_seconds % 60)).padStart(2, "0")}
                </dd>
              </>
            ) : null}
            <dt className="ad-muted">Size</dt>
            <dd>{item.bucket ? formatBytes(item.size_bytes) : "Included with the website"}</dd>
            <dt className="ad-muted">Added</dt>
            <dd>
              <TimeAgo value={item.created_at} />
            </dd>
          </dl>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="ad-btn ad-btn-ghost ad-btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(absolute).then(() => toast.success("Address copied."));
              }}
            >
              <Copy size={14} /> Copy address
            </button>
            <a href={item.src} target="_blank" rel="noreferrer" className="ad-btn ad-btn-quiet ad-btn-sm">
              <ExternalLink size={14} /> Open
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="ad-label">Name (for the library)</span>
            <input className="ad-input" value={meta.title} maxLength={200} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </label>
          {item.kind !== "document" ? (
            <>
              <label className="block">
                <span className="ad-label">
                  Description for screen readers <span className="ad-lang-tag ms-1">العربية</span>
                </span>
                <textarea className="ad-input" rows={2} dir="rtl" maxLength={400} value={meta.altAr} onChange={(e) => setMeta({ ...meta, altAr: e.target.value })} />
              </label>
              <label className="block">
                <span className="ad-label">
                  Description for screen readers <span className="ad-lang-tag ms-1">English</span>
                </span>
                <textarea className="ad-input" rows={2} maxLength={400} value={meta.altEn} onChange={(e) => setMeta({ ...meta, altEn: e.target.value })} />
                <span className="ad-help block">Describe what the image shows, e.g. “Doctor guiding a patient through a knee exercise”.</span>
              </label>
            </>
          ) : null}
          <label className="block">
            <span className="ad-label">Folder</span>
            <select className="ad-input" value={meta.folder} onChange={(e) => setMeta({ ...meta, folder: e.target.value as MediaFolder })}>
              {FOLDERS.filter((f) => f.kind === item.kind).map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ad-btn ad-btn-primary" disabled={!dirty || !!busy} onClick={save}>
            {busy === "save" ? <Spinner /> : <Save size={16} />} Save details
          </button>

          <div className="ad-divider pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Link2 size={15} /> Used in
            </h3>
            {usages === null ? (
              <div className="ad-skeleton mt-2 h-10" />
            ) : usages.length ? (
              <ul className="mt-2 space-y-1">
                {usages.map((u, i) => (
                  <li key={`${u.source}-${u.record_id}-${u.field}-${i}`}>
                    <Link href={usageHref(u)} className="ad-menu-item !py-1.5 text-sm" onClick={onClose}>
                      <span className="min-w-0 flex-1 truncate">{u.label || u.source}</span>
                      <span className="ad-muted shrink-0 text-xs">{u.field}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-muted mt-1 text-sm">Not used on the website.</p>
            )}
          </div>

          <div className="ad-divider flex flex-wrap gap-2 pt-4">
            <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" disabled={!!busy} onClick={() => input.current?.click()}>
              {busy === "replace" ? <Spinner size={14} /> : <Replace size={14} />} {busy === "replace" ? `Uploading ${Math.round(progress * 100)}%` : "Replace file"}
            </button>
            <input ref={input} type="file" hidden accept={acceptFor(item.kind)} onChange={(e) => replace(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
            <button type="button" className="ad-btn ad-btn-danger-ghost ad-btn-sm ms-auto" disabled={!!busy || usages === null || !!usages.length} title={usages?.length ? "Remove it from the places above first" : undefined} onClick={destroy}>
              {busy === "delete" ? <Spinner size={14} /> : <Trash2 size={14} />} Delete
            </button>
          </div>
          {usages?.length ? <p className="ad-muted text-xs">A file that is in use cannot be deleted. Replace it, or remove it from those places first.</p> : null}
        </div>
      </div>
    </Dialog>
  );
}

export function MediaLibrary() {
  const params = useSearchParams();
  const { items } = useMedia();
  const { upload, tasks, busy } = useUploader();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediaKind | "all">(() => (["image", "video", "document"].includes(params.get("kind") ?? "") ? (params.get("kind") as MediaKind) : "all"));
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [sort, setSort] = useState<"new" | "old" | "name" | "size">("new");
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>("website");
  const [limit, setLimit] = useState(STEP);
  const [openId, setOpenId] = useState<string | null>(params.get("item"));
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = items.filter((m) => (kind === "all" || m.kind === kind) && (folder === "all" || m.folder === folder) && (!q || [m.title, m.alt_ar, m.alt_en, m.path].some((v) => v?.toLowerCase().includes(q))));
    const sorted = [...found];
    if (sort === "old") sorted.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    else if (sort === "name") sorted.sort((a, b) => mediaName(a).localeCompare(mediaName(b)));
    else if (sort === "size") sorted.sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0));
    else sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return sorted;
  }, [items, query, kind, folder, sort]);

  const opened = openId ? items.find((m) => m.id === openId) : undefined;
  const totals = { images: items.filter((m) => m.kind === "image").length, videos: items.filter((m) => m.kind === "video").length, documents: items.filter((m) => m.kind === "document").length };
  const bytes = items.reduce((sum, m) => sum + (m.bucket ? (m.size_bytes ?? 0) : 0), 0);
  const folderKind = FOLDERS.find((f) => f.value === uploadFolder)?.kind ?? "image";

  const onFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    const all = [...files];
    // Each file goes to the chosen folder, or to the default folder of its kind.
    for (const k of ["image", "video", "document"] as const) {
      const group = all.filter((f) => !uploadProblem(f, k));
      if (!group.length) continue;
      const target = k === folderKind ? uploadFolder : k === "video" ? "videos" : k === "document" ? "documents" : "website";
      await upload(group, target, k);
    }
    const rejected = all.filter((f) => (["image", "video", "document"] as const).every((k) => uploadProblem(f, k)));
    if (rejected.length) await upload(rejected, uploadFolder); // reports why each was refused
  };

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Images", value: totals.images, icon: ImageIcon },
          { label: "Videos", value: totals.videos, icon: Film },
          { label: "Documents", value: totals.documents, icon: FileText },
          { label: "Uploaded to storage", value: formatBytes(bytes), icon: UploadCloud },
        ].map((s) => (
          <div key={s.label} className="ad-card flex items-center gap-3 px-4 py-3">
            <span className="grid size-10 place-items-center rounded-xl bg-aqua-100 text-aqua-700">
              <s.icon size={18} />
            </span>
            <span>
              <span className="ad-muted block text-xs">{s.label}</span>
              <span className="font-display text-lg font-semibold">{s.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={`ad-card mb-5 border-2 border-dashed p-5 transition ${dragging || params.get("upload") ? "border-aqua-500 bg-aqua-50/80" : "border-ink-200"}`}>
        <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-start">
          <span className="grid size-12 place-items-center rounded-2xl bg-ink-900 text-aqua-400">
            <UploadCloud size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Drop files here, or choose them</p>
            <p className="ad-muted text-xs">
              {BUCKET_RULES.images.label}. {BUCKET_RULES.videos.label}. {BUCKET_RULES.documents.label}.
            </p>
          </div>
          <select className="ad-input w-auto" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} aria-label="Folder for new uploads">
            {FOLDERS.map((f) => (
              <option key={f.value} value={f.value}>
                Folder: {f.label}
              </option>
            ))}
          </select>
          <button type="button" className="ad-btn ad-btn-accent" disabled={busy} onClick={() => input.current?.click()}>
            <UploadCloud size={16} /> Choose files
          </button>
          <input ref={input} type="file" hidden multiple accept={acceptFor("any")} onChange={(e) => onFiles(e.target.files).finally(() => (e.target.value = ""))} />
        </div>
        {tasks.length ? (
          <div className="mt-4">
            <UploadProgress tasks={tasks} />
          </div>
        ) : null}
      </div>

      <div className="ad-card">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search files</span>
            <Search size={16} className="ad-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
            <input className="ad-input ps-9" placeholder="Search by name or description" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="ad-tabs" role="tablist" aria-label="Kind">
            {(["all", "image", "video", "document"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className="ad-tab"
                onClick={() => {
                  setKind(k);
                  setFolder("all");
                }}
              >
                {k === "all" ? "All" : k === "image" ? "Images" : k === "video" ? "Videos" : "Documents"}
              </button>
            ))}
          </div>
          <select className="ad-input w-auto" aria-label="Folder" value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder | "all")}>
            <option value="all">All folders</option>
            {FOLDERS.filter((f) => kind === "all" || f.kind === kind).map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select className="ad-input w-auto" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="name">Name</option>
            <option value="size">Largest first</option>
          </select>
        </div>
        {list.length ? (
          <>
            <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {list.slice(0, limit).map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setOpenId(item.id)} className="group block w-full overflow-hidden rounded-2xl border border-white bg-white/70 text-start transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lg">
                    <div className="relative">
                      <MediaThumb item={item} className="aspect-[4/3] w-full" />
                      {item.kind === "image" && !item.alt_en && !item.alt_ar ? <span className="ad-badge ad-badge-warn absolute start-2 top-2">No description</span> : null}
                    </div>
                    <span className="block truncate px-3 pt-2 text-sm font-medium">{mediaName(item)}</span>
                    <span className="ad-muted block truncate px-3 pb-2.5 text-xs">
                      {folderLabel(item.folder)}
                      {item.width ? ` · ${item.width}×${item.height}` : ""}
                      {item.bucket ? ` · ${formatBytes(item.size_bytes)}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {list.length > limit ? (
              <div className="flex justify-center pb-5">
                <button type="button" className="ad-btn ad-btn-ghost" onClick={() => setLimit(limit + STEP)}>
                  Show more ({list.length - limit} left)
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState icon={<ImageIcon size={24} />} title={items.length ? "No files match" : "The library is empty"} text={items.length ? "Change the search or filters." : "Upload images, videos or PDF documents to use them on the website."} />
        )}
      </div>
      {opened ? <Details key={opened.id + opened.updated_at} item={opened} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
