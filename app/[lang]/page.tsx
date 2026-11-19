import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import { siteHref } from "@/lib/cms/links";
import type { FeaturesView, HeadingCtaView, HeadingOnlyView, HeroView, HomeIntroView, SpecialtiesView, StatsSectionView } from "@/lib/cms/view";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { Arrow, BrandMark } from "@/components/ui/brand";
import { CmsImage } from "@/components/ui/cms-image";
import { RichText } from "@/components/ui/rich-text";
import { ServiceMiniCard } from "@/components/cards/service-cards";
import { ArticleCard, ArticleRow } from "@/components/cards/article-cards";
import { VideoGallery } from "@/components/video/video-gallery";
import { StatsBand } from "@/components/sections/stats-band";
import { ProcessRow } from "@/components/sections/process-steps";
import { SpecialtyExplorer } from "@/components/sections/specialty-explorer";
import { TestimonialCards } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";
import { renderSections } from "@/components/sections/render";
import { articleLabels, explorerItems, videoLabels, youtubeChannel } from "@/components/sections/labels";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { site } = await siteFor(params);
  return pageMetadata(site, site.pages.home, "/");
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { locale, site } = await siteFor(params);
  const { ui, identity } = site;
  const href = (h: string) => siteHref(h, locale);
  const [lead, ...rest] = site.services;
  const featuredVideos = (site.videos.some((v) => v.featured) ? site.videos.filter((v) => v.featured) : site.videos).slice(0, 3);

  return renderSections(site.pages.home, {
    hero: (hero: HeroView) => <PageHero site={site} hero={hero} variant="home" />,

    ticker: () =>
      site.services.length ? (
        <div className="marquee" aria-hidden>
          <div className="marquee__track">
            {[0, 1].map((copy) => (
              <div key={copy} className="marquee__group">
                {site.services.map((svc) => (
                  <span key={`${copy}-${svc.slug}`} className="marquee__item">
                    <Icon name={svc.icon} size={18} />
                    {svc.title}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null,

    intro: (c: HomeIntroView) => (
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none" data-reveal="start">
            <div className="deco-rings absolute -z-[1]" style={{ width: 260, insetInlineStart: -70, top: -60 }} aria-hidden />
            <div className="lg overflow-hidden p-2.5 lg:me-16">
              <div className="img-frame parallax-img relative aspect-[4/5] rounded-[22px]">
                <CmsImage img={c.image} sizes="(min-width: 1024px) 520px, 100vw" />
              </div>
            </div>
            {c.secondaryImage ? (
              <div className="lg lg--ink absolute -bottom-8 w-[52%] p-2 max-sm:hidden" style={{ insetInlineEnd: 0 }}>
                <div className="img-frame relative aspect-[4/3] rounded-[18px]">
                  <CmsImage img={c.secondaryImage} sizes="300px" />
                </div>
              </div>
            ) : null}
            <div className="lg lg--deep lg--sm absolute top-8 flex items-center gap-3 px-4 py-3 float-slow" style={{ insetInlineEnd: "-0.5rem" }}>
              <BrandMark logo={identity.logo} monogram={identity.monogram} className="!h-10 !w-10" />
              <span>
                <span className="block font-display text-sm font-bold">{identity.doctorName}</span>
                <span className="block text-xs text-aqua-300">{identity.tagline}</span>
              </span>
            </div>
          </div>

          <div data-reveal="end">
            {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
            <h2 className="h-section mt-4">{c.title}</h2>
            <div className="lead mt-5 space-y-4">
              {c.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {c.points.length ? (
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {c.points.map((pt) => (
                  <li key={pt.title} className="lg lg--sm lg-hover group flex items-start gap-3 p-4 sm:block">
                    <span className="icon-tile icon-tile--sm icon-tile--ink">
                      <Icon name={pt.icon} size={18} />
                    </span>
                    <span className="block">
                      <span className="block font-display font-bold sm:mt-3">{pt.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-900/65">{pt.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              {c.cta ? (
                <Link href={href(c.cta.href)} className="btn btn--ink">
                  <span className="btn__icon">
                    <Arrow size={17} />
                  </span>
                  {c.cta.label}
                </Link>
              ) : null}
              <div className="border-s-2 border-aqua-500 ps-4">
                <p className="font-display text-lg font-bold">{identity.doctorName}</p>
                <p className="text-sm text-ink-900/60">{c.signatureRole}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    services: (c: HeadingCtaView) =>
      lead ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading
              eyebrow={c.heading.eyebrow}
              title={c.heading.title}
              text={c.heading.text}
              aside={
                c.cta ? (
                  <Link href={href(c.cta.href)} className="btn btn--line">
                    <span className="btn__icon">
                      <Arrow size={16} />
                    </span>
                    {c.cta.label}
                  </Link>
                ) : null
              }
            />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
              <Link href={href(`/services#${lead.slug}`)} className="lg lg--ink lg-hover group relative flex min-h-[420px] flex-col justify-end overflow-hidden p-3 md:col-span-2 lg:row-span-2" data-reveal="scale">
                <div className="img-zoom absolute inset-0 -z-[1] overflow-hidden rounded-[inherit]">
                  <CmsImage img={lead.image} sizes="(min-width: 1024px) 640px, 100vw" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgb(0 41 51 / 0.05), rgb(0 41 51 / 0.35) 40%, rgb(0 22 28 / 0.92)), linear-gradient(200deg, rgb(73 217 244 / 0.3), transparent 50%)" }} />
                </div>
                <div className="lg lg--deep p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile">
                      <Icon name={lead.icon} size={22} />
                    </span>
                    <span className="chip chip--dark">01</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-bold sm:text-3xl">{lead.title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-white/78">{lead.summary}</p>
                  <span className="link-arrow link-arrow--light mt-5">
                    {ui["common.learnMore"]}
                    <Arrow size={16} />
                  </span>
                </div>
              </Link>
              {rest.slice(0, 4).map((s, i) => (
                <ServiceMiniCard key={s.slug} service={s} locale={locale} cta={ui["common.learnMore"]} delay={i * 90} />
              ))}
            </div>
          </div>
        </section>
      ) : null,

    why: (c: FeaturesView) => (
      <section className="section bg-ink on-dark">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div data-reveal>
              {c.heading.eyebrow ? <span className="eyebrow">{c.heading.eyebrow}</span> : null}
              <h2 className="h-section mt-4">{c.heading.title}</h2>
              {c.heading.text ? <p className="lead mt-4">{c.heading.text}</p> : null}
            </div>
            {c.image ? (
              <div className="lg lg--deep mt-8 p-2.5" data-reveal style={{ "--rd": "120ms" } as React.CSSProperties}>
                <div className="img-frame img-tint parallax-img relative aspect-[16/10] rounded-[20px]">
                  <CmsImage img={c.image} sizes="(min-width: 1024px) 520px, 100vw" />
                </div>
              </div>
            ) : null}
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {c.items.map((item, i) => (
              <li key={item.title + i} className={`lg lg--deep lg-hover group flex flex-col p-7 ${i % 2 === 1 ? "sm:translate-y-10" : ""}`} data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
                <div className="flex items-start justify-between">
                  <span className="icon-tile icon-tile--glass icon-tile--lg">
                    <Icon name={item.icon} size={26} />
                  </span>
                  <span className="num-outline text-6xl" dir="ltr">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-7 text-white/72">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ),

    specialties: (c: SpecialtiesView) =>
      site.conditions.length ? (
        <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} />
            <SpecialtyExplorer groups={explorerItems(site)} cta={c.cta?.label ?? ""} href={href(c.cta?.href ?? "/services")} hint={c.hint} />
          </div>
        </section>
      ) : null,

    stats: (c: StatsSectionView) => (site.stats.length ? <StatsBand eyebrow={c.eyebrow} title={c.title} stats={site.stats} image={c.image} /> : null),

    journey: (c: HeadingOnlyView) =>
      site.process.length ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} align="center" />
            <ProcessRow steps={site.process} />
          </div>
        </section>
      ) : null,

    videos: (c: HeadingCtaView) =>
      featuredVideos.length ? (
        <section className="section bg-ink on-dark">
          <div className="orb float-slow" style={{ width: 520, height: 520, insetInlineEnd: "-10%", top: "10%", opacity: 0.35 }} aria-hidden />
          <div className="container-x">
            <SectionHeading
              eyebrow={c.heading.eyebrow}
              title={c.heading.title}
              aside={
                c.cta ? (
                  <Link href={href(c.cta.href)} className="btn btn--glass">
                    <span className="btn__icon">
                      <Arrow size={16} />
                    </span>
                    {c.cta.label}
                  </Link>
                ) : null
              }
            />
            <div className="mt-12">
              <VideoGallery videos={featuredVideos} labels={videoLabels(site)} channel={youtubeChannel(site)} dark />
            </div>
          </div>
        </section>
      ) : null,

    articles: (c: HeadingCtaView) =>
      site.articles.length ? (
        <section className="section bg-snow">
          <div className="container-x">
            <SectionHeading
              eyebrow={c.heading.eyebrow}
              title={c.heading.title}
              aside={
                c.cta ? (
                  <Link href={href(c.cta.href)} className="btn btn--line">
                    <span className="btn__icon">
                      <Arrow size={16} />
                    </span>
                    {c.cta.label}
                  </Link>
                ) : null
              }
            />
            {/* Featured card + five rows that together match its height. */}
            <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <ArticleCard article={site.articles[0]} locale={locale} labels={articleLabels(site)} tone="ink" />
              <div className="grid gap-4 lg:grid-rows-5">
                {site.articles.slice(1, 6).map((a, i) => (
                  <ArticleRow key={a.slug} article={a} locale={locale} labels={articleLabels(site)} delay={i * 90} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null,

    testimonials: (c: HeadingOnlyView) =>
      site.testimonials.length ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} align="center" />
            <TestimonialCards items={site.testimonials} />
          </div>
        </section>
      ) : null,

    faq: (c: HeadingOnlyView) => (site.faqs.home.length ? <FaqSection site={site} heading={c.heading} items={site.faqs.home} /> : null),
  });
}
