import type { Metadata } from "next";
import { House, Lightbulb, PlaySquare } from "lucide-react";
import { siteConfig } from "@/config/site";
import { resolveLocale } from "@/i18n/dictionaries";
import { toGalleryVideos, videoLabels } from "@/lib/content";
import { PageHero } from "@/components/hero/page-hero";
import { YouTubeIcon } from "@/components/ui/brand-icons";
import { VideoGallery } from "@/components/video/video-gallery";

export async function generateMetadata({ params }: PageProps<"/[lang]/videos">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.videos, description: t.heroes.videos.subtitle };
}

const chipIcons = [PlaySquare, House, Lightbulb];

export default async function VideosPage({ params }: PageProps<"/[lang]/videos">) {
  const { locale, t } = await resolveLocale(params);
  const v = t.videosPage;
  const channel = siteConfig.socials.find((s) => s.platform === "youtube")?.href;
  // The library always shows exactly nine videos (3 × 3 on desktop).
  const videos = t.videos.slice(0, 9);

  return (
    <>
      {/* Hero */}
      <PageHero locale={locale} t={t} photo="matExercise" copy={t.heroes.videos} crumb={t.nav.videos} />

      {/* Introduction */}
      <section className="section bg-snow !pb-0">
        <div className="container-x grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div data-reveal="start">
            <span className="eyebrow">{v.intro.eyebrow}</span>
            <h2 className="h-section mt-4">{v.intro.title}</h2>
            <p className="lead mt-4 max-w-2xl">{v.intro.text}</p>
          </div>
          <div className="lg lg--ink p-5 sm:p-6" data-reveal="end">
            <ul className="grid gap-3">
              {v.intro.chips.map((chip, i) => {
                const ChipIcon = chipIcons[i] ?? PlaySquare;
                return (
                  <li key={chip} className="flex items-center gap-3">
                    <span className="icon-tile icon-tile--sm">
                      <ChipIcon size={18} aria-hidden />
                    </span>
                    <span className="font-display font-semibold">{chip}</span>
                  </li>
                );
              })}
            </ul>
            {channel ? (
              <a href={channel} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5 w-full">
                <span className="btn__icon">
                  <YouTubeIcon width={15} height={15} />
                </span>
                {t.common.visitChannel}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* Video grid — exactly 9 cards: 3 cols desktop / 2 tablet / 1 mobile */}
      <section className="section bg-snow">
        <div className="container-x">
          <div className="relative rounded-[34px] bg-ice p-3 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.35)] sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 px-2 pb-6 pt-2" data-reveal>
              <div>
                <span className="eyebrow">{v.grid.eyebrow}</span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{v.grid.title}</h2>
              </div>
              <span className="chip chip--solid font-display" dir="ltr">
                {videos.length} / {videos.length}
              </span>
            </div>
            <VideoGallery videos={toGalleryVideos(videos, locale)} labels={videoLabels(t)} />
          </div>
        </div>
      </section>
    </>
  );
}
