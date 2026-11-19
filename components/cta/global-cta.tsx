import Image from "next/image";
import { Phone, Sparkles } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/cms/links";
import type { SiteView } from "@/lib/cms/view";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

/**
 * The one shared CTA rendered immediately before the footer on every page
 * (mounted once in app/[lang]/layout.tsx; CMS: Global call to action). The
 * card straddles the light page and the teal footer.
 */
export function GlobalCta({ site }: { site: SiteView }) {
  const cta = site.global.cta;
  if (!cta) return null;
  const { contact } = site;
  const img = cta.image;
  const showWhatsapp = cta.showWhatsapp && !!contact.whatsappDigits;
  const showCall = cta.showCall && contact.phones.length > 0;

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
              style={{ backgroundImage: "radial-gradient(rgb(73 217 244 / 0.25) 1px, transparent 1.2px)", backgroundSize: "20px 20px", maskImage: "linear-gradient(90deg, #000, transparent 60%)" }}
            />
          </div>

          <div className={`grid items-stretch ${img ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
            <div className="relative z-[1] p-7 sm:p-10 lg:p-14">
              {cta.eyebrow ? <span className="eyebrow eyebrow--light">{cta.eyebrow}</span> : null}
              <h2 id="global-cta-title" className="mt-4 max-w-xl text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold text-white">
                {cta.title}
              </h2>
              {cta.lines.length ? (
                <div className="mt-5 space-y-2 text-white/80">
                  {cta.lines.map((line) => (
                    <p key={line} className="flex items-start gap-3">
                      <span className="mt-[0.7em] h-1.5 w-1.5 flex-none rotate-45 bg-aqua-500 shadow-[0_0_10px_#49D9F4]" aria-hidden />
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
              {showWhatsapp || showCall ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {showWhatsapp ? (
                    <a href={whatsappLink(contact.whatsappDigits, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua">
                      <span className="btn__icon">
                        <WhatsAppIcon width={18} height={18} />
                      </span>
                      {cta.whatsappLabel}
                    </a>
                  ) : null}
                  {showCall ? (
                    <a href={telLink(contact.phones[0].digits)} className="btn btn--glass">
                      <span className="btn__icon">
                        <Phone size={17} aria-hidden />
                      </span>
                      {cta.callLabel}
                    </a>
                  ) : null}
                </div>
              ) : null}
              {contact.phones.length ? (
                <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
                  <span className="dot-live" aria-hidden />
                  {cta.note}
                  {contact.phones.map((p, i) => (
                    <span key={p.digits} className="inline-flex items-center gap-2">
                      {i > 0 ? <span className="h-1 w-1 rotate-45 bg-aqua-500" aria-hidden /> : null}
                      <a href={telLink(p.digits)} dir="ltr" className="font-display font-semibold text-aqua-300 transition-colors hover:text-aqua-500">
                        {p.display}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>

            {img ? (
              <div className="relative min-h-[280px] p-3 sm:min-h-[340px] lg:p-4 lg:ps-0">
                <div className="img-frame parallax-img relative h-full min-h-[260px] rounded-[26px]">
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" style={{ objectPosition: img.position || "50% 30%" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(200deg, rgb(73 217 244 / 0.25), transparent 45%, rgb(0 41 51 / 0.55))" }} aria-hidden />
                </div>
                {cta.badge ? (
                  <div className="lg lg--deep lg--sm absolute bottom-8 flex items-center gap-3 px-4 py-3 float-slow" style={{ insetInlineStart: "1.75rem" }}>
                    <span className="icon-tile icon-tile--sm">
                      <Sparkles size={18} aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{cta.badge}</span>
                  </div>
                ) : null}
                <div className="deco-rings pointer-events-none absolute hidden lg:block" style={{ width: 140, top: -30, insetInlineEnd: -30, opacity: 0.7 }} aria-hidden />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
