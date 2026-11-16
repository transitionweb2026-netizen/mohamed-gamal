import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { photos } from "@/content/media";
import { resolveLocale } from "@/i18n/dictionaries";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { ServiceCard, ServiceFeatureCard } from "@/components/cards/service-cards";
import { ProcessTimeline } from "@/components/sections/process-steps";
import { FaqSection } from "@/components/sections/faq-section";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.services, description: t.heroes.services.subtitle };
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { locale, t } = await resolveLocale(params);
  const s = t.servicesPage;
  const main = t.services.slice(0, 3);
  const others = t.services.slice(3);

  return (
    <>
      {/* 1 ─ Hero */}
      <PageHero locale={locale} t={t} photo="gymStretch" copy={t.heroes.services} crumb={t.nav.services} />

      {/* 2 ─ Introduction */}
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="start">
            <span className="eyebrow">{s.intro.eyebrow}</span>
            <h2 className="h-section mt-4">{s.intro.title}</h2>
            <div className="lead mt-5 space-y-4">
              {s.intro.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {s.intro.highlights.map((h, i) => (
                <li key={h.title} className={`lg ${i === 1 ? "lg--ink" : ""} lg--sm lg-hover group p-4`}>
                  <span className={`icon-tile icon-tile--sm ${i === 1 ? "" : "icon-tile--ink"}`}>
                    <Icon name={h.icon} size={18} />
                  </span>
                  <p className="mt-3 font-display font-bold">{h.title}</p>
                  <p className={`mt-1 text-sm ${i === 1 ? "text-white/70" : "text-ink-900/65"}`}>{h.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto grid w-full max-w-xl grid-cols-[1.1fr_0.9fr] gap-4 lg:max-w-none" data-reveal="end">
            <div className="deco-rings absolute -z-[1]" style={{ width: 240, insetInlineStart: -60, top: -50 }} aria-hidden />
            <div className="lg row-span-2 p-2">
              <div className="img-frame parallax-img relative h-full min-h-[340px] rounded-[20px]">
                <Image src={photos.ankleTable.src} alt={photos.ankleTable.alt[locale]} fill sizes="(min-width: 1024px) 320px, 55vw" className="object-cover" />
              </div>
            </div>
            <div className="lg lg--ink p-2">
              <div className="img-frame relative aspect-square rounded-[18px]">
                <Image src={photos.kneeTape.src} alt={photos.kneeTape.alt[locale]} fill sizes="260px" className="object-cover" />
              </div>
            </div>
            <div className="lg lg--aqua flex flex-col justify-center p-5">
              <span className="icon-tile icon-tile--ink icon-tile--sm">
                <Sparkles size={18} aria-hidden />
              </span>
              <p className="mt-3 font-display text-lg font-bold leading-snug">{t.home.heroBadges[0]}</p>
              <p className="mt-1 text-sm text-ink-900/65">{t.home.heroBadges[1]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ─ Main treatment services */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={s.main.eyebrow} title={s.main.title} text={s.main.text} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {main.map((svc, i) => (
              <ServiceFeatureCard key={svc.slug} service={svc} locale={locale} delay={i * 110} />
            ))}
          </div>
        </div>
      </section>

      {/* 4 ─ Individual service cards */}
      <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
        <div className="container-x">
          <SectionHeading eyebrow={s.all.eyebrow} title={s.all.title} text={s.all.text} align="center" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((svc, i) => (
              <ServiceCard key={svc.slug} service={svc} index={i + 4} delay={(i % 3) * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* 5 ─ Conditions we treat */}
      <section className="section bg-ink on-dark">
        <div className="orb float-slow" style={{ width: 480, height: 480, insetInlineStart: "-10%", bottom: "-10%", opacity: 0.35 }} aria-hidden />
        <div className="container-x">
          <SectionHeading eyebrow={s.conditions.eyebrow} title={s.conditions.title} text={s.conditions.text} />
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.conditions.map((c, i) => {
              const img = photos[c.photo];
              return (
                <li key={c.id} className="lg lg--deep lg-hover group flex flex-col overflow-hidden p-2.5" data-reveal style={{ "--rd": `${(i % 3) * 100}ms` } as React.CSSProperties}>
                  <div className="img-frame img-zoom relative aspect-[16/8] rounded-[20px]">
                    <Image src={img.src} alt={img.alt[locale]} fill sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                    <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, transparent 30%, rgb(0 22 28 / 0.85))" }} aria-hidden />
                    <div className="absolute inset-x-4 bottom-3 z-[2] flex items-center gap-3">
                      <span className="icon-tile icon-tile--sm">
                        <Icon name={c.icon} size={18} />
                      </span>
                      <h3 className="text-lg font-bold text-white">{c.region}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                    <p className="text-sm leading-7 text-white/72">{c.text}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {c.items.map((item) => (
                        <li key={item} className="chip chip--dark">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 6 ─ Treatment process */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={s.process.eyebrow} title={s.process.title} align="center" />
          <div className="lg lg--ink mt-12 overflow-hidden px-4 py-10 sm:px-8 lg:py-14">
            <div className="orb" style={{ width: 400, height: 400, insetInlineEnd: "-10%", top: "-20%", opacity: 0.4 }} aria-hidden />
            <ProcessTimeline steps={t.process} />
          </div>
        </div>
      </section>

      {/* 7 ─ Why our approach is different */}
      <section className="section bg-snow">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div data-reveal>
              <span className="eyebrow">{s.approach.eyebrow}</span>
              <h2 className="h-section mt-4">{s.approach.title}</h2>
            </div>
            <div className="lg lg--aqua mt-8 overflow-hidden p-7 sm:p-9" data-reveal="scale">
              <p className="font-display text-xl font-bold leading-relaxed text-ink-900 sm:text-2xl">{s.approach.statement}</p>
              <p className="mt-5 flex items-center gap-3 text-sm font-semibold text-ink-900/70">
                <span className="h-px w-10 bg-ink-900" aria-hidden />
                {t.doctor.name}
              </p>
            </div>
          </div>
          <ol className="space-y-4">
            {s.approach.items.map((item, i) => (
              <li key={item.title} className="lg lg-hover group grid grid-cols-[auto_1fr] items-start gap-5 p-6 sm:p-7" data-reveal style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}>
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

      {/* 8 ─ FAQ */}
      <FaqSection t={t} eyebrow={s.faq.eyebrow} title={s.faq.title} items={s.faq.items} className="bg-ice" />
    </>
  );
}
