"use client";

import { Check, ImagePlus, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { MediaItem } from "@/lib/cms/admin/shapes";
import { FOLDERS, folderLabel } from "@/lib/cms/media-rules";
import type { MediaFolder, MediaKind } from "@/lib/cms/types";
import { Dialog } from "../ui/dialog";
import { EmptyState } from "../ui/primitives";
import { useMedia } from "./media-context";
import { MediaThumb, mediaName } from "./media-thumb";
import { acceptFor } from "./upload";
import { UploadProgress, useUploader } from "./use-uploader";

const defaultFolder = (kind: MediaKind): MediaFolder => (kind === "video" ? "videos" : kind === "document" ? "documents" : "website");

/** Chooses a file from the media library (or uploads a new one). */
export function MediaPicker({ open, onClose, kind, selectedId, onSelect, title }: { open: boolean; onClose: () => void; kind: MediaKind; selectedId?: string | null; onSelect: (item: MediaItem) => void; title?: string }) {
  const { items } = useMedia();
  const { upload, tasks, busy } = useUploader();
  const [query, setQuery] = useState("");
  const folders = FOLDERS.filter((f) => f.kind === kind);
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>(defaultFolder(kind));
  const [picked, setPicked] = useState<string | null>(selectedId ?? null);
  const input = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => m.kind === kind && (folder === "all" || m.folder === folder) && (!q || [m.title, m.alt_ar, m.alt_en, m.path].some((v) => v?.toLowerCase().includes(q))));
  }, [items, kind, folder, query]);

  const choose = (id: string | null) => {
    const item = items.find((m) => m.id === id);
    if (item) {
      onSelect(item);
      onClose();
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const done = await upload([...files], uploadFolder, kind);
    if (done[0]) setPicked(done[0].id);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={title ?? (kind === "image" ? "Choose an image" : kind === "video" ? "Choose a video file" : "Choose a document")}
      description="Pick a file from the media library, or upload a new one."
      footer={
        <>
          <button type="button" className="ad-btn ad-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ad-btn ad-btn-primary" disabled={!picked} onClick={() => choose(picked)}>
            <Check size={16} /> Use this file
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search files</span>
          <Search size={16} className="ad-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
          <input className="ad-input ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or description" />
        </label>
        <div className="flex items-center gap-2">
          <select className="ad-input w-auto" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as MediaFolder)} aria-label="Folder for new uploads">
            {folders.map((f) => (
              <option key={f.value} value={f.value}>
                Upload to: {f.label}
              </option>
            ))}
          </select>
          <button type="button" className="ad-btn ad-btn-accent" onClick={() => input.current?.click()} disabled={busy}>
            <Upload size={16} /> Upload
          </button>
          <input ref={input} type="file" hidden multiple accept={acceptFor(kind)} onChange={(e) => onFiles(e.target.files).finally(() => (e.target.value = ""))} />
        </div>
      </div>

      {folders.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[{ value: "all" as const, label: "All" }, ...folders].map((f) => (
            <button key={f.value} type="button" onClick={() => setFolder(f.value)} className={`ad-badge cursor-pointer ${folder === f.value ? "ad-badge-aqua" : ""}`}>
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <UploadProgress tasks={tasks} />
      </div>

      {visible.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="listbox" aria-label="Files">
          {visible.map((item) => {
            const active = picked === item.id;
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => setPicked(item.id)}
                  onDoubleClick={() => choose(item.id)}
                  className={`group relative block w-full overflow-hidden rounded-2xl border bg-white/70 text-start transition ${active ? "border-aqua-600 ring-4 ring-aqua-500/30" : "border-white hover:border-ink-300"}`}
                >
                  <MediaThumb item={item} className="aspect-[4/3] w-full" />
                  <span className="block truncate px-2.5 py-2 text-xs font-medium">{mediaName(item)}</span>
                  <span className="ad-muted block truncate px-2.5 pb-2 text-[0.7rem]">
                    {folderLabel(item.folder)}
                    {item.width ? ` · ${item.width}×${item.height}` : ""}
                  </span>
                  {active ? (
                    <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-aqua-500 text-ink-900 shadow">
                      <Check size={14} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<ImagePlus size={24} />} title={query ? "No matching files" : "No files yet"} text={query ? "Try another search, or upload a new file." : "Upload a file to use it here."} />
      )}
    </Dialog>
  );
}
