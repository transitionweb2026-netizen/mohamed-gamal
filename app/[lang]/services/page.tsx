import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import type { ApproachView, HeadingOnlyView, HeroView, ServicesIntroView } from "@/lib/cms/view";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { CmsImage } from "@/components/ui/cms-image";
import { RichText } from "@/components/ui/rich-text";
import { ServiceCard, ServiceFeatureCard } from "@/components/cards/service-cards";
import { ProcessTimeline } from "@/components/sections/process-steps";
import { FaqSection } from "@/components/sections/faq-section";
import { renderSections } from "@/components/sections/render";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { site } = await siteFor(params);
  return pageMetadata(site, site.pages.services, "/services");
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { site } = await siteFor(params);
  const page = site.pages.services;
  const main = site.services.filter((s) => s.featured);
  const others = site.services.filter((s) => !s.featured);

  return renderSections(page, {
    hero: (hero: HeroView) => <PageHero site={site} hero={hero} crumb={page.name} />,

    intro: (c: ServicesIntroView) => (
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="start">
            {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
            <h2 className="h-section mt-4">{c.title}</h2>
            <div className="lead mt-5 space-y-4">
              {c.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {c.highlights.length ? (
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {c.highlights.map((h, i) => (
                  <li key={h.title + i} className={`lg ${i === 1 ? "lg--ink" : ""} lg--sm lg-hover group p-4`}>
                    <span className={`icon-tile icon-tile--sm ${i === 1 ? "" : "icon-tile--ink"}`}>
                      <Icon name={h.icon} size={18} />
                    </span>
                    <p className="mt-3 font-display font-bold">{h.title}</p>
                    <p className={`mt-1 text-sm ${i === 1 ? "text-white/70" : "text-ink-900/65"}`}>{h.text}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="relative mx-auto grid w-full max-w-xl grid-cols-[1.1fr_0.9fr] gap-4 lg:max-w-none" data-reveal="end">
            <div className="deco-rings absolute -z-[1]" style={{ width: 240, insetInlineStart: -60, top: -50 }} aria-hidden />
            <div className="lg row-span-2 p-2">
              <div className="img-frame parallax-img relative h-full min-h-[340px] rounded-[20px]">
                <CmsImage img={c.image} sizes="(min-width: 1024px) 320px, 55vw" />
              </div>
            </div>
            <div className="lg lg--ink p-2">
              <div className="img-frame relative aspect-square rounded-[18px]">
                <CmsImage img={c.secondaryImage} sizes="260px" />
              </div>
            </div>
            <div className="lg lg--aqua flex flex-col justify-center p-5">
              <span className="icon-tile icon-tile--ink icon-tile--sm">
                <Sparkles size={18} aria-hidden />
              </span>
              <p className="mt-3 font-display text-lg font-bold leading-snug">{c.cardTitle}</p>
              <p className="mt-1 text-sm text-ink-900/65">{c.cardText}</p>
            </div>
          </div>
        </div>
      </section>
    ),

    main: (c: HeadingOnlyView) =>
      main.length ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {main.map((svc, i) => (
                <ServiceFeatureCard key={svc.slug} service={svc} delay={(i % 3) * 110} />
              ))}
            </div>
          </div>
        </section>
      ) : null,

    all: (c: HeadingOnlyView) =>
      others.length ? (
        <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} align="center" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((svc, i) => (
                <ServiceCard key={svc.slug} service={svc} index={main.length + i + 1} delay={(i % 3) * 90} />
              ))}
            </div>
          </div>
        </section>
      ) : null,

    conditions: (c: HeadingOnlyView) =>
      site.conditions.length ? (
        <section className="section bg-ink on-dark">
          <div className="orb float-slow" style={{ width: 480, height: 480, insetInlineStart: "-10%", bottom: "-10%", opacity: 0.35 }} aria-hidden />
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} />
            <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {site.conditions.map((cond, i) => (
                <li key={cond.slug} className="lg lg--deep lg-hover group flex flex-col overflow-hidden p-2.5" data-reveal style={{ "--rd": `${(i % 3) * 100}ms` } as React.CSSProperties}>
                  <div className="img-frame img-zoom relative aspect-[16/8] rounded-[20px]">
                    <CmsImage img={cond.image} sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw" />
                    <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, transparent 30%, rgb(0 22 28 / 0.85))" }} aria-hidden />
                    <div className="absolute inset-x-4 bottom-3 z-[2] flex items-center gap-3">
                      <span className="icon-tile icon-tile--sm">
                        <Icon name={cond.icon} size={18} />
                      </span>
                      <h3 className="text-lg font-bold text-white">{cond.region}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                    <p className="text-sm leading-7 text-white/72">{cond.text}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {cond.items.map((item) => (
                        <li key={item} className="chip chip--dark">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null,

    process: (c: HeadingOnlyView) =>
      site.process.length ? (
        <section className="section bg-ice">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} align="center" />
            <div className="lg lg--ink mt-12 overflow-hidden px-4 py-10 sm:px-8 lg:py-14">
              <div className="orb" style={{ width: 400, height: 400, insetInlineEnd: "-10%", top: "-20%", opacity: 0.4 }} aria-hidden />
              <ProcessTimeline steps={site.process} />
            </div>
          </div>
        </section>
      ) : null,

    approach: (c: ApproachView) => (
      <section className="section bg-snow">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div data-reveal>
              {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
              <h2 className="h-section mt-4">{c.title}</h2>
            </div>
            {c.statement ? (
              <div className="lg lg--aqua mt-8 overflow-hidden p-7 sm:p-9" data-reveal="scale">
                <p className="font-display text-xl font-bold leading-relaxed text-ink-900 sm:text-2xl">{c.statement}</p>
                <p className="mt-5 flex items-center gap-3 text-sm font-semibold text-ink-900/70">
                  <span className="h-px w-10 bg-ink-900" aria-hidden />
                  {site.identity.doctorName}
                </p>
              </div>
            ) : null}
          </div>
          <ol className="space-y-4">
            {c.items.map((item, i) => (
              <li key={item.title + i} className="lg lg-hover group grid grid-cols-[auto_1fr] items-start gap-5 p-6 sm:p-7" data-reveal style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}>
                <span className="icon-tile icon-tile--ink icon-tile--lg">
                  <Icon name={item.icon} size={26} />
                </span>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold sm:text-xl">{item.title}</h3>
                    <span className="num-outline text-4xl" dir="ltr">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 leading-7 text-ink-900/70">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),

    faq: (c: HeadingOnlyView) => (site.faqs.services.length ? <FaqSection site={site} heading={c.heading} items={site.faqs.services} className="bg-ice" /> : null),
  });
}
