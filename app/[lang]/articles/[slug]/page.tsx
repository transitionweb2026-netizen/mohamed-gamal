import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { whatsappHref } from "@/config/site";
import { ar } from "@/content/ar";
import { photos } from "@/content/media";
import { locales, localizeHref } from "@/i18n/config";
import { resolveLocale } from "@/i18n/dictionaries";
import { articleLabels } from "@/lib/content";
import { PageHero } from "@/components/hero/page-hero";
import { Arrow, BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { ArticleRow, readingMinutes } from "@/components/cards/article-cards";

export function generateStaticParams() {
  // Slugs are shared by both languages.
  return locales.flatMap((lang) => ar.articles.map((a) => ({ lang, slug: a.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/articles/[slug]">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  const { slug } = await params;
  const article = t.articles.find((a) => a.slug === slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt, openGraph: { images: [photos[article.photo].src] } };
}

export default async function ArticlePage({ params }: PageProps<"/[lang]/articles/[slug]">) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const article = t.articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const img = photos[article.photo];
  const related = t.articles.filter((a) => a.slug !== slug).slice(0, 3);
  const labels = articleLabels(t);

  return (
    <>
      <PageHero
        locale={locale}
        t={t}
        photo={article.photo}
        copy={{ eyebrow: article.category, title: [article.title, ""], subtitle: article.excerpt }}
        crumb={article.category}
        parentCrumb={{ label: t.nav.articles, href: "/articles" }}
        compact
      />

      <section className="section bg-snow">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          <article className="lg p-2.5" data-reveal>
            <div className="img-frame relative aspect-[16/8] rounded-[22px]">
              <Image src={img.src} alt={img.alt[locale]} fill sizes="(min-width: 1024px) 820px, 100vw" className="object-cover" />
            </div>
            <div className="px-4 pb-8 pt-8 sm:px-10 sm:pb-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip chip--solid">{article.category}</span>
                <span className="text-sm text-ink-900/60">
                  {readingMinutes(article)} {t.common.minRead}
                </span>
              </div>
              <div className="prose-brand mt-8">
                {article.body.map((block, i) => {
                  if (block.type === "h") return <h2 key={i}>{block.text}</h2>;
                  if (block.type === "list")
                    return (
                      <ul key={i}>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    );
                  return <p key={i}>{block.text}</p>;
                })}
              </div>
              <aside className="mt-10 flex items-start gap-3 rounded-2xl bg-aqua-50 p-5 text-sm leading-7 text-ink-900/75 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.5)]">
                <Info size={20} className="mt-0.5 flex-none text-aqua-700" aria-hidden />
                {t.common.disclaimer}
              </aside>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <div className="lg lg--ink overflow-hidden p-6" data-reveal>
              <div className="orb" style={{ width: 200, height: 200, insetInlineEnd: -60, top: -70, opacity: 0.5 }} aria-hidden />
              <div className="flex items-center gap-3">
                <BrandMark />
                <div>
                  <p className="font-display font-bold">{t.doctor.name}</p>
                  <p className="text-xs text-aqua-300">{t.doctor.role}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/75">{t.cta.lines[0]}</p>
              <a href={whatsappHref(t.cta.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5 w-full">
                <span className="btn__icon">
                  <WhatsAppIcon width={15} height={15} />
                </span>
                {t.cta.whatsapp}
              </a>
            </div>
            <div>
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                <span className="h-4 w-1 rounded-full bg-aqua-500" aria-hidden />
                {t.common.related}
              </h2>
              <div className="space-y-3">
                {related.map((a, i) => (
                  <ArticleRow key={a.slug} article={a} locale={locale} labels={labels} delay={i * 80} />
                ))}
              </div>
            </div>
            <Link href={localizeHref("/articles", locale)} className="link-arrow">
              <Arrow size={16} className="rotate-180" />
              {t.common.backToArticles}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
