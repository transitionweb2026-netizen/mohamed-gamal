import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { photos } from "@/content/media";
import type { Article } from "@/content/types";
import { localizeHref, type Locale } from "@/i18n/config";
import { Arrow } from "@/components/ui/brand";

export function readingMinutes(article: Article): number {
  const words = article.body
    .flatMap((b) => (b.type === "list" ? b.items : [b.text]))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 160));
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(date));
}

interface MetaLabels {
  readMore: string;
  minRead: string;
}

function Meta({ article, locale, labels, dark }: { article: Article; locale: Locale; labels: MetaLabels; dark?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${dark ? "text-white/65" : "text-ink-900/60"}`}>
      {article.date ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} className={dark ? "text-aqua-400" : "text-aqua-700"} aria-hidden />
          <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <Clock3 size={14} className={dark ? "text-aqua-400" : "text-aqua-700"} aria-hidden />
        {readingMinutes(article)} {labels.minRead}
      </span>
    </div>
  );
}

/**
 * Secondary article card. `tone` alternates cyan glass and teal-ink glass
 * so a grid of cards reads as a deliberate checkerboard, not a repeat.
 */
export function ArticleCard({
  article,
  locale,
  labels,
  tone = "aqua",
  delay = 0,
}: {
  article: Article;
  locale: Locale;
  labels: MetaLabels;
  tone?: "aqua" | "ink";
  delay?: number;
}) {
  const img = photos[article.photo];
  const dark = tone === "ink";
  const href = localizeHref(`/articles/${article.slug}`, locale);
  return (
    <article
      className={`lg ${dark ? "lg--ink" : ""} lg-hover group flex h-full flex-col p-2.5`}
      data-reveal
      style={{ "--rd": `${delay}ms` } as React.CSSProperties}
    >
      <Link href={href} tabIndex={-1} aria-hidden className="img-frame img-zoom relative block aspect-[16/10] rounded-[20px]">
        <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        <span className={`chip ${dark ? "chip--solid" : ""} absolute top-3 z-[2]`} style={{ insetInlineStart: "0.75rem" }}>
          {article.category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col px-3.5 pb-4 pt-5 sm:px-4">
        <Meta article={article} locale={locale} labels={labels} dark={dark} />
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link href={href} className="transition-colors hover:text-aqua-600">
            {article.title}
          </Link>
        </h3>
        <p className={`mt-2.5 line-clamp-3 text-sm leading-7 ${dark ? "text-white/72" : "text-ink-900/70"}`}>{article.excerpt}</p>
        <Link href={href} className={`link-arrow mt-auto self-start pt-5 ${dark ? "link-arrow--light" : ""}`}>
          {labels.readMore}
          <Arrow size={16} />
        </Link>
      </div>
    </article>
  );
}

/** Horizontal compact card (home page sidebar list, related articles). */
export function ArticleRow({ article, locale, labels, delay = 0 }: { article: Article; locale: Locale; labels: MetaLabels; delay?: number }) {
  const img = photos[article.photo];
  return (
    <Link
      href={localizeHref(`/articles/${article.slug}`, locale)}
      className="lg lg-hover group flex items-stretch gap-4 p-2.5"
      data-reveal
      style={{ "--rd": `${delay}ms` } as React.CSSProperties}
    >
      <span className="img-frame img-zoom relative block w-28 flex-none rounded-[18px] sm:w-36">
        <Image src={img.src} alt="" fill sizes="144px" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-col py-2 pe-2">
        <span className="text-xs font-semibold text-aqua-700">{article.category}</span>
        <span className="mt-1 line-clamp-2 font-display font-bold leading-snug">{article.title}</span>
        <span className="link-arrow mt-auto pt-2 !text-xs">
          {labels.readMore}
          <Arrow size={14} />
        </span>
      </span>
    </Link>
  );
}

/** The one dominant featured article — split composition in teal-ink glass. */
export function FeaturedArticle({ article, locale, labels }: { article: Article; locale: Locale; labels: MetaLabels & { featured: string } }) {
  const img = photos[article.photo];
  const href = localizeHref(`/articles/${article.slug}`, locale);
  return (
    <article className="lg lg--ink group grid overflow-hidden p-2.5 lg:grid-cols-[1.15fr_1fr]" data-reveal="scale">
      <Link href={href} tabIndex={-1} aria-hidden className="img-frame img-zoom relative block min-h-[260px] rounded-[26px] sm:min-h-[380px]">
        <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 680px, 100vw" className="object-cover" />
        <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(200deg, rgb(73 217 244 / 0.3), transparent 50%)" }} aria-hidden />
        <span className="chip chip--solid absolute top-4 z-[2]" style={{ insetInlineStart: "1rem" }}>
          {labels.featured}
        </span>
      </Link>
      <div className="relative flex flex-col justify-center p-6 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden>
          <div className="deco-rings" style={{ width: 220, insetInlineEnd: -90, top: -90, opacity: 0.5 }} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip chip--dark">{article.category}</span>
          <Meta article={article} locale={locale} labels={labels} dark />
        </div>
        <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.5rem)] font-bold leading-tight text-white">
          <Link href={href} className="transition-colors hover:text-aqua-300">
            {article.title}
          </Link>
        </h2>
        <p className="mt-4 leading-8 text-white/75">{article.excerpt}</p>
        <Link href={href} className="btn btn--aqua mt-8 self-start">
          <span className="btn__icon">
            <Arrow size={17} />
          </span>
          {labels.readMore}
        </Link>
      </div>
    </article>
  );
}
