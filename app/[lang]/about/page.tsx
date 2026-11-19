import type { Metadata } from "next";
import { Award, BadgeCheck, Briefcase, GraduationCap, Quote } from "lucide-react";
import { pageMetadata, siteFor } from "@/lib/cms/page";
import type { AboutIntroView, BioView, CredentialView, HeadingImageView, HeadingOnlyView, HeroView, PhilosophyView, StatsSectionView, ValuesView } from "@/lib/cms/view";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { CmsImage } from "@/components/ui/cms-image";
import { RichText } from "@/components/ui/rich-text";
import { DoctorVisual } from "@/components/sections/doctor-visual";
import { StatsBand } from "@/components/sections/stats-band";
import { renderSections } from "@/components/sections/render";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { site } = await siteFor(params);
  return pageMetadata(site, site.pages.about, "/about");
}

/** Dark credential cards (certifications, achievements). */
function DarkCredentials({ heading, items, icon }: { heading: HeadingOnlyView["heading"]; items: CredentialView[]; icon: "badge" | "award" }) {
  const Glyph = icon === "badge" ? BadgeCheck : Award;
  return (
    <section className="section bg-ink on-dark">
      <div className="container-x">
        <SectionHeading eyebrow={heading.eyebrow} title={heading.title} text={heading.text} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((c, i) => (
            <li key={i} className="lg lg--deep lg-hover group relative overflow-hidden p-6" data-reveal style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}>
              <span className="absolute top-0 h-16 w-16" style={{ insetInlineEnd: 0, background: "linear-gradient(225deg, rgb(73 217 244 / 0.55), transparent 60%)" }} aria-hidden />
              <span className="icon-tile icon-tile--glass">
                <Glyph size={22} aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-bold leading-snug">
                <RichText text={c.title} />
              </h3>
              {c.place ? (
                <p className="mt-2 text-sm text-white/70">
                  <RichText text={c.place} />
                </p>
              ) : null}
              {c.text ? (
                <p className="mt-2 text-sm leading-6 text-white/65">
                  <RichText text={c.text} />
                </p>
              ) : null}
              {c.period ? (
                <p className="mt-5 border-t border-aqua-500/20 pt-4 font-display text-sm font-semibold text-aqua-300">
                  <RichText text={c.period} />
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { locale, site } = await siteFor(params);
  const page = site.pages.about;
  const { identity, credentials } = site;

  return renderSections(page, {
    hero: (hero: HeroView) => <PageHero site={site} hero={hero} crumb={page.name} />,

    intro: (c: AboutIntroView) => (
      <section className="section bg-snow">
        <div className="container-x grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none" data-reveal="start">
            <div className="deco-rings absolute -z-[1]" style={{ width: 300, insetInlineEnd: -80, bottom: -60 }} aria-hidden />
            <DoctorVisual site={site} />
          </div>
          <div data-reveal="end">
            {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
            <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold">
              <span className="text-ink-gradient">{c.title}</span>
            </h2>
            <p className="mt-2 font-display text-lg font-semibold text-aqua-700">{identity.doctorRole}</p>
            <div className="lead mt-6 space-y-4">
              {c.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {c.highlights.length ? (
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {c.highlights.map((hl, i) => (
                  <li key={hl.title + i} className={`lg ${i === 1 ? "lg--ink" : ""} lg--sm lg-hover group p-4`}>
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
            ) : null}
          </div>
        </div>
      </section>
    ),

    bio: (c: BioView) => (
      <section className="section bg-ice">
        <div className={`container-x grid gap-12 lg:gap-16 ${c.quote ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          <div data-reveal>
            {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
            <h2 className="h-section mt-4">{c.title}</h2>
            <div className="mt-8 space-y-5 border-s-2 border-aqua-500/60 ps-6 text-[1.05rem] leading-9 text-ink-900/80">
              {c.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          </div>
          {c.quote ? (
            <figure className="lg lg--ink self-center overflow-hidden p-8 sm:p-10" data-reveal="scale">
              <div className="orb" style={{ width: 280, height: 280, insetInlineEnd: -80, top: -100, opacity: 0.55 }} aria-hidden />
              <span className="icon-tile icon-tile--lg">
                <Quote size={28} aria-hidden className="rtl:-scale-x-100" />
              </span>
              <blockquote className="mt-6 font-display text-xl font-semibold leading-relaxed sm:text-2xl">
                <RichText text={c.quote} />
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm text-aqua-300">
                <span className="h-px w-10 bg-aqua-500" aria-hidden />
                {identity.doctorName}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </section>
    ),

    education: (c: HeadingOnlyView) =>
      credentials.education.length ? (
        <section className="section bg-snow">
          <div className="container-x">
            <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} align="center" />
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {credentials.education.map((e, i) => (
                <li key={i} className={`lg ${i % 3 === 1 ? "lg--aqua" : ""} lg-hover group relative overflow-hidden p-7`} data-reveal style={{ "--rd": `${(i % 3) * 100}ms` } as React.CSSProperties}>
                  <span className="num-outline absolute -bottom-4 text-8xl opacity-40" style={{ insetInlineEnd: "1rem" }} aria-hidden dir="ltr">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="icon-tile icon-tile--ink icon-tile--lg">
                      <GraduationCap size={26} aria-hidden />
                    </span>
                    {e.period ? (
                      <span className="chip">
                        <RichText text={e.period} />
                      </span>
                    ) : null}
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
      ) : null,

    experience: (c: HeadingImageView) =>
      credentials.experience.length ? (
        <section className="section bg-ice">
          <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} />
              {c.image ? (
                <div className="lg mt-8 p-2.5 max-lg:hidden" data-reveal>
                  <div className="img-frame img-tint relative aspect-[4/3] rounded-[20px]">
                    <CmsImage img={c.image} sizes="440px" />
                  </div>
                </div>
              ) : null}
            </div>
            <ol className="timeline space-y-5">
              {credentials.experience.map((e, i) => (
                <li key={i} className="relative ps-16" data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
                  <span className="icon-tile icon-tile--ink absolute top-5" style={{ insetInlineStart: 0 }}>
                    <Briefcase size={20} aria-hidden />
                  </span>
                  <div className="lg lg-hover group p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-bold sm:text-xl">
                        <RichText text={e.title} />
                      </h3>
                      {e.period ? (
                        <span className="chip chip--solid">
                          <RichText text={e.period} />
                        </span>
                      ) : null}
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
      ) : null,

    certifications: (c: HeadingOnlyView) => (credentials.certification.length ? <DarkCredentials heading={c.heading} items={credentials.certification} icon="badge" /> : null),

    achievements: (c: HeadingOnlyView) => (credentials.achievement.length ? <DarkCredentials heading={c.heading} items={credentials.achievement} icon="award" /> : null),

    philosophy: (c: PhilosophyView) => (
      <section className="section bg-snow" style={{ "--snow-x": "0%" } as React.CSSProperties}>
        <div className={`container-x grid items-center gap-12 lg:gap-16 ${c.image ? "lg:grid-cols-[0.85fr_1.15fr]" : ""}`}>
          {c.image ? (
            <div className="lg relative p-2.5" data-reveal="start">
              <div className="img-frame parallax-img relative aspect-[4/5] rounded-[22px]">
                <CmsImage img={c.image} sizes="(min-width: 1024px) 460px, 100vw" />
              </div>
              {c.quote ? (
                <div className="lg lg--deep absolute inset-x-6 bottom-6 p-5">
                  <p className="font-display text-lg font-semibold leading-relaxed">{locale === "ar" ? `«${c.quote}»` : `“${c.quote}”`}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div>
            <div data-reveal>
              {c.eyebrow ? <span className="eyebrow">{c.eyebrow}</span> : null}
              <h2 className="h-section mt-4">{c.title}</h2>
            </div>
            <ul className="mt-10 space-y-4">
              {c.pillars.map((p, i) => (
                <li key={p.title + i} className="lg lg-hover group flex items-start gap-5 p-5 sm:p-6" data-reveal style={{ "--rd": `${i * 100}ms` } as React.CSSProperties}>
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
    ),

    values: (c: ValuesView) => (
      <section className="section bg-ice">
        <div className="container-x">
          <SectionHeading eyebrow={c.heading.eyebrow} title={c.heading.title} text={c.heading.text} align="center" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.items.map((v, i) => {
              const ink = i % 2 === 1;
              return (
                <li key={v.title + i} className={`lg ${ink ? "lg--ink" : ""} lg-hover group flex items-center gap-5 p-6`} data-reveal style={{ "--rd": `${(i % 3) * 90}ms` } as React.CSSProperties}>
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
    ),

    stats: (c: StatsSectionView) => (site.stats.length ? <StatsBand eyebrow={c.eyebrow} title={c.title} stats={site.stats} image={c.image} tone="ink" /> : null),
  });
}
