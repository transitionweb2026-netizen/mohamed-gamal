import { photos } from "@/content/media";
import type { Dictionary, Video } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { GalleryVideo } from "@/components/video/video-gallery";
import type { ExplorerItem } from "@/components/sections/specialty-explorer";

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
