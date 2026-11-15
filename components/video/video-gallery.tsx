"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clapperboard, Play, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Arrow } from "@/components/ui/brand";
import { YouTubeIcon } from "@/components/ui/brand-icons";

export interface GalleryVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: string;
  img: { src: string; alt: string };
}

interface Labels {
  watch: string;
  close: string;
  soonTitle: string;
  soonText: string;
  visitChannel: string;
}

/**
 * Video cards + a branded modal player. With a YouTube ID the modal embeds
 * the video (privacy-enhanced youtube-nocookie domain); without one it shows
 * a "coming soon" state that links to the channel.
 */
export function VideoGallery({
  videos,
  labels,
  dark = false,
  className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
}: {
  videos: GalleryVideo[];
  labels: Labels;
  dark?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState<GalleryVideo | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = (video: GalleryVideo, el: HTMLElement) => {
    returnFocus.current = el;
    setActive(video);
  };
  const close = useCallback(() => {
    setActive(null);
    returnFocus.current?.focus();
  }, []);

  return (
    <>
      <ul className={className}>
        {videos.map((video, i) => (
          <li key={video.id} data-reveal style={{ "--rd": `${(i % 3) * 110}ms` } as React.CSSProperties}>
            <button
              type="button"
              onClick={(e) => open(video, e.currentTarget)}
              className={`lg ${dark ? "lg--deep" : ""} lg-hover group flex h-full w-full flex-col p-2.5 text-start`}
              aria-haspopup="dialog"
            >
              <span className="img-frame img-zoom relative block aspect-[16/10] w-full rounded-[20px]">
                <Image
                  src={video.youtubeId ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg` : video.img.src}
                  alt={video.img.alt}
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <span
                  className="absolute inset-0 z-[1] transition-opacity duration-500 group-hover:opacity-70"
                  style={{ background: "linear-gradient(180deg, rgb(0 41 51 / 0.1), rgb(0 41 51 / 0.25) 45%, rgb(0 22 28 / 0.8)), linear-gradient(200deg, rgb(73 217 244 / 0.28), transparent 50%)" }}
                  aria-hidden
                />
                <span className="absolute inset-x-3 top-3 z-[2] flex items-center justify-between">
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
              </span>
              <span className="flex flex-1 flex-col px-3 pb-3 pt-5">
                <span className="font-display text-lg font-bold leading-snug">{video.title}</span>
                <span className={`mt-2 line-clamp-2 text-sm leading-7 ${dark ? "text-white/70" : "text-ink-900/70"}`}>{video.description}</span>
                <span className={`link-arrow mt-auto pt-4 ${dark ? "link-arrow--light" : ""}`}>
                  {labels.watch}
                  <Arrow size={16} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {active ? <VideoModal video={active} labels={labels} onClose={close} /> : null}
    </>
  );
}

function VideoModal({ video, labels, onClose }: { video: GalleryVideo; labels: Labels; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const channel = siteConfig.socials.find((s) => s.platform === "youtube")?.href;

  useEffect(() => {
    closeRef.current?.focus();
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep keyboard focus inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href], iframe");
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="modal" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal__dialog lg lg--deep p-2.5 sm:p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1 sm:px-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="chip chip--solid hidden sm:inline-flex">{video.category}</span>
            <h2 id={titleId} className="truncate text-base font-bold text-white sm:text-lg">
              {video.title}
            </h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="nav-square flex-none" aria-label={labels.close}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="img-frame relative aspect-video w-full rounded-[20px] bg-ink-950">
          {video.youtubeId ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <Image src={video.img.src} alt="" fill sizes="1040px" className="scale-110 object-cover blur-md" />
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, rgb(0 41 51 / 0.55), rgb(0 22 28 / 0.9))" }} />
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                <div className="flex max-w-md flex-col items-center">
                  <span className="icon-tile icon-tile--lg">
                    <Clapperboard size={28} aria-hidden />
                  </span>
                  <p className="mt-5 font-display text-xl font-bold sm:text-2xl">{labels.soonTitle}</p>
                  <p className="mt-2 text-sm leading-7 text-white/75 sm:text-base">{labels.soonText}</p>
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
        <p className="px-2 pb-1 pt-3 text-sm leading-7 text-white/70 sm:px-3">{video.description}</p>
      </div>
    </div>,
    document.body,
  );
}
