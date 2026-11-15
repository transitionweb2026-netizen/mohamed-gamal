"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { photos } from "@/content/media";
import { isLocale, splitLocale, type Locale } from "@/i18n/config";
import { ContactPanel } from "@/components/hero/contact-panel";

const copy: Record<Locale, { title: string; text: string; action: string; panel: { follow: string; call: string; label: string } }> = {
  ar: {
    title: "الصفحة غير موجودة",
    text: "ربما تم نقل الصفحة أو أن الرابط غير صحيح. لنعد بك إلى المسار الصحيح.",
    action: "العودة للرئيسية",
    panel: { follow: "تابعنا", call: "اتصل بنا", label: "وسائل التواصل" },
  },
  en: {
    title: "Page not found",
    text: "The page may have moved or the link may be incorrect. Let's get you back on track.",
    action: "Back to home",
    panel: { follow: "Follow", call: "Call us", label: "Contact channels" },
  },
};

/** Branded 404 (not-found pages receive no params, so the language comes from the URL). */
export default function NotFound() {
  const { locale } = splitLocale(usePathname() ?? "/");
  const lang: Locale = isLocale(locale) ? locale : "ar";
  const t = copy[lang];
  const img = photos.gymStretch;

  return (
    <section className="hero hero--inner">
      <div className="hero__media">
        <Image src={img.src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="hero__grade" aria-hidden />
      <div className="hero__tint" aria-hidden />
      <div className="hero__wash" aria-hidden />
      <div className="container-x hero__content">
        <div className="hero-in flex max-w-2xl flex-col items-start gap-6">
          <span className="num-outline text-[clamp(6rem,18vw,12rem)]">404</span>
          <h1 className="hero__title !text-[clamp(2.25rem,5vw,4rem)]">
            <span className="text-aqua-gradient">{t.title}</span>
          </h1>
          <p className="hero__subtitle">{t.text}</p>
          <Link href={`/${lang}`} className="btn btn--aqua">
            <span className="btn__icon">
              <House size={17} aria-hidden />
            </span>
            {t.action}
          </Link>
        </div>
      </div>
      <div className="container-x hero__rail">
        <ContactPanel labels={t.panel} />
      </div>
    </section>
  );
}
