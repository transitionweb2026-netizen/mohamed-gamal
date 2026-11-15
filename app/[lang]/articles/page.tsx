import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/dictionaries";
import { articleLabels } from "@/lib/content";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArticleCard, FeaturedArticle } from "@/components/cards/article-cards";

export async function generateMetadata({ params }: PageProps<"/[lang]/articles">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.articles, description: t.heroes.articles.subtitle };
}

export default async function ArticlesPage({ params }: PageProps<"/[lang]/articles">) {
  const { locale, t } = await resolveLocale(params);
  const p = t.articlesPage;
  // Exactly 1 featured + 6 secondary articles.
  const [featured, ...rest] = t.articles;
  const secondary = rest.slice(0, 6);
  const labels = articleLabels(t);

  return (
    <>
      {/* Hero */}
      <PageHero locale={locale} t={t} photo="shoulderAssess" copy={t.heroes.articles} crumb={t.nav.articles} />

      {/* Featured article */}
      <section className="section bg-snow">
        <div className="container-x">
          <SectionHeading eyebrow={p.intro.eyebrow} title={p.intro.title} text={p.intro.text} />
          <div className="mt-12">
            <FeaturedArticle article={featured} locale={locale} labels={{ ...labels, featured: p.featuredLabel }} />
          </div>
        </div>
      </section>

      {/* Six secondary articles — 3 × 2 desktop, 2 cols tablet, 1 col mobile */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={p.latest.eyebrow} title={p.latest.title} />
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
    </>
  );
}
