import type { Metadata } from "next";
import { Clock3, MapPin, Navigation, Phone } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/config/site";
import { resolveLocale } from "@/i18n/dictionaries";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Arrow } from "@/components/ui/brand";
import { socialIcons, socialNames, WhatsAppIcon } from "@/components/ui/brand-icons";
import { RichText } from "@/components/ui/rich-text";
import { ContactForm } from "@/components/contact/contact-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.contact, description: t.heroes.contact.subtitle };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { locale, t } = await resolveLocale(params);
  const c = t.contactPage;

  return (
    <>
      {/* 1 ─ Hero */}
      <PageHero locale={locale} t={t} photo="floorGuidance" copy={t.heroes.contact} crumb={t.nav.contact} />

      {/* 2–5 ─ Introduction + contact cards (phone, WhatsApp, location, hours) */}
      <section className="section bg-snow">
        <div className="container-x">
          <SectionHeading eyebrow={c.intro.eyebrow} title={c.intro.title} text={c.intro.text} />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Phone — electric cyan glass */}
            <a href={telHref} className="lg lg--aqua lg-hover group flex flex-col p-7 lg:col-span-2" data-reveal>
              <div className="flex items-center justify-between">
                <span className="icon-tile icon-tile--ink icon-tile--lg">
                  <Phone size={26} aria-hidden />
                </span>
                <span className="dot-live" aria-hidden />
              </div>
              <h3 className="mt-6 text-xl font-bold">{c.cards.phone.title}</h3>
              <p className="mt-1 text-ink-900/70">{c.cards.phone.text}</p>
              <p className="mt-5 font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold tracking-wide">
                <span dir="ltr" className="inline-block">
                  {siteConfig.phone.display}
                </span>
              </p>
              <span className="link-arrow mt-4">
                {c.cards.phone.action}
                <Arrow size={16} />
              </span>
            </a>

            {/* WhatsApp — teal ink glass */}
            <a
              href={whatsappHref(t.cta.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="lg lg--ink lg-hover group flex flex-col p-7 lg:col-span-2"
              data-reveal
              style={{ "--rd": "100ms" } as React.CSSProperties}
            >
              <div className="orb" style={{ width: 240, height: 240, insetInlineEnd: -60, top: -90, opacity: 0.5 }} aria-hidden />
              <span className="icon-tile icon-tile--lg">
                <WhatsAppIcon width={28} height={28} />
              </span>
              <h3 className="mt-6 text-xl font-bold">{c.cards.whatsapp.title}</h3>
              <p className="mt-1 text-white/72">{c.cards.whatsapp.text}</p>
              <span className="btn btn--aqua btn--sm mt-auto self-start">
                <span className="btn__icon">
                  <WhatsAppIcon width={15} height={15} />
                </span>
                {c.cards.whatsapp.action}
              </span>
            </a>

            {/* Location */}
            <div className="lg lg-hover group p-7 lg:col-span-2" data-reveal>
              <span className="icon-tile icon-tile--ink">
                <MapPin size={22} aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{c.cards.location.title}</h3>
              <p className="mt-1 text-sm text-ink-900/60">{c.cards.location.text}</p>
              <p className="mt-3 font-display font-semibold">
                <RichText text={c.cards.location.value} />
              </p>
            </div>

            {/* Hours */}
            <div className="lg lg-hover group p-7 lg:col-span-2" data-reveal style={{ "--rd": "100ms" } as React.CSSProperties}>
              <span className="icon-tile icon-tile--ink">
                <Clock3 size={22} aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{c.cards.hours.title}</h3>
              <p className="mt-1 text-sm text-ink-900/60">{c.cards.hours.text}</p>
              <p className="mt-3 font-display font-semibold">
                <RichText text={c.cards.hours.value} />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 ─ Social media */}
      <section className="section bg-ink on-dark">
        <div className="container-x">
          <SectionHeading eyebrow={c.socials.eyebrow} title={c.socials.title} text={c.socials.text} />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siteConfig.socials.map(({ platform, href }, i) => {
              const Glyph = socialIcons[platform];
              return (
                <li key={platform} data-reveal style={{ "--rd": `${i * 90}ms` } as React.CSSProperties}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="lg lg--deep lg-hover group flex items-center gap-4 p-5">
                    <span className="icon-tile icon-tile--lg">
                      <Glyph width={26} height={26} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-lg font-bold">{socialNames[platform]}</span>
                      <span className="block text-sm text-aqua-300">{c.socials.eyebrow}</span>
                    </span>
                    <Arrow size={18} className="text-aqua-400 transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 7–8 ─ Location / map + contact form */}
      <section id="booking" className="section bg-ice scroll-mt-24">
        <div className="container-x grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="lg p-6 sm:p-10" data-reveal="start">
            <span className="eyebrow">{c.form.eyebrow}</span>
            <h2 className="h-section mt-4">{c.form.title}</h2>
            <p className="lead mt-3">{c.form.text}</p>
            <div className="mt-8">
              <ContactForm labels={c.form} />
            </div>
          </div>

          <div className="lg lg--ink flex flex-col overflow-hidden p-2.5" data-reveal="end">
            {siteConfig.mapEmbedUrl ? (
              <iframe
                src={siteConfig.mapEmbedUrl}
                title={c.map.title}
                className="min-h-[360px] w-full flex-1 rounded-[22px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div
                className="relative grid min-h-[320px] flex-1 place-items-center overflow-hidden rounded-[22px]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 45%, rgb(73 217 244 / 0.25), transparent 60%), linear-gradient(rgb(73 217 244 / 0.12) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgb(73 217 244 / 0.12) 1px, transparent 1px) 0 0 / 32px 32px, #013846",
                }}
              >
                <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 400 400" preserveAspectRatio="none" fill="none" aria-hidden>
                  <path d="M-10 260 C 80 220, 150 300, 230 230 S 360 150, 420 190" stroke="#49D9F4" strokeWidth="6" strokeOpacity="0.35" />
                  <path d="M120 -10 C 140 120, 90 220, 160 420" stroke="#49D9F4" strokeWidth="3" strokeOpacity="0.25" />
                </svg>
                <div className="relative flex flex-col items-center px-6 text-center">
                  <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-aqua-500 text-ink-900 shadow-[0_0_40px_rgb(73_217_244/0.8)]">
                    <MapPin size={28} aria-hidden />
                    <span className="absolute -inset-2 animate-ping rounded-3xl border border-aqua-500/60" aria-hidden />
                  </span>
                  <p className="mt-6 max-w-xs text-sm leading-7 text-white/75">{c.map.pending}</p>
                </div>
              </div>
            )}
            <div className="p-5">
              <span className="eyebrow eyebrow--light">{c.map.eyebrow}</span>
              <h3 className="mt-2 text-xl font-bold">{c.map.title}</h3>
              <p className="mt-2 flex items-start gap-2 text-sm text-white/75">
                <Navigation size={16} className="mt-1 flex-none text-aqua-400" aria-hidden />
                <span>
                  <RichText text={c.cards.location.value} />
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
