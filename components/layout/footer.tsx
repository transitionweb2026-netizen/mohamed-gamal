import Link from "next/link";
import { ArrowUp, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { localizeHref } from "@/i18n/config";
import { isExternal, telLink, whatsappLink } from "@/lib/cms/links";
import type { SiteView } from "@/lib/cms/view";
import { BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { RichText } from "@/components/ui/rich-text";
import { SocialLinks } from "@/components/ui/social-links";

/** Site footer (CMS: Footer section, Navigation “show in footer”, Contact information). */
export function Footer({ site }: { site: SiteView }) {
  const { locale, identity, contact } = site;
  const f = site.global.footer;
  const year = new Date().getFullYear();
  const href = (h: string) => (isExternal(h) ? h : localizeHref(h, locale));
  const services = f?.showServices ? site.services.slice(0, Math.max(1, f.servicesCount || 6)) : [];

  return (
    <footer className="site-footer on-dark">
      <span className="footer-watermark" aria-hidden>
        {identity.monogram}
      </span>

      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-12 pb-14 pt-16 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr] lg:gap-10">
        <div className="col-span-2 max-w-sm lg:col-span-1">
          <Link href={localizeHref("/", locale)} className="brand !p-0 text-white">
            <BrandMark logo={identity.logo} monogram={identity.monogram} />
            <span className="brand-text">
              <strong>{identity.doctorName}</strong>
              <small>{identity.tagline}</small>
            </span>
          </Link>
          {f?.about ? <p className="mt-6 text-[0.95rem] leading-8">{f.about}</p> : null}
          <SocialLinks socials={site.socials} className="mt-7" />
        </div>

        {site.nav.footer.length ? (
          <FooterCol title={f?.quickLinksTitle ?? ""}>
            {site.nav.footer.map((item) => (
              <li key={item.key}>
                <Link href={href(item.href)} className="footer-link" {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterCol>
        ) : null}

        {services.length ? (
          <FooterCol title={f?.servicesTitle ?? ""}>
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={localizeHref(`/services#${s.slug}`, locale)} className="footer-link">
                  {s.title}
                </Link>
              </li>
            ))}
          </FooterCol>
        ) : null}

        <FooterCol title={f?.contactTitle ?? ""} wide>
          {contact.phones.length ? (
            <li className="flex items-center gap-3 py-1.5">
              <span className="icon-tile icon-tile--glass icon-tile--sm">
                <Phone size={16} aria-hidden />
              </span>
              <span>
                <span className="block text-xs text-aqua-300">{f?.phoneLabel}</span>
                {contact.phones.map((p) => (
                  <a key={p.digits} href={telLink(p.digits)} dir="ltr" className="block font-display font-semibold text-white transition-colors hover:text-aqua-300">
                    {p.display}
                  </a>
                ))}
              </span>
            </li>
          ) : null}
          {contact.whatsappDigits ? (
            <li>
              <a href={whatsappLink(contact.whatsappDigits, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-1.5">
                <span className="icon-tile icon-tile--glass icon-tile--sm">
                  <WhatsAppIcon width={16} height={16} />
                </span>
                <span>
                  <span className="block text-xs text-aqua-300">{f?.whatsappLabel}</span>
                  <span className="font-display font-semibold text-white transition-colors group-hover:text-aqua-300">{f?.whatsappAction}</span>
                </span>
              </a>
            </li>
          ) : null}
          {contact.email ? (
            <li>
              <a href={`mailto:${contact.email}`} className="group flex items-center gap-3 py-1.5">
                <span className="icon-tile icon-tile--glass icon-tile--sm">
                  <Mail size={16} aria-hidden />
                </span>
                <span dir="ltr" className="text-sm font-semibold text-white transition-colors group-hover:text-aqua-300">
                  {contact.email}
                </span>
              </a>
            </li>
          ) : null}
          {contact.address ? (
            <li className="flex items-center gap-3 py-1.5">
              <span className="icon-tile icon-tile--glass icon-tile--sm">
                <MapPin size={16} aria-hidden />
              </span>
              <span className="text-sm">
                <RichText text={contact.address} />
              </span>
            </li>
          ) : null}
          {contact.hours ? (
            <li className="flex items-center gap-3 py-1.5">
              <span className="icon-tile icon-tile--glass icon-tile--sm">
                <Clock3 size={16} aria-hidden />
              </span>
              <span className="text-sm">
                <RichText text={contact.hours} />
              </span>
            </li>
          ) : null}
        </FooterCol>
      </div>

      <div className="border-t border-aqua-500/15">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-sm sm:flex-row">
          <p>
            © {year} {identity.doctorName}. {f?.rights}
          </p>
          {f?.backToTop ? (
            <a href="#top" className="group inline-flex items-center gap-3 text-white/80 transition-colors hover:text-aqua-300">
              {f.backToTop}
              <span className="icon-tile icon-tile--glass icon-tile--sm transition-transform group-hover:-translate-y-1">
                <ArrowUp size={16} aria-hidden />
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 lg:col-span-1" : ""}>
      {title ? (
        <h2 className="flex items-center gap-3 text-base font-semibold text-white">
          <span className="h-4 w-1 rounded-full bg-aqua-500 shadow-[0_0_10px_#49D9F4]" aria-hidden />
          {title}
        </h2>
      ) : null}
      <ul className="mt-5 space-y-1.5">{children}</ul>
    </div>
  );
}
