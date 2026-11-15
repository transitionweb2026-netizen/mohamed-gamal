import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { photos, type PhotoKey } from "@/content/media";
import type { Dictionary, HeroCopy } from "@/content/types";
import { localizeHref, type Locale } from "@/i18n/config";
import { ContactPanel } from "./contact-panel";

interface Props {
  locale: Locale;
  t: Dictionary;
  photo: PhotoKey;
  copy: HeroCopy;
  variant?: "home" | "inner";
  /** Current page name for the breadcrumb (inner pages). */
  crumb?: string;
  /** Extra crumb between Home and the current page (e.g. Articles › article). */
  parentCrumb?: { label: string; href: string };
  actions?: ReactNode;
  floating?: ReactNode;
  /** Use a smaller title for long titles (article pages). */
  compact?: boolean;
}

/**
 * Global full-bleed image hero used by every page: brand-graded photo,
 * two-word title with an animated cyan accent, and the social/phone panel.
 */
export function PageHero({ locale, t, photo, copy, variant = "inner", crumb, parentCrumb, actions, floating, compact }: Props) {
  const img = photos[photo];
  const [first, second] = copy.title;
  return (
    <section className={`hero ${variant === "home" ? "hero--home" : "hero--inner"}`}>
      <div className="hero__media">
        <Image src={img.src} alt={img.alt[locale]} fill preload sizes="100vw" quality={75} className="object-cover" />
      </div>
      <div className="hero__grade" aria-hidden />
      <div className="hero__tint" aria-hidden />
      <div className="hero__wash" aria-hidden />
      <HeroDeco />

      {floating}

      <div className="container-x hero__content">
        <div className={`hero-in flex max-w-3xl flex-col items-start ${compact ? "gap-5" : "gap-6"}`}>
          {crumb ? (
            <nav aria-label={t.common.breadcrumb}>
              <ol className="hero-crumbs">
                <li>
                  <Link href={localizeHref("/", locale)}>{t.common.home}</Link>
                </li>
                {parentCrumb ? (
                  <>
                    <li aria-hidden>
                      <ChevronRight size={14} className="text-aqua-400 rtl:-scale-x-100" />
                    </li>
                    <li>
                      <Link href={localizeHref(parentCrumb.href, locale)}>{parentCrumb.label}</Link>
                    </li>
                  </>
                ) : null}
                <li aria-hidden>
                  <ChevronRight size={14} className="text-aqua-400 rtl:-scale-x-100" />
                </li>
                <li aria-current="page" className="line-clamp-1 font-semibold text-white">
                  {crumb}
                </li>
              </ol>
            </nav>
          ) : null}

          <span className="chip chip--dark">
            <span className="dot-live" aria-hidden />
            {copy.eyebrow}
          </span>

          <h1 className="hero__title" style={compact ? { fontSize: "clamp(2rem, 4.6vw, 3.6rem)", lineHeight: 1.25 } : undefined}>
            <span className={compact ? "" : "block"}>{first}</span>
            {second ? (
              <>
                {" "}
                <span className="hero__title-accent">
                  <span className="text-aqua-gradient">{second}</span>
                  <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden className="rtl:-scale-x-100">
                    <path d="M4 17 C 70 5, 190 1, 296 11" pathLength={1} stroke="#49D9F4" strokeWidth="5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </>
            ) : null}
          </h1>

          <p className="hero__subtitle">{copy.subtitle}</p>

          {actions}
        </div>
      </div>

      <div className="container-x hero__rail">
        <div className="flex items-end justify-between gap-6">
          <ContactPanel labels={t.panel} />
          {variant === "home" ? (
            <span className="scroll-cue" aria-hidden>
              <span className="scroll-cue__track" />
              {t.common.scroll}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Decorative cyan geometry floating over the photo side. */
function HeroDeco() {
  return (
    <div className="hero__deco" aria-hidden>
      <div className="deco-rings float-slower" style={{ width: "min(46vw, 560px)", insetInlineEnd: "-12%", top: "14%", opacity: 0.55 }} />
      <svg className="absolute bottom-0 h-[55%] w-full opacity-70 rtl:-scale-x-100" viewBox="0 0 1440 400" preserveAspectRatio="none" fill="none">
        <path d="M-20 360 C 300 300, 520 380, 820 250 S 1250 120, 1460 160" stroke="url(#heroLine)" strokeWidth="1.5" />
        <path d="M-20 390 C 340 330, 600 400, 900 290 S 1300 190, 1460 220" stroke="url(#heroLine)" strokeWidth="1" strokeDasharray="2 8" />
        <defs>
          <linearGradient id="heroLine" x1="0" x2="1440" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#49D9F4" stopOpacity="0" />
            <stop offset="0.55" stopColor="#49D9F4" stopOpacity="0.8" />
            <stop offset="1" stopColor="#49D9F4" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>
      <svg className="absolute hidden md:block" style={{ insetInlineEnd: "8%", top: "26%" }} width="120" height="120" viewBox="0 0 120 120">
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d={`M${(i % 4) * 32 + 8} ${Math.floor(i / 4) * 32 + 4}v8M${(i % 4) * 32 + 4} ${Math.floor(i / 4) * 32 + 8}h8`}
            stroke="#49D9F4"
            strokeOpacity={0.55}
            strokeWidth="1.4"
          />
        ))}
      </svg>
    </div>
  );
}
