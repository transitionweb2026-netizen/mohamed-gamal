import type { Metadata } from "next";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import type { ArticlesFeaturedView, HeadingOnlyView, HeroView } from "@/lib/cms/view";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArticleCard, FeaturedArticle } from "@/components/cards/article-cards";
import { renderSections } from "@/components/sections/render";
import { articleLabels } from "@/components/sections/labels";

export async function generateMetadata({ params }: PageProps<"/[lang]/articles">): Promise<Metadata> {
  const { site } = await siteFor(params);
  return pageMetadata(site, site.pages.articles, "/articles");
}

export default async function ArticlesPage({ params }: PageProps<"/[lang]/articles">) {
  const { locale, site } = await siteFor(params);
  const page = site.pages.articles;
  // The featured article (first in the list), then the six next articles.
  const [featured, ...rest] = site.articles;
  const secondary = rest.slice(0, 6);
  const labels = articleLabels(site);

  return renderSections(page, {
    hero: (hero: HeroView) => <PageHero site={site} hero={hero} crumb={page.name} />,

    featured: (c: ArticlesFeaturedView) =>
      featured ? (
        <section className="section bg-snow">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} />
            <div className="mt-12">
              <FeaturedArticle article={featured} locale={locale} labels={{ ...labels, featured: c.featuredLabel }} />
            </div>
          </div>
        </section>
      ) : null,

    // Six secondary articles — 3 × 2 desktop, 2 cols tablet, 1 col mobile.
    latest: (c: HeadingOnlyView) =>
      secondary.length ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {secondary.map((a, i) => (
                <ArticleCard
                  key={a.slug}
                  article={a}
                  locale={locale}
                  labels={labels}
                  // Checkerboard of cyan and teal-ink glass across the 3 × 2 grid.
                  tone={(Math.floor(i / 3) + (i % 3)) % 2 === 0 ? "aqua" : "ink"}
                  delay={(i % 3) * 100}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null,
  });
}
