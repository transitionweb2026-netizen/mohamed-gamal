import type { ExplorerItem } from "@/components/sections/specialty-explorer";
import type { SiteView } from "@/lib/cms/view";

/** Interface texts the article cards need. */
export function articleLabels(site: SiteView) {
  return { readMore: site.ui["common.readMore"], minRead: site.ui["common.minRead"] };
}

/** Interface texts the video gallery needs. */
export function videoLabels(site: SiteView) {
  const { ui } = site;
  return { watch: ui["common.watch"], close: ui["common.close"], soonTitle: ui["common.videoSoonTitle"], soonText: ui["common.videoSoonText"], visitChannel: ui["common.visitChannel"] };
}

/** The YouTube channel address from Social media, if any. */
export function youtubeChannel(site: SiteView): string | undefined {
  return site.socials.find((s) => s.platform === "youtube")?.href;
}

/** Conditions as the specialty explorer shows them. */
export function explorerItems(site: SiteView): ExplorerItem[] {
  return site.conditions.map((c) => ({ id: c.slug, icon: c.icon, region: c.region, text: c.text, items: c.items, img: c.image }));
}
