import Link from "next/link";
import { ArrowUp, Clock3, MapPin, Phone } from "lucide-react";
import { siteConfig, telHref, whatsappHref } from "@/config/site";
import type { Dictionary } from "@/content/types";
import { localizeHref, type Locale } from "@/i18n/config";
import { BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { RichText } from "@/components/ui/rich-text";
import { SocialLinks } from "@/components/ui/social-links";
import type { NavItem } from "./navbar";

export function Footer({ t, locale, items }: { t: Dictionary; locale: Locale; items: NavItem[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer on-dark">
      <span className="footer-watermark" aria-hidden>
        {t.doctor.monogram}
      </span>

      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-12 pb-14 pt-16 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr] lg:gap-10">
        <div className="col-span-2 max-w-sm lg:col-span-1">
          <Link href={localizeHref("/", locale)} className="brand !p-0 text-white">
            <BrandMark monogram={t.doctor.monogram} />
            <span className="brand-text">
              <strong>{t.doctor.name}</strong>
              <small>{t.doctor.tagline}</small>
            </span>
          </Link>
          <p className="mt-6 text-[0.95rem] leading-8">{t.footer.about}</p>
          <SocialLinks className="mt-7" />
        </div>

        <FooterCol title={t.footer.quickLinks}>
          {items.map((item) => (
            <li key={item.href}>
              <Link href={localizeHref(item.href, locale)} className="footer-link">
                {item.label}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title={t.footer.services}>
          {t.services.slice(0, 6).map((s) => (
            <li key={s.slug}>
              <Link href={localizeHref(`/services#${s.slug}`, locale)} className="footer-link">
                {s.title}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title={t.footer.contact} wide>
          <li>
            <a href={telHref} className="group flex items-center gap-3 py-1.5">
              <span className="icon-tile icon-tile--glass icon-tile--sm">
                <Phone size={16} aria-hidden />
              </span>
              <span>
                <span className="block text-xs text-aqua-300">{t.footer.phone}</span>
                <span dir="ltr" className="font-display font-semibold text-white transition-colors group-hover:text-aqua-300">
                  {siteConfig.phone.display}
                </span>
              </span>
            </a>
          </li>
          <li>
            <a href={whatsappHref(t.cta.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-1.5">
              <span className="icon-tile icon-tile--glass icon-tile--sm">
                <WhatsAppIcon width={16} height={16} />
              </span>
              <span>
                <span className="block text-xs text-aqua-300">{t.footer.whatsapp}</span>
                <span className="font-display font-semibold text-white transition-colors group-hover:text-aqua-300">{t.cta.whatsapp}</span>
              </span>
            </a>
          </li>
          <li className="flex items-center gap-3 py-1.5">
            <span className="icon-tile icon-tile--glass icon-tile--sm">
              <MapPin size={16} aria-hidden />
            </span>
            <span className="text-sm">
              <RichText text={t.footer.address} />
            </span>
          </li>
          <li className="flex items-center gap-3 py-1.5">
            <span className="icon-tile icon-tile--glass icon-tile--sm">
              <Clock3 size={16} aria-hidden />
            </span>
            <span className="text-sm">
              <RichText text={t.footer.hours} />
            </span>
          </li>
        </FooterCol>
      </div>

      <div className="border-t border-aqua-500/15">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-sm sm:flex-row">
          <p>
            © {year} {t.doctor.name}. {t.footer.rights}
          </p>
          <a href="#top" className="group inline-flex items-center gap-3 text-white/80 transition-colors hover:text-aqua-300">
            {t.footer.backToTop}
            <span className="icon-tile icon-tile--glass icon-tile--sm transition-transform group-hover:-translate-y-1">
              <ArrowUp size={16} aria-hidden />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 lg:col-span-1" : ""}>
      <h2 className="flex items-center gap-3 text-base font-semibold text-white">
        <span className="h-4 w-1 rounded-full bg-aqua-500 shadow-[0_0_10px_#49D9F4]" aria-hidden />
        {title}
      </h2>
      <ul className="mt-5 space-y-1.5">{children}</ul>
    </div>
  );
}
