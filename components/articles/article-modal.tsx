"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Clock3, Info, Sparkles, X } from "lucide-react";
import type { ArticleView } from "@/lib/cms/view";
import { RichDocView } from "@/components/ui/rich-doc";
import { Modal } from "@/components/ui/modal";
import { Arrow } from "@/components/ui/brand";

/** An article as the popup needs it (the website's ArticleView). */
export type ModalArticle = ArticleView;

export interface ArticleModalLabels {
  close: string;
  minRead: string;
  readMore: string;
  recommended: string;
  disclaimer: string;
}

const OpenArticle = createContext<((slug: string) => void) | null>(null);

/** Holds the current language's articles and renders the article popup. */
export function ArticleModalProvider({ articles, labels, children }: { articles: ModalArticle[]; labels: ArticleModalLabels; children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const open = useCallback((s: string) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);
  const article = slug ? articles.find((a) => a.slug === slug) : undefined;

  return (
    <OpenArticle.Provider value={open}>
      {children}
      {article ? <ArticleModal article={article} articles={articles} labels={labels} onClose={close} onSelect={setSlug} /> : null}
    </OpenArticle.Provider>
  );
}

/**
 * A link to an article that opens it in the popup. The href still points
 * at the full article page, so Ctrl/⌘-click, middle-click and no-JS work.
 */
export function ArticleLink({ slug, onClick, ...props }: React.ComponentProps<typeof Link> & { slug: string }) {
  const open = useContext(OpenArticle);
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!open || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        open(slug);
      }}
    />
  );
}

function ArticleModal({
  article,
  articles,
  labels,
  onClose,
  onSelect,
}: {
  article: ModalArticle;
  articles: ModalArticle[];
  labels: ArticleModalLabels;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) {
  const titleId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [article.slug]);

  const index = articles.findIndex((a) => a.slug === article.slug);
  const recommended = [1, 2, 3].map((k) => articles[(index + k) % articles.length]);

  return (
    <Modal onClose={onClose} labelledBy={titleId} className="modal__dialog--article lg lg--paper">
      <button type="button" data-autofocus onClick={onClose} className="nav-square absolute top-4 z-20 !bg-ink-900/55 backdrop-blur-md" style={{ insetInlineEnd: "1rem" }} aria-label={labels.close}>
        <X size={20} aria-hidden />
      </button>

      <div ref={scrollRef} className="max-h-[min(92svh,980px)] overflow-y-auto overscroll-contain rounded-[inherit]">
        <article key={article.slug} className="animate-[page-in_0.5s_ease_both]">
          {/* Cover */}
          <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
            {article.cover ? <Image src={article.cover.src} alt={article.cover.alt} fill loading="eager" sizes="(min-width: 920px) 900px, 100vw" className="animate-[hero-zoom_8s_var(--ease)_both] object-cover" /> : null}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgb(0 41 51 / 0.15), transparent 40%, rgb(0 22 28 / 0.85))" }} aria-hidden />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center gap-2 sm:inset-x-10">
              <span className="chip chip--solid">{article.category}</span>
              <span className="chip chip--dark">
                <Clock3 size={13} aria-hidden />
                {article.minutes} {labels.minRead}
              </span>
              {article.dateLabel ? (
                <span className="chip chip--dark">
                  <CalendarDays size={13} aria-hidden />
                  <time dateTime={article.date ?? undefined}>{article.dateLabel}</time>
                </span>
              ) : null}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pb-8 pt-7 sm:px-10 sm:pb-10">
            <h2 id={titleId} className="text-[clamp(1.5rem,3.2vw,2.25rem)] font-bold leading-tight">
              {article.title}
            </h2>
            <p className="lead mt-3">{article.excerpt}</p>
            <RichDocView doc={article.body} className="mt-6 border-t border-aqua-500/25 pt-6" />
            <aside className="mt-8 flex items-start gap-3 rounded-2xl bg-aqua-50 p-4 text-sm leading-7 text-ink-900/75 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.5)]">
              <Info size={20} className="mt-0.5 flex-none text-aqua-700" aria-hidden />
              {labels.disclaimer}
            </aside>
          </div>

          {/* Recommended */}
          <div className="bg-ice relative px-5 py-8 sm:px-10">
            <h3 className="flex items-center gap-3 text-lg font-bold">
              <span className="icon-tile icon-tile--sm icon-tile--ink">
                <Sparkles size={17} aria-hidden />
              </span>
              {labels.recommended}
            </h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {recommended.map((r) => (
                <li key={r.slug}>
                  <button type="button" onClick={() => onSelect(r.slug)} className="lg lg-hover group flex h-full w-full flex-col p-2 text-start">
                    <span className="img-frame img-zoom relative block aspect-[4/3] w-full rounded-[18px]">
                      {r.cover ? <Image src={r.cover.src} alt="" fill sizes="(min-width: 640px) 260px, 100vw" className="object-cover" /> : null}
                    </span>
                    <span className="flex flex-1 flex-col px-2 pb-2 pt-3">
                      <span className="text-xs font-semibold text-aqua-700">{r.category}</span>
                      <span className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug">{r.title}</span>
                      <span className="link-arrow mt-auto pt-3 !text-xs">
                        {labels.readMore}
                        <Arrow size={14} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </Modal>
  );
}
