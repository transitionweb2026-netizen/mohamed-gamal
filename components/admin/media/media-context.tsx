"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { MediaItem } from "@/lib/cms/admin/shapes";
import type { StorageMode } from "./upload";

interface MediaApi {
  items: MediaItem[];
  mode: StorageMode;
  byId: (id: string | null | undefined) => MediaItem | undefined;
  upsert: (item: MediaItem) => void;
  remove: (id: string) => void;
}

const MediaContext = createContext<MediaApi | null>(null);

/** The media library, shared by every image / file field of a page. */
export function MediaProvider({ items: initial, mode, children }: { items: MediaItem[]; mode: StorageMode; children: ReactNode }) {
  const [items, setItems] = useState(initial);
  const [source, setSource] = useState(initial);
  // New server data (after router.refresh()) replaces the local list.
  if (source !== initial) {
    setSource(initial);
    setItems(initial);
  }
  const index = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);
  const byId = useCallback((id: string | null | undefined) => (id ? index.get(id) : undefined), [index]);
  const upsert = useCallback((item: MediaItem) => setItems((list) => (list.some((m) => m.id === item.id) ? list.map((m) => (m.id === item.id ? item : m)) : [item, ...list])), []);
  const remove = useCallback((id: string) => setItems((list) => list.filter((m) => m.id !== id)), []);
  const value = useMemo(() => ({ items, mode, byId, upsert, remove }), [items, mode, byId, upsert, remove]);
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia(): MediaApi {
  const value = useContext(MediaContext);
  if (!value) throw new Error("MediaProvider is missing.");
  return value;
}
