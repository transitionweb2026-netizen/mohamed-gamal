/* eslint-disable @next/next/no-img-element -- dashboard previews of library files (any size, any host) */
"use client";

import { FileText, Film } from "lucide-react";
import type { MediaItem } from "@/lib/cms/admin/shapes";

export function MediaThumb({ item, className = "", fit = "cover", position }: { item: MediaItem | undefined; className?: string; fit?: "cover" | "contain"; position?: string }) {
  if (!item) return <div className={`ad-skeleton ${className}`} />;
  if (item.kind === "image")
    return <img src={item.src} alt={item.alt_en || item.alt_ar || item.title} loading="lazy" decoding="async" className={`${className} bg-ink-100`} style={{ objectFit: fit, objectPosition: position || undefined }} />;
  return (
    <div className={`${className} grid place-items-center bg-gradient-to-br from-ink-800 to-ink-950 text-aqua-400`}>
      {item.kind === "video" ? <Film size={28} /> : <FileText size={28} />}
    </div>
  );
}

export const mediaName = (item: MediaItem) => item.title || item.alt_en || item.alt_ar || item.path.split("/").pop() || "Untitled";
