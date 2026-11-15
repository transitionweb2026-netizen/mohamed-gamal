import Image from "next/image";
import { Phone, Sparkles } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/config/site";
import { photos } from "@/content/media";
import type { Dictionary } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

/**
 * The one shared CTA rendered immediately before the footer on every page
 * (mounted once in app/[lang]/layout.tsx). The card straddles the light
 * page and the teal footer.
 */
export function GlobalCta({ t, locale }: { t: Dictionary; locale: Locale }) {
  const img = photos.armRaise;
  return (
    <section className="cta-section" aria-labelledby="global-cta-title">
      <div className="container-x">
        <div className="lg lg--ink cta-card" data-reveal="scale">
          {/* Ambient light & geometry inside the glass */}
          <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden>
            <div className="orb float-slow" style={{ width: 420, height: 420, insetInlineStart: "-8%", top: "-30%", opacity: 0.55 }} />
            <div className="orb float-slower" style={{ width: 300, height: 300, insetInlineStart: "40%", bottom: "-40%", opacity: 0.4 }} />
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage: "radial-gradient(rgb(73 217 244 / 0.25) 1px, transparent 1.2px)",
                backgroundSize: "20px 20px",
                maskImage: "linear-gradient(90deg, #000, transparent 60%)",
              }}
            />
          </div>

          <div className="grid items-stretch lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative z-[1] p-7 sm:p-10 lg:p-14">
              <span className="eyebrow eyebrow--light">{t.cta.eyebrow}</span>
              <h2 id="global-cta-title" className="mt-4 max-w-xl text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold text-white">
                {t.cta.title}
              </h2>
              <div className="mt-5 space-y-2 text-white/80">
                {t.cta.lines.map((line) => (
                  <p key={line} className="flex items-start gap-3">
                    <span className="mt-[0.7em] h-1.5 w-1.5 flex-none rotate-45 bg-aqua-500 shadow-[0_0_10px_#49D9F4]" aria-hidden />
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={whatsappHref(t.cta.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua">
                  <span className="btn__icon">
                    <WhatsAppIcon width={18} height={18} />
                  </span>
                  {t.cta.whatsapp}
                </a>
                <a href={telHref} className="btn btn--glass">
                  <span className="btn__icon">
                    <Phone size={17} aria-hidden />
                  </span>
                  {t.cta.call}
                </a>
              </div>
              <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
                <span className="dot-live" aria-hidden />
                {t.cta.note}
                <a href={telHref} dir="ltr" className="font-display font-semibold text-aqua-300 hover:text-aqua-500">
                  {siteConfig.phone.display}
                </a>
              </p>
            </div>

            <div className="relative min-h-[280px] p-3 sm:min-h-[340px] lg:p-4 lg:ps-0">
              <div className="img-frame relative h-full min-h-[260px] rounded-[26px]">
                <Image src={img.src} alt={img.alt[locale]} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover object-[50%_30%]" />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(200deg, rgb(73 217 244 / 0.25), transparent 45%, rgb(0 41 51 / 0.55))" }}
                  aria-hidden
                />
              </div>
              <div className="lg lg--deep lg--sm absolute bottom-8 flex items-center gap-3 px-4 py-3 float-slow" style={{ insetInlineStart: "1.75rem" }}>
                <span className="icon-tile icon-tile--sm">
                  <Sparkles size={18} aria-hidden />
                </span>
                <span className="text-sm font-semibold">{t.home.heroBadges[0]}</span>
              </div>
              <div
                className="deco-rings pointer-events-none absolute hidden lg:block"
                style={{ width: 140, top: -30, insetInlineEnd: -30, opacity: 0.7 }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
