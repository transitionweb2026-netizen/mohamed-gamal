import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { locales, localizeHref } from "@/i18n/config";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import { whatsappLink } from "@/lib/cms/links";
import { getPublishedSnapshot } from "@/lib/cms/source";
import { PageHero } from "@/components/hero/page-hero";
import { Arrow, BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { CmsImage } from "@/components/ui/cms-image";
import { RichDocView } from "@/components/ui/rich-doc";
import { ArticleRow } from "@/components/cards/article-cards";
import { articleLabels } from "@/components/sections/labels";

/** Published articles are prerendered; articles published later are rendered on first visit. */
export async function generateStaticParams() {
  const snapshot = await getPublishedSnapshot();
  return locales.flatMap((lang) => snapshot.articles.map((a) => ({ lang, slug: a.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/articles/[slug]">): Promise<Metadata> {
  const { site } = await siteFor(params);
  const { slug } = await params;
  const article = site.articles.find((a) => a.slug === slug);
  if (!article) return {};
  return pageMetadata(site, undefined, `/articles/${slug}`, {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    image: article.ogImage,
    type: "article",
  });
}

export default async function ArticlePage({ params }: PageProps<"/[lang]/articles/[slug]">) {
  const { locale, site } = await siteFor(params);
  const { slug } = await params;
  const article = site.articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const { ui, identity, contact } = site;
  const related = site.articles.filter((a) => a.slug !== slug).slice(0, 3);
  const labels = articleLabels(site);

  return (
    <>
      <PageHero
        site={site}
        hero={{ eyebrow: article.category, titleLead: article.title, titleAccent: "", subtitle: article.excerpt, image: article.cover, primaryCta: null, secondaryCta: null, badges: [] }}
        crumb={article.category || article.title}
        parentCrumb={{ label: site.pages.articles?.name ?? "", href: "/articles" }}
        compact
      />

      <section className="section bg-snow">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          <article className="lg p-2.5" data-reveal>
            {article.cover ? (
              <div className="img-frame relative aspect-[16/8] rounded-[22px]">
                <CmsImage img={article.cover} sizes="(min-width: 1024px) 820px, 100vw" />
              </div>
            ) : null}
            <div className="px-4 pb-8 pt-8 sm:px-10 sm:pb-12">
              <div className="flex flex-wrap items-center gap-3">
                {article.category ? <span className="chip chip--solid">{article.category}</span> : null}
                <span className="text-sm text-ink-900/60">
                  {article.minutes} {ui["common.minRead"]}
                </span>
                {article.dateLabel ? (
                  <time dateTime={article.date ?? undefined} className="text-sm text-ink-900/60">
                    {article.dateLabel}
                  </time>
                ) : null}
                {article.author ? <span className="text-sm font-semibold text-ink-900/70">{article.author}</span> : null}
              </div>
              <RichDocView doc={article.body} className="mt-8" />
              <aside className="mt-10 flex items-start gap-3 rounded-2xl bg-aqua-50 p-5 text-sm leading-7 text-ink-900/75 shadow-[inset_0_0_0_1px_rgb(73_217_244/0.5)]">
                <Info size={20} className="mt-0.5 flex-none text-aqua-700" aria-hidden />
                {ui["common.disclaimer"]}
              </aside>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <div className="lg lg--ink overflow-hidden p-6" data-reveal>
              <div className="orb" style={{ width: 200, height: 200, insetInlineEnd: -60, top: -70, opacity: 0.5 }} aria-hidden />
              <div className="flex items-center gap-3">
                <BrandMark logo={identity.logo} monogram={identity.monogram} />
                <div>
                  <p className="font-display font-bold">{identity.doctorName}</p>
                  <p className="text-xs text-aqua-300">{identity.doctorRole}</p>
                </div>
              </div>
              {site.global.cta?.lines[0] ? <p className="mt-5 text-sm leading-7 text-white/75">{site.global.cta.lines[0]}</p> : null}
              {contact.whatsappDigits ? (
                <a href={whatsappLink(contact.whatsappDigits, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua btn--sm mt-5 w-full">
                  <span className="btn__icon">
                    <WhatsAppIcon width={15} height={15} />
                  </span>
                  {site.global.cta?.whatsappLabel || "WhatsApp"}
                </a>
              ) : null}
            </div>
            {related.length ? (
              <div>
                <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                  <span className="h-4 w-1 rounded-full bg-aqua-500" aria-hidden />
                  {ui["common.related"]}
                </h2>
                <div className="space-y-3">
                  {related.map((a, i) => (
                    <ArticleRow key={a.slug} article={a} locale={locale} labels={labels} delay={i * 80} />
                  ))}
                </div>
              </div>
            ) : null}
            <Link href={localizeHref("/articles", locale)} className="link-arrow">
              <Arrow size={16} className="rotate-180" />
              {ui["common.backToArticles"]}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
