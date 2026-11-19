import type { Metadata } from "next";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import type { HeadingOnlyView, HeroView, VideosIntroView } from "@/lib/cms/view";
import { PageHero } from "@/components/hero/page-hero";
import { Icon } from "@/components/ui/icon";
import { YouTubeIcon } from "@/components/ui/brand-icons";
import { VideoGallery } from "@/components/video/video-gallery";
import { renderSections } from "@/components/sections/render";
import { videoLabels, youtubeChannel } from "@/components/sections/labels";

export async function generateMetadata({ params }: PageProps<"/[lang]/videos">): Promise<Metadata> {
  const { site } = await siteFor(params);
  return pageMetadata(site, site.pages.videos, "/videos");
}

export default async function VideosPage({ params }: PageProps<"/[lang]/videos">) {
  const { site } = await siteFor(params);
  const page = site.pages.videos;
  const channel = youtubeChannel(site);

  return renderSections(page, {
    hero: (hero: HeroView) => <PageHero site={site} hero={hero} crumb={page.name} />,

    intro: (c: VideosIntroView) => (
      <section className="section bg-snow !pb-0">
        <div className="container-x grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div data-reveal="start">
            {c.heading.eyebrow ? <span className="eyebrow">{c.heading.eyebrow}</span> : null}
            <h2 className="h-section mt-4">{c.heading.title}</h2>
            {c.heading.text ? <p className="lead mt-4 max-w-2xl">{c.heading.text}</p> : null}
          </div>
          {c.chips.length || channel ? (
            <div className="lg lg--ink p-5 sm:p-6" data-reveal="end">
              <ul className="grid gap-3">
                {c.chips.map((chip, i) => (
                  <li key={chip.label + i} className="flex items-center gap-3">
                    <span className="icon-tile icon-tile--sm">
                      <Icon name={chip.icon} size={18} />
                    </span>
                    <span className="font-display font-semibold">{chip.label}</span>
                  </li>
                ))}
              </ul>
              {channel && c.channelLabel ? (
                <a href={channel} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5 w-full">
                  <span className="btn__icon">
                    <YouTubeIcon width={15} height={15} />
                  </span>
                  {c.channelLabel}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    ),

    // Every published video, in its dashboard order: 3 columns desktop / 2 tablet / 1 mobile.
    grid: (c: HeadingOnlyView) =>
      site.videos.length ? (
        <section className="section bg-snow">
          <div className="container-x">
            <div className="relative rounded-[34px] bg-ice p-3 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.35)] sm:p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4 px-2 pb-6 pt-2" data-reveal>
                <div>
                  {c.heading.eyebrow ? <span className="eyebrow">{c.heading.eyebrow}</span> : null}
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{c.heading.title}</h2>
                </div>
                <span className="chip chip--solid font-display" dir="ltr">
                  {site.videos.length}
                </span>
              </div>
              <VideoGallery videos={site.videos} labels={videoLabels(site)} channel={channel} />
            </div>
          </div>
        </section>
      ) : null,
  });
}
