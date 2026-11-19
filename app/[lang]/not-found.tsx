"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { isLocale, splitLocale } from "@/i18n/config";
import { ContactPanel } from "@/components/hero/contact-panel";
import { useClientSite } from "@/components/layout/site-context";

/**
 * Branded 404. Not-found pages receive no route params, so the texts
 * (Interface text → Page not found) come from the layout through context.
 */
export default function NotFound() {
  const site = useClientSite();
  const { locale } = splitLocale(usePathname() ?? "/");
  const lang = site?.locale ?? (isLocale(locale) ? locale : "ar");
  const t = site?.notFound ?? { title: "404", text: "", action: lang === "ar" ? "الرئيسية" : "Home" };
  const img = site?.image;

  return (
    <section className="hero hero--inner">
      <div className="hero__media">{img ? <Image src={img.src} alt="" fill sizes="100vw" className="object-cover" style={img.position ? { objectPosition: img.position } : undefined} /> : null}</div>
      <div className="hero__grade" aria-hidden />
      <div className="hero__tint" aria-hidden />
      <div className="hero__wash" aria-hidden />
      <div className="container-x hero__content">
        <div className="hero-in flex max-w-2xl flex-col items-start gap-6">
          <span className="num-outline text-[clamp(6rem,18vw,12rem)]">404</span>
          <h1 className="hero__title !text-[clamp(2.25rem,5vw,4rem)]">
            <span className="text-aqua-gradient">{t.title}</span>
          </h1>
          {t.text ? <p className="hero__subtitle">{t.text}</p> : null}
          <Link href={`/${lang}`} className="btn btn--aqua">
            <span className="btn__icon">
              <House size={17} aria-hidden />
            </span>
            {t.action}
          </Link>
        </div>
      </div>
      {site ? (
        <div className="container-x hero__rail">
          <ContactPanel socials={site.socials} phones={site.phones} labels={site.panel} />
        </div>
      ) : null}
    </section>
  );
}
