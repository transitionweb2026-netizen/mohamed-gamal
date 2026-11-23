"use client";

import { Crosshair, ImagePlus, Replace, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { formatBytes } from "@/lib/cms/media-rules";
import type { MediaKind } from "@/lib/cms/types";
import { useMedia } from "../media/media-context";
import { MediaPicker } from "../media/media-picker";
import { MediaThumb, mediaName } from "../media/media-thumb";

/** A media library item (id), with an optional focal point for images used as section backgrounds. */
export function MediaField({
  value,
  onChange,
  kind,
  position,
  onPositionChange,
  invalid,
  id,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  kind: MediaKind;
  position?: string;
  onPositionChange?: (position: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const { byId } = useMedia();
  const [picking, setPicking] = useState(false);
  const item = byId(value);
  const missing = value && !item;

  const setFocus = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onPositionChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    onPositionChange(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
  };
  const [fx, fy] = (position?.match(/^(\d{1,3})% (\d{1,3})%$/)?.slice(1).map(Number) ?? [50, 50]) as [number, number];

  return (
    <div className={`rounded-2xl border bg-white/60 p-3 ${invalid ? "border-[var(--danger)]" : "border-[var(--line-strong)]"}`}>
      {item ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {onPositionChange && item.kind === "image" ? (
            <button type="button" onClick={setFocus} className="group relative aspect-[4/3] w-full shrink-0 cursor-crosshair overflow-hidden rounded-xl sm:w-56" aria-label="Click the image to set its focal point">
              <MediaThumb item={item} className="size-full" fit="contain" />
              <span className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-aqua-500/50 shadow-[0_0_0_2px_rgba(0,41,51,.6)]" style={{ left: `${fx}%`, top: `${fy}%` }} />
            </button>
          ) : (
            <MediaThumb item={item} className="aspect-[4/3] w-full shrink-0 rounded-xl sm:w-40" />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{mediaName(item)}</p>
            <p className="ad-muted text-xs">
              {item.width ? `${item.width} × ${item.height} px · ` : ""}
              {item.bucket ? formatBytes(item.size_bytes) : "Included with the website"}
            </p>
            {item.kind === "image" && !item.alt_en && !item.alt_ar ? <p className="mt-1 text-xs text-[var(--warn)]">No description for screen readers yet — add one in the media library.</p> : null}
            {onPositionChange && item.kind === "image" ? (
              <label className="mt-3 block">
                <span className="ad-label flex items-center gap-1.5">
                  <Crosshair size={14} /> Focal point
                </span>
                <input className="ad-input" dir="ltr" value={position ?? ""} placeholder="center (click the image)" onChange={(e) => onPositionChange(e.target.value)} />
                <span className="ad-help block">Click the image on the important part (e.g. the face) so it stays visible when the image is cropped.</span>
              </label>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" id={id} className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setPicking(true)}>
                <Replace size={14} /> Change
              </button>
              <button type="button" className="ad-btn ad-btn-danger-ghost ad-btn-sm" onClick={() => onChange(null)}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-aqua-100 text-aqua-700">
            <ImagePlus size={20} />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{missing ? "The chosen file was deleted" : kind === "image" ? "No image chosen" : kind === "video" ? "No video file chosen" : "No document chosen"}</p>
            <p className="ad-muted text-xs">Choose from the media library or upload a new file.</p>
          </div>
          <button type="button" id={id} className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setPicking(true)}>
            Choose {kind === "image" ? "image" : "file"}
          </button>
        </div>
      )}
      {picking ? <MediaPicker open onClose={() => setPicking(false)} kind={kind} selectedId={value} onSelect={(m) => onChange(m.id)} /> : null}
    </div>
  );
}
