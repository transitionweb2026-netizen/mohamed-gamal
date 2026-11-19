/**
 * Row shapes of the CMS tables (supabase/migrations) and of the snapshot
 * returned by `public.cms_snapshot()`. The website renders only from a
 * `CmsSnapshot`; it comes from Supabase, or — before the CMS is connected —
 * from the content bundled in content/ (lib/cms/bundled.ts).
 */
import type { RichDoc } from "./richtext";

export type Locale = "ar" | "en";
export type Status = "draft" | "published";

/** A value per language: `{ ar: "…", en: "…" }`. */
export type L<T = string> = { ar: T; en: T };

export type MediaKind = "image" | "video" | "document";
export type MediaBucket = "images" | "videos" | "documents";
export type MediaFolder = "website" | "hero" | "doctor" | "articles" | "video-thumbnails" | "icons" | "videos" | "documents";

export interface MediaRow {
  id: string;
  kind: MediaKind;
  /** Storage bucket, or null for a file shipped with the site (`path` = "/images/…"). */
  bucket: MediaBucket | null;
  path: string;
  folder: MediaFolder;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  title: string;
  alt_ar: string;
  alt_en: string;
  legacy_path: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsRow {
  id: 1;
  site_name_ar: string;
  site_name_en: string;
  doctor_name_ar: string;
  doctor_name_en: string;
  doctor_role_ar: string;
  doctor_role_en: string;
  doctor_tagline_ar: string;
  doctor_tagline_en: string;
  monogram: string;
  logo_id: string | null;
  favicon_id: string | null;
  portrait_id: string | null;
  default_title_ar: string;
  default_title_en: string;
  default_description_ar: string;
  default_description_en: string;
  og_image_id: string | null;
  site_url: string;
  default_locale: Locale;
  robots_index: boolean;
  whatsapp_digits: string;
  whatsapp_message_ar: string;
  whatsapp_message_en: string;
  email: string;
  address_ar: string;
  address_en: string;
  hours_ar: string;
  hours_en: string;
  map_embed_url: string;
  map_link_url: string;
  updated_at?: string;
}

export interface PhoneRow {
  id: string;
  label_ar: string;
  label_en: string;
  display: string;
  digits: string;
  sort_order: number;
  visible: boolean;
}

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "linkedin" | "snapchat" | "threads";

export interface SocialRow {
  id: string;
  platform: SocialPlatform;
  url: string;
  sort_order: number;
  visible: boolean;
}

export interface NavRow {
  id: string;
  key: string;
  parent_id: string | null;
  href: string;
  label_ar: string;
  label_en: string;
  sort_order: number;
  visible: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  open_in_new_tab: boolean;
}

export interface PageRow {
  key: string;
  path: string | null;
  sort_order: number;
  name_ar: string;
  name_en: string;
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
  og_title_ar: string;
  og_title_en: string;
  og_description_ar: string;
  og_description_en: string;
  og_image_id: string | null;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  twitter_card: "summary" | "summary_large_image";
  updated_at?: string;
}

export interface SectionRow {
  id: string;
  page_key: string;
  key: string;
  type: string;
  sort_order: number;
  visible: boolean;
  content: Record<string, unknown>;
  published_at: string | null;
  updated_at?: string;
}

interface Publishable {
  id: string;
  sort_order: number;
  status: Status;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceRow extends Publishable {
  slug: string;
  icon: string;
  image_id: string | null;
  featured: boolean;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  summary_en: string;
  points_ar: string[];
  points_en: string[];
}

export interface ConditionRow extends Publishable {
  slug: string;
  icon: string;
  image_id: string | null;
  region_ar: string;
  region_en: string;
  text_ar: string;
  text_en: string;
  items_ar: string[];
  items_en: string[];
}

export interface ProcessStepRow extends Publishable {
  key: string;
  icon: string;
  title_ar: string;
  title_en: string;
  text_ar: string;
  text_en: string;
}

export interface StatRow extends Publishable {
  key: string;
  icon: string;
  value: string;
  label_ar: string;
  label_en: string;
}

export type VideoSource = "youtube" | "url" | "file";

export interface VideoRow extends Publishable {
  slug: string;
  source: VideoSource;
  youtube_id: string | null;
  video_url: string | null;
  file_id: string | null;
  poster_id: string | null;
  featured: boolean;
  category_ar: string;
  category_en: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
}

export interface ArticleCategoryRow {
  id: string;
  key: string;
  sort_order: number;
  name_ar: string;
  name_en: string;
}

export interface ArticleRow extends Publishable {
  slug: string;
  category_id: string | null;
  cover_id: string | null;
  og_image_id: string | null;
  published_on: string | null;
  featured: boolean;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  author_ar: string;
  author_en: string;
  cover_alt_ar: string;
  cover_alt_en: string;
  body_ar: RichDoc;
  body_en: RichDoc;
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
}

export interface TestimonialRow extends Publishable {
  key: string;
  rating: number | null;
  avatar_id: string | null;
  is_placeholder: boolean;
  quote_ar: string;
  quote_en: string;
  name_ar: string;
  name_en: string;
  meta_ar: string;
  meta_en: string;
}

export type FaqGroup = "home" | "services";

export interface FaqRow extends Publishable {
  group_key: FaqGroup;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export type CredentialKind = "education" | "experience" | "certification" | "achievement";

export interface CredentialRow extends Publishable {
  kind: CredentialKind;
  title_ar: string;
  title_en: string;
  place_ar: string;
  place_en: string;
  period_ar: string;
  period_en: string;
  text_ar: string;
  text_en: string;
}

export interface UiStringRow {
  key: string;
  value_ar: string;
  value_en: string;
}

/** Everything the public website renders from (published / visible rows only, unless `preview`). */
export interface CmsSnapshot {
  preview: boolean;
  settings: SettingsRow | null;
  phones: PhoneRow[];
  socials: SocialRow[];
  navigation: NavRow[];
  pages: PageRow[];
  sections: SectionRow[];
  media: MediaRow[];
  services: ServiceRow[];
  conditions: ConditionRow[];
  processSteps: ProcessStepRow[];
  stats: StatRow[];
  videos: VideoRow[];
  articleCategories: ArticleCategoryRow[];
  articles: ArticleRow[];
  testimonials: TestimonialRow[];
  faqs: FaqRow[];
  credentials: CredentialRow[];
  uiStrings: UiStringRow[];
}

/* ---- Section content building blocks (page_sections.content) ---------------- */

/** An image chosen from the media library, with an optional focal point ("50% 30%"). */
export interface ImageRef {
  id: string | null;
  position: string;
}

/** A button or link: label per language and one destination. */
export interface CtaDoc {
  label: L;
  href: string;
}

export interface HeadingDoc {
  eyebrow: L;
  title: L;
  text: L;
}

export interface IconTextDoc {
  icon: string;
  title: L;
  text: L;
}

export interface IconLabelDoc {
  icon: string;
  label: L;
}
