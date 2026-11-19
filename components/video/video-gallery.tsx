"use client";

import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { Clapperboard, Play, X } from "lucide-react";
import type { VideoView } from "@/lib/cms/view";
import { Arrow } from "@/components/ui/brand";
import { YouTubeIcon } from "@/components/ui/brand-icons";
import { Modal } from "@/components/ui/modal";

export type GalleryVideo = VideoView;

/** Thumbnail: the uploaded poster, else the YouTube thumbnail. */
function thumbOf(video: GalleryVideo): { src: string; alt: string; position?: string } | null {
  if (video.poster) return video.poster;
  if (video.youtubeId) return { src: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`, alt: video.title };
  return null;
}

interface Labels {
  watch: string;
  close: string;
  soonTitle: string;
  soonText: string;
  visitChannel: string;
}

/**
 * Portrait (9:16, phone-sized) video cards + a vertical modal player. It
 * plays a YouTube video (privacy-enhanced youtube-nocookie domain — ideal
 * for Shorts), an uploaded file or an external video address; without any,
 * it shows a "coming soon" state that links to the channel.
 */
export function VideoGallery({
  videos,
  labels,
  dark = false,
  channel,
  className = "mx-auto grid max-w-[1100px] gap-6 sm:grid-cols-2 lg:grid-cols-3",
}: {
  videos: GalleryVideo[];
  labels: Labels;
  dark?: boolean;
  /** YouTube channel address (Social media). */
  channel?: string;
  className?: string;
}) {
  const [active, setActive] = useState<GalleryVideo | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <>
      <ul className={className}>
        {videos.map((video, i) => (
          <li key={video.id} className="mx-auto w-full max-w-[380px] sm:max-w-none" data-reveal style={{ "--rd": `${(i % 3) * 120}ms` } as React.CSSProperties}>
            <button
              type="button"
              onClick={() => setActive(video)}
              className={`lg ${dark ? "lg--deep" : ""} lg-hover group block w-full p-2 text-start`}
              aria-haspopup="dialog"
            >
              <span className="img-frame img-zoom relative block aspect-[9/16] w-full rounded-[24px]">
                {thumbOf(video) ? (
                  <Image
                    src={thumbOf(video)!.src}
                    alt={thumbOf(video)!.alt}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 380px"
                    className="object-cover"
                    style={thumbOf(video)!.position ? { objectPosition: thumbOf(video)!.position } : undefined}
                  />
                ) : null}
                <span
                  className="absolute inset-0 z-[1]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgb(0 22 28 / 0.55) 0%, transparent 22%, transparent 45%, rgb(0 22 28 / 0.55) 68%, rgb(0 22 28 / 0.95) 100%), linear-gradient(200deg, rgb(73 217 244 / 0.25), transparent 45%)",
                  }}
                  aria-hidden
                />
                {/* Phone-screen detail */}
                <span className="absolute left-1/2 top-2.5 z-[2] h-1.5 w-14 -translate-x-1/2 rounded-full bg-white/40 shadow-[0_0_10px_rgb(73_217_244/0.6)]" aria-hidden />
                <span className="absolute inset-x-4 top-6 z-[2] flex items-center justify-between">
                  <span className="chip chip--solid">{video.category}</span>
                  <span className="font-display text-sm font-bold text-white/90" dir="ltr">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="absolute inset-0 z-[2] grid place-items-center">
                  <span className="play-btn">
                    <Play size={20} fill="currentColor" aria-hidden />
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 z-[2] flex flex-col p-5 text-white">
                  <span className="font-display text-lg font-bold leading-snug">{video.title}</span>
                  <span className="mt-2 line-clamp-2 text-sm leading-6 text-white/75">{video.description}</span>
                  <span className="link-arrow link-arrow--light mt-4 self-start">
                    {labels.watch}
                    <Arrow size={16} />
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {active ? <VideoModal video={active} labels={labels} channel={channel} onClose={close} /> : null}
    </>
  );
}

function VideoModal({ video, labels, channel, onClose }: { video: GalleryVideo; labels: Labels; channel?: string; onClose: () => void }) {
  const titleId = useId();
  const thumb = thumbOf(video);
  const playable = !!video.youtubeId || !!video.fileUrl;

  return (
    <Modal onClose={onClose} labelledBy={titleId} className="modal__dialog--video lg lg--deep">
      <div className="flex flex-col gap-3 p-2.5 md:flex-row md:items-stretch md:gap-2">
        {/* Info panel (above the player on phones, beside it on wider screens) */}
        <div className="flex flex-col px-2 pt-1 md:order-2 md:w-72 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="chip chip--solid">{video.category}</span>
            <button type="button" data-autofocus onClick={onClose} className="nav-square flex-none" aria-label={labels.close}>
              <X size={20} aria-hidden />
            </button>
          </div>
          <h2 id={titleId} className="mt-3 text-lg font-bold leading-snug text-white md:mt-6 md:text-2xl">
            {video.title}
          </h2>
          <p className="mt-2 hidden text-sm leading-7 text-white/70 md:block">{video.description}</p>
          {channel && playable ? (
            <a href={channel} target="_blank" rel="noopener noreferrer" className="btn btn--glass btn--sm mt-auto hidden self-start md:inline-flex">
              <span className="btn__icon">
                <YouTubeIcon width={15} height={15} />
              </span>
              {labels.visitChannel}
            </a>
          ) : null}
        </div>

        {/* Vertical player */}
        <div className="video-frame img-frame relative mx-auto rounded-[22px] bg-ink-950 md:order-1">
          {video.youtubeId ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video.fileUrl ? (
            <video className="absolute inset-0 h-full w-full bg-ink-950 object-contain" src={video.fileUrl} poster={thumb?.src} controls autoPlay playsInline preload="metadata">
              <track kind="captions" />
            </video>
          ) : (
            <>
              {thumb ? <Image src={thumb.src} alt="" fill loading="eager" sizes="440px" className="scale-110 object-cover blur-md" /> : null}
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, rgb(0 41 51 / 0.5), rgb(0 22 28 / 0.92))" }} />
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                <div className="flex flex-col items-center">
                  <span className="icon-tile icon-tile--lg">
                    <Clapperboard size={28} aria-hidden />
                  </span>
                  <p className="mt-5 font-display text-xl font-bold">{labels.soonTitle}</p>
                  <p className="mt-2 text-sm leading-7 text-white/75">{labels.soonText}</p>
                  {channel ? (
                    <a href={channel} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-6">
                      <span className="btn__icon">
                        <YouTubeIcon width={15} height={15} />
                      </span>
                      {labels.visitChannel}
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
