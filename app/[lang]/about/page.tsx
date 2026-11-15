import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Briefcase, GraduationCap, Quote } from "lucide-react";
import { photos } from "@/content/media";
import { resolveLocale } from "@/i18n/dictionaries";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { RichText } from "@/components/ui/rich-text";
import { DoctorVisual } from "@/components/sections/doctor-visual";
import { StatsBand } from "@/components/sections/stats-band";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.about, description: t.heroes.about.subtitle };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { locale, t } = await resolveLocale(params);
  const a = t.about;

  return (
    <>
      {/* 1 ─ Hero */}
      <PageHero locale={locale} t={t} photo="kneeHands" copy={t.heroes.about} crumb={t.nav.about} />

      {/* 2 ─ Doctor introduction */}
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none" data-reveal="start">
            <div className="deco-rings absolute -z-[1]" style={{ width: 300, insetInlineEnd: -80, bottom: -60 }} aria-hidden />
            <DoctorVisual t={t} />
          </div>
          <div data-reveal="end">
            <span className="eyebrow">{a.intro.eyebrow}</span>
            <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold">
              <span className="text-ink-gradient">{a.intro.title}</span>
            </h2>
            <p className="mt-2 font-display text-lg font-semibold text-aqua-700">{t.doctor.role}</p>
            <div className="lead mt-6 space-y-4">
              {a.intro.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {a.intro.highlights.map((hl, i) => (
                <li key={hl.title} className={`lg ${i === 1 ? "lg--ink" : ""} lg--sm lg-hover group p-4`}>
                  <span className={`icon-tile icon-tile--sm ${i === 1 ? "" : "icon-tile--ink"}`}>
                    <Icon name={hl.icon} size={18} />
                  </span>
                  <p className={`mt-3 text-xs font-semibold ${i === 1 ? "text-aqua-300" : "text-aqua-700"}`}>{hl.title}</p>
                  <p className="mt-1 font-display text-sm font-bold">
                    <RichText text={hl.text} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3 ─ Professional biography */}
      <section className="section bg-ice">
        <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div data-reveal>
            <span className="eyebrow">{a.bio.eyebrow}</span>
            <h2 className="h-section mt-4">{a.bio.title}</h2>
            <div className="mt-8 space-y-5 border-s-2 border-aqua-500/60 ps-6 text-[1.05rem] leading-9 text-ink-900/80">
              {a.bio.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          </div>
          <figure className="lg lg--ink self-center overflow-hidden p-8 sm:p-10" data-reveal="scale">
            <div className="orb" style={{ width: 280, height: 280, insetInlineEnd: -80, top: -100, opacity: 0.55 }} aria-hidden />
            <span className="icon-tile icon-tile--lg">
              <Quote size={28} aria-hidden className="rtl:-scale-x-100" />
            </span>
            <blockquote className="mt-6 font-display text-xl font-semibold leading-relaxed sm:text-2xl">
              <RichText text={a.bio.quote} />
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm text-aqua-300">
              <span className="h-px w-10 bg-aqua-500" aria-hidden />
              {t.doctor.name}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 4 ─ Education & qualifications */}
      <section className="section bg-snow">
        <div className="container-x">
          <SectionHeading eyebrow={a.education.eyebrow} title={a.education.title} align="center" />
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {a.education.items.map((e, i) => (
              <li key={i} className={`lg ${i === 1 ? "lg--aqua" : ""} lg-hover group relative overflow-hidden p-7`} data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
                <span className="num-outline absolute -bottom-4 text-8xl opacity-40" style={{ insetInlineEnd: "1rem" }} aria-hidden dir="ltr">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="icon-tile icon-tile--ink icon-tile--lg">
                    <GraduationCap size={26} aria-hidden />
                  </span>
                  <span className="chip">
                    <RichText text={e.period} />
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold">
                  <RichText text={e.title} />
                </h3>
                <p className="mt-2 text-ink-900/70">
                  <RichText text={e.place} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5 ─ Professional experience */}
      <section className="section bg-ice">
        <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading eyebrow={a.experience.eyebrow} title={a.experience.title} />
            <div className="lg mt-8 p-2.5 max-lg:hidden" data-reveal>
              <div className="img-frame img-tint relative aspect-[4/3] rounded-[20px]">
                <Image src={photos.electro.src} alt={photos.electro.alt[locale]} fill sizes="440px" className="object-cover" />
              </div>
            </div>
          </div>
          <ol className="timeline space-y-5">
            {a.experience.items.map((e, i) => (
              <li key={i} className="relative ps-16" data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
                <span className="icon-tile icon-tile--ink absolute top-5" style={{ insetInlineStart: 0 }}>
                  <Briefcase size={20} aria-hidden />
                </span>
                <div className="lg lg-hover group p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold sm:text-xl">
                      <RichText text={e.title} />
                    </h3>
                    <span className="chip chip--solid">
                      <RichText text={e.period} />
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-aqua-700">
                    <RichText text={e.place} />
                  </p>
                  {e.text ? (
                    <p className="mt-3 leading-7 text-ink-900/70">
                      <RichText text={e.text} />
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 ─ Certifications & training */}
      <section className="section bg-ink on-dark">
        <div className="container-x">
          <SectionHeading eyebrow={a.certifications.eyebrow} title={a.certifications.title} text={a.certifications.text} />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.certifications.items.map((c, i) => (
              <li key={i} className="lg lg--deep lg-hover group relative overflow-hidden p-6" data-reveal style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}>
                <span
                  className="absolute top-0 h-16 w-16"
                  style={{ insetInlineEnd: 0, background: "linear-gradient(225deg, rgb(73 217 244 / 0.55), transparent 60%)" }}
                  aria-hidden
                />
                <span className="icon-tile icon-tile--glass">
                  <BadgeCheck size={22} aria-hidden />
                </span>
                <h3 className="mt-6 text-lg font-bold leading-snug">
                  <RichText text={c.title} />
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  <RichText text={c.issuer} />
                </p>
                <p className="mt-5 border-t border-aqua-500/20 pt-4 font-display text-sm font-semibold text-aqua-300">
                  <RichText text={c.year} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7 ─ Treatment philosophy */}
      <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg relative p-2.5" data-reveal="start">
            <div className="img-frame relative aspect-[4/5] rounded-[22px]">
              <Image src={photos.balanceBoard.src} alt={photos.balanceBoard.alt[locale]} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
            </div>
            <div className="lg lg--deep absolute inset-x-6 bottom-6 p-5">
              <p className="font-display text-lg font-semibold leading-relaxed">{locale === "ar" ? `«${a.philosophy.quote}»` : `“${a.philosophy.quote}”`}</p>
            </div>
          </div>
          <div>
            <div data-reveal>
              <span className="eyebrow">{a.philosophy.eyebrow}</span>
              <h2 className="h-section mt-4">{a.philosophy.title}</h2>
            </div>
            <ul className="mt-10 space-y-4">
              {a.philosophy.pillars.map((p, i) => (
                <li key={p.title} className="lg lg-hover group flex items-start gap-5 p-5 sm:p-6" data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
                  <span className="icon-tile icon-tile--lg">
                    <Icon name={p.icon} size={26} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold sm:text-xl">{p.title}</h3>
                    <p className="mt-1.5 leading-7 text-ink-900/70">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8 ─ Professional values */}
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={a.values.eyebrow} title={a.values.title} align="center" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.values.items.map((v, i) => {
              const ink = i === 1 || i === 3 || i === 5;
              return (
                <li key={v.title} className={`lg ${ink ? "lg--ink" : ""} lg-hover group flex items-center gap-5 p-6`} data-reveal style={{ "--rd": `${(i % 3) * 90}ms` } as React.CSSProperties}>
                  <span className={`icon-tile icon-tile--lg ${ink ? "" : "icon-tile--ink"}`}>
                    <Icon name={v.icon} size={26} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{v.title}</h3>
                    <p className={`mt-1 text-sm leading-6 ${ink ? "text-white/72" : "text-ink-900/70"}`}>{v.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 9 ─ Statistics */}
      <StatsBand eyebrow={a.stats.eyebrow} title={a.stats.title} stats={t.stats} tone="ink" />
    </>
  );
}
