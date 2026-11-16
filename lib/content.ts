import { photos } from "@/content/media";
import type { Dictionary, Video } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { GalleryVideo } from "@/components/video/video-gallery";
import type { ExplorerItem } from "@/components/sections/specialty-explorer";
import type { ModalArticle } from "@/components/articles/article-modal";
import { formatDate, readingMinutes } from "./articles";

/** Serializable video data for the client-side gallery. */
export function toGalleryVideos(videos: Video[], locale: Locale): GalleryVideo[] {
  return videos.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    description: v.description,
    category: v.category,
    img: { src: photos[v.photo].src, alt: photos[v.photo].alt[locale] },
  }));
}

export function videoLabels(t: Dictionary) {
  return {
    watch: t.common.watch,
    close: t.common.close,
    soonTitle: t.common.videoSoonTitle,
    soonText: t.common.videoSoonText,
    visitChannel: t.common.visitChannel,
  };
}

export function toExplorerItems(t: Dictionary, locale: Locale): ExplorerItem[] {
  return t.conditions.map((c) => ({
    id: c.id,
    icon: c.icon,
    region: c.region,
    text: c.text,
    items: c.items,
    img: { src: photos[c.photo].src, alt: photos[c.photo].alt[locale] },
  }));
}

export function articleLabels(t: Dictionary) {
  return { readMore: t.common.readMore, minRead: t.common.minRead };
}

/** Serializable articles for the client-side article popup. */
export function toModalArticles(t: Dictionary, locale: Locale): ModalArticle[] {
  return t.articles.map((a) => ({
    slug: a.slug,
    category: a.category,
    title: a.title,
    excerpt: a.excerpt,
    date: a.date,
    dateLabel: a.date ? formatDate(a.date, locale) : undefined,
    minutes: readingMinutes(a),
    img: { src: photos[a.photo].src, alt: photos[a.photo].alt[locale] },
    body: a.body,
  }));
}
