/** Data shapes the dashboard's server pages pass to its client components. */
import type { MediaRow, NavRow } from "@/lib/cms/types";

export interface MediaItem extends MediaRow {
  /** Public address of the file. */
  src: string;
}

export interface SectionEditorData {
  id: string;
  pageKey: string;
  key: string;
  type: string;
  label: string;
  typeLabel: string;
  description: string;
  data: { label: string; href: string } | null;
  visible: boolean;
  sortOrder: number;
  /** What visitors see. */
  published: Record<string, unknown>;
  /** Unpublished edits, if any. */
  draft: Record<string, unknown> | null;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface RecordListRow {
  id: string;
  sortOrder: number;
  titleAr: string;
  titleEn: string;
  status: "draft" | "published" | null;
  identifier: string | null;
  image: string | null;
  updatedAt: string;
  values: Record<string, string | number | boolean | null>;
}

export interface ActivityEntry {
  id: number;
  created_at: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  details: Record<string, unknown>;
}

export interface DashboardStats {
  pages: number;
  sections: number;
  hiddenSections: number;
  pendingDrafts: number;
  collections: Record<"services" | "conditions" | "videos" | "articles" | "testimonials" | "faqs", { published: number; draft: number }>;
  placeholderTestimonials: number;
  media: { total: number; images: number; videos: number; documents: number; uploadedBytes: number };
  activityByDay: { day: string; count: number }[];
  lastUpdated: { type: string; id: string; label: string; page: string; updated_at: string; draft: boolean }[];
}

export type NavItemRow = NavRow & { updated_at?: string };

export interface AdminListItem {
  user_id: string;
  email: string;
  display_name: string;
  role: "owner" | "editor";
  created_at: string;
  last_sign_in_at: string | null;
}

export interface NotificationItem {
  id: string;
  tone: "warning" | "info" | "neutral";
  title: string;
  text: string;
  href: string;
  at: string | null;
}

/** Who is signed in, for the client shell. */
export interface ShellUser {
  email: string;
  displayName: string;
  role: "owner" | "editor";
  mode: "supabase" | "local";
}
