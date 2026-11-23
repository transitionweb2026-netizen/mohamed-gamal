"use client";

import { useCallback, useState } from "react";
import { discardUpload, registerMedia } from "@/lib/cms/admin/actions/media";
import type { MediaItem } from "@/lib/cms/admin/shapes";
import { uploadProblem } from "@/lib/cms/media-rules";
import type { MediaFolder, MediaKind } from "@/lib/cms/types";
import { useToast } from "../ui/feedback";
import { useMedia } from "./media-context";
import { uploadFile } from "./upload";

export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  error: string | null;
}

/** Uploads files to Storage, then registers them in the media library. */
export function useUploader() {
  const { mode, upsert } = useMedia();
  const toast = useToast();
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const upload = useCallback(
    async (files: File[], folder: MediaFolder, expected?: MediaKind): Promise<MediaItem[]> => {
      const done: MediaItem[] = [];
      for (const file of files) {
        const problem = uploadProblem(file, expected);
        if (problem) {
          toast.error(problem);
          continue;
        }
        const id = `${file.name}-${file.size}-${Math.random()}`;
        setTasks((list) => [...list, { id, name: file.name, progress: 0, error: null }]);
        const set = (patch: Partial<UploadTask>) => setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        try {
          const uploaded = await uploadFile(file, folder, mode, (progress) => set({ progress }));
          const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 200);
          const result = await registerMedia(uploaded, { folder, title, altAr: "", altEn: "" });
          if (!result.ok) {
            await discardUpload(uploaded.bucket, uploaded.path);
            throw new Error(result.error);
          }
          upsert(result.data);
          done.push(result.data);
          setTasks((list) => list.filter((t) => t.id !== id));
        } catch (error) {
          const message = error instanceof Error ? error.message : "The upload failed.";
          set({ error: message });
          toast.error(`${file.name}: ${message}`);
          setTimeout(() => setTasks((list) => list.filter((t) => t.id !== id)), 6000);
        }
      }
      if (done.length) toast.success(done.length === 1 ? "File uploaded. Add a description for screen readers in its details." : `${done.length} files uploaded.`);
      return done;
    },
    [mode, toast, upsert],
  );

  return { upload, tasks, busy: tasks.some((t) => !t.error) };
}

export function UploadProgress({ tasks }: { tasks: UploadTask[] }) {
  if (!tasks.length) return null;
  return (
    <ul className="space-y-2" aria-live="polite">
      {tasks.map((t) => (
        <li key={t.id} className="rounded-xl bg-white/70 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">{t.name}</span>
            <span className={t.error ? "text-[var(--danger)]" : "ad-muted"}>{t.error ? "Failed" : `${Math.round(t.progress * 100)}%`}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div className={`h-full rounded-full transition-[width] duration-300 ${t.error ? "bg-[var(--danger)]" : "bg-aqua-600"}`} style={{ width: `${Math.max(4, t.progress * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
