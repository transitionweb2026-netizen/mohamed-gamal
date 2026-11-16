import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, LayoutGrid } from "lucide-react";
import { photos } from "@/content/media";
import { localizeHref } from "@/i18n/config";
import { resolveLocale } from "@/i18n/dictionaries";
import { articleLabels, toExplorerItems, toGalleryVideos, videoLabels } from "@/lib/content";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { Arrow } from "@/components/ui/brand";
import { RichText } from "@/components/ui/rich-text";
import { ServiceMiniCard } from "@/components/cards/service-cards";
import { ArticleCard, ArticleRow } from "@/components/cards/article-cards";
import { VideoGallery } from "@/components/video/video-gallery";
import { StatsBand } from "@/components/sections/stats-band";
import { ProcessRow } from "@/components/sections/process-steps";
import { SpecialtyExplorer } from "@/components/sections/specialty-explorer";
import { TestimonialCards } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { locale, t } = await resolveLocale(params);
  const h = t.home;
  const [lead, ...rest] = t.services;
  const leadImg = photos[lead.photo];

  return (
    <>
      {/* 1 ─ Hero */}
      <PageHero
        locale={locale}
        t={t}
        photo="legRaiseTable"
        copy={t.heroes.home}
        variant="home"
        actions={
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={localizeHref("/contact#booking", locale)} className="btn btn--aqua btn--pulse">
              <span className="btn__icon">
                <CalendarCheck size={17} aria-hidden />
              </span>
              {h.heroActions.primary}
            </Link>
            <Link href={localizeHref("/services", locale)} className="btn btn--glass">
              <span className="btn__icon">
                <LayoutGrid size={17} aria-hidden />
              </span>
              {h.heroActions.secondary}
            </Link>
          </div>
        }
        floating={
          <div className="hero-stack pointer-events-none absolute top-1/2 hidden -translate-y-1/2 xl:block" style={{ insetInlineEnd: "max(2.5rem, calc((100vw - 1280px) / 2 + 2.5rem))" }} aria-hidden>
            <div className="float-slow flex flex-col gap-4">
              <span className="hero-stack__line" />
              {h.heroBadges.map((b, i) => (
                <div key={b} className="hero-stack__item lg lg--deep lg--sm flex w-72 items-center gap-3 px-4 py-3.5" style={{ animationDelay: `${0.9 + i * 0.15}s` }}>
                  <span className="icon-tile icon-tile--sm">
                    <Icon name={(["Route", "TrendingUp", "House"] as const)[i]} size={18} />
                  </span>
                  <span className="text-sm font-semibold">{b}</span>
                  <span className="dot-live ms-auto" />
                </div>
              ))}
            </div>
          </div>
        }
      />

      {/* Kinetic services ticker */}
      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee__group">
              {t.services.map((svc) => (
                <span key={`${copy}-${svc.slug}`} className="marquee__item">
                  <Icon name={svc.icon} size={18} />
                  {svc.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 2 ─ Introduction */}
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none" data-reveal="start">
            <div className="deco-rings absolute -z-[1]" style={{ width: 260, insetInlineStart: -70, top: -60 }} aria-hidden />
            <div className="lg overflow-hidden p-2.5 lg:me-16">
              <div className="img-frame parallax-img relative aspect-[4/5] rounded-[22px]">
                <Image src={photos.bandFoot.src} alt={photos.bandFoot.alt[locale]} fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
              </div>
            </div>
            <div className="lg lg--ink absolute -bottom-8 w-[52%] p-2 max-sm:hidden" style={{ insetInlineEnd: 0 }}>
              <div className="img-frame relative aspect-[4/3] rounded-[18px]">
                <Image src={photos.kneeClose.src} alt={photos.kneeClose.alt[locale]} fill sizes="300px" className="object-cover" />
              </div>
            </div>
            <div className="lg lg--deep lg--sm absolute top-8 flex items-center gap-3 px-4 py-3 float-slow" style={{ insetInlineEnd: "-0.5rem" }}>
              <span className="brand-mark !h-10 !w-10 !rounded-xl !text-xs">{t.doctor.monogram}</span>
              <span>
                <span className="block font-display text-sm font-bold">{t.doctor.name}</span>
                <span className="block text-xs text-aqua-300">{t.doctor.tagline}</span>
              </span>
            </div>
          </div>

          <div data-reveal="end">
            <span className="eyebrow">{h.intro.eyebrow}</span>
            <h2 className="h-section mt-4">{h.intro.title}</h2>
            <div className="lead mt-5 space-y-4">
              {h.intro.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {h.intro.points.map((pt) => (
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
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link href={localizeHref("/about", locale)} className="btn btn--ink">
                <span className="btn__icon">
                  <Arrow size={17} />
                </span>
                {t.common.aboutDoctor}
              </Link>
              <div className="border-s-2 border-aqua-500 ps-4">
                <p className="font-display text-lg font-bold">{t.doctor.name}</p>
                <p className="text-sm text-ink-900/60">{h.intro.signatureRole}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ─ Key services (bento) */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading
            eyebrow={h.services.eyebrow}
            title={h.services.title}
            text={h.services.text}
            aside={
              <Link href={localizeHref("/services", locale)} className="btn btn--line">
                <span className="btn__icon">
                  <Arrow size={16} />
                </span>
                {t.common.allServices}
              </Link>
            }
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            <Link
              href={localizeHref(`/services#${lead.slug}`, locale)}
              className="lg lg--ink lg-hover group relative flex min-h-[420px] flex-col justify-end overflow-hidden p-3 md:col-span-2 lg:row-span-2"
              data-reveal="scale"
            >
              <div className="img-zoom absolute inset-0 -z-[1] overflow-hidden rounded-[inherit]">
                <Image src={leadImg.src} alt={leadImg.alt[locale]} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
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
                  {t.common.learnMore}
                  <Arrow size={16} />
                </span>
              </div>
            </Link>
            {rest.slice(0, 4).map((s, i) => (
              <ServiceMiniCard key={s.slug} service={s} locale={locale} cta={t.common.learnMore} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* 4 ─ Why choose */}
      <section className="section bg-ink on-dark">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div data-reveal>
              <span className="eyebrow">{h.why.eyebrow}</span>
              <h2 className="h-section mt-4">{h.why.title}</h2>
              <p className="lead mt-4">{h.why.text}</p>
            </div>
            <div className="lg lg--deep mt-8 p-2.5" data-reveal style={{ "--rd": "120ms" } as React.CSSProperties}>
              <div className="img-frame img-tint parallax-img relative aspect-[16/10] rounded-[20px]">
                <Image src={photos.shoulderHands.src} alt={photos.shoulderHands.alt[locale]} fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
              </div>
            </div>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {h.why.items.map((item, i) => (
              <li
                key={item.title}
                className={`lg lg--deep lg-hover group flex flex-col p-7 ${i % 2 === 1 ? "sm:translate-y-10" : ""}`}
                data-reveal
                style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}
              >
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

      {/* 5 ─ Treatment specialties */}
      <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
        <div className="container-x">
          <SectionHeading eyebrow={h.specialties.eyebrow} title={h.specialties.title} text={h.specialties.text} />
          <SpecialtyExplorer groups={toExplorerItems(t, locale)} cta={t.common.allServices} href={localizeHref("/services", locale)} hint={t.common.explorerHint} />
        </div>
      </section>

      {/* 6 ─ Statistics */}
      <StatsBand eyebrow={h.stats.eyebrow} title={h.stats.title} stats={t.stats} photo="kneeHands" locale={locale} />

      {/* 7 ─ Treatment journey */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={h.journey.eyebrow} title={h.journey.title} text={h.journey.text} align="center" />
          <ProcessRow steps={t.process} />
        </div>
      </section>

      {/* 8 ─ Featured videos */}
      <section className="section bg-ink on-dark">
        <div className="orb float-slow" style={{ width: 520, height: 520, insetInlineEnd: "-10%", top: "10%", opacity: 0.35 }} aria-hidden />
        <div className="container-x">
          <SectionHeading
            eyebrow={h.videos.eyebrow}
            title={h.videos.title}
            aside={
              <Link href={localizeHref("/videos", locale)} className="btn btn--glass">
                <span className="btn__icon">
                  <Arrow size={16} />
                </span>
                {t.common.allVideos}
              </Link>
            }
          />
          <div className="mt-12">
            <VideoGallery videos={toGalleryVideos(t.videos.slice(0, 3), locale)} labels={videoLabels(t)} dark />
          </div>
        </div>
      </section>

      {/* 9 ─ Featured articles */}
      <section className="section bg-snow">
        <div className="container-x">
          <SectionHeading
            eyebrow={h.articles.eyebrow}
            title={h.articles.title}
            aside={
              <Link href={localizeHref("/articles", locale)} className="btn btn--line">
                <span className="btn__icon">
                  <Arrow size={16} />
                </span>
                {t.common.allArticles}
              </Link>
            }
          />
          {/* Featured card + five rows that together match its height. */}
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <ArticleCard article={t.articles[0]} locale={locale} labels={articleLabels(t)} tone="ink" />
            <div className="grid gap-4 lg:grid-rows-5">
              {t.articles.slice(1, 6).map((a, i) => (
                <ArticleRow key={a.slug} article={a} locale={locale} labels={articleLabels(t)} delay={i * 90} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10 ─ Testimonials */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={h.testimonials.eyebrow} title={h.testimonials.title} text={h.testimonials.text} align="center" />
          <TestimonialCards items={h.testimonials.items} />
        </div>
      </section>

      {/* 11 ─ FAQ */}
      <FaqSection t={t} eyebrow={h.faq.eyebrow} title={h.faq.title} text={h.faq.text} items={h.faq.items} />
      {/* 12 ─ Global CTA and 13 ─ Footer are rendered by the layout. */}
    </>
  );
}
