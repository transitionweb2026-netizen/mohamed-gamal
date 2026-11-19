import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, ChevronRight, LayoutGrid } from "lucide-react";
import { localizeHref } from "@/i18n/config";
import { isExternal } from "@/lib/cms/links";
import type { HeroView, Img, SiteView } from "@/lib/cms/view";
import { Icon } from "@/components/ui/icon";
import { ContactPanel } from "./contact-panel";

interface Props {
  site: SiteView;
  hero: HeroView;
  variant?: "home" | "inner";
  /** Current page name for the breadcrumb (inner pages). */
  crumb?: string;
  /** Extra crumb between Home and the current page (e.g. Articles › article). */
  parentCrumb?: { label: string; href: string };
  /** Use a smaller title for long titles (article pages). */
  compact?: boolean;
  /** Overrides the hero image (article pages use the cover). */
  image?: Img | null;
}

/**
 * Global full-bleed image hero used by every page: brand-graded photo,
 * two-word title with an animated cyan accent, optional buttons and floating
 * badges, and the social / phone panel.
 */
export function PageHero({ site, hero, variant = "inner", crumb, parentCrumb, compact, image }: Props) {
  const img = image ?? hero.image;
  const { locale, ui } = site;
  const href = (h: string) => (isExternal(h) ? h : localizeHref(h, locale));
  const buttons = [hero.primaryCta, hero.secondaryCta].filter((b): b is NonNullable<typeof b> => !!b);

  return (
    <section className={`hero ${variant === "home" ? "hero--home" : "hero--inner"}`}>
      <div className="hero__media">
        {img ? <Image src={img.src} alt={img.alt} fill preload sizes="100vw" quality={75} className="object-cover" style={img.position ? { objectPosition: img.position } : undefined} /> : null}
      </div>
      <div className="hero__grade" aria-hidden />
      <div className="hero__tint" aria-hidden />
      <div className="hero__wash" aria-hidden />
      <HeroDeco />

      {hero.badges.length ? (
        <div className="hero-stack pointer-events-none absolute top-1/2 hidden -translate-y-1/2 xl:block" style={{ insetInlineEnd: "max(2.5rem, calc((100vw - 1280px) / 2 + 2.5rem))" }} aria-hidden>
          <div className="float-slow flex flex-col gap-4">
            <span className="hero-stack__line" />
            {hero.badges.map((b, i) => (
              <div key={`${b.label}-${i}`} className="hero-stack__item lg lg--deep lg--sm flex w-72 items-center gap-3 px-4 py-3.5" style={{ animationDelay: `${0.9 + i * 0.15}s` }}>
                <span className="icon-tile icon-tile--sm">
                  <Icon name={b.icon} size={18} />
                </span>
                <span className="text-sm font-semibold">{b.label}</span>
                <span className="dot-live ms-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="container-x hero__content">
        <div className={`hero-in flex max-w-3xl flex-col items-start ${compact ? "gap-5" : "gap-6"}`}>
          {crumb ? (
            <nav aria-label={ui["common.breadcrumb"]}>
              <ol className="hero-crumbs">
                <li>
                  <Link href={localizeHref("/", locale)}>{ui["common.home"]}</Link>
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

          {hero.eyebrow ? (
            <span className="chip chip--dark">
              <span className="dot-live" aria-hidden />
              {hero.eyebrow}
            </span>
          ) : null}

          <h1 className="hero__title" style={compact ? { fontSize: "clamp(2rem, 4.6vw, 3.6rem)", lineHeight: 1.25 } : undefined}>
            <span className={compact ? "" : "block"}>{hero.titleLead}</span>
            {hero.titleAccent ? (
              <>
                {" "}
                <span className="hero__title-accent">
                  <span className="text-aqua-gradient">{hero.titleAccent}</span>
                  <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden className="rtl:-scale-x-100">
                    <path d="M4 17 C 70 5, 190 1, 296 11" pathLength={1} stroke="#49D9F4" strokeWidth="5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </>
            ) : null}
          </h1>

          {hero.subtitle ? <p className="hero__subtitle">{hero.subtitle}</p> : null}

          {buttons.length ? (
            <div className="flex flex-wrap gap-3 pt-2">
              {buttons.map((b, i) => (
                <Link key={b.href + i} href={href(b.href)} className={`btn ${i === 0 ? "btn--aqua btn--pulse" : "btn--glass"}`}>
                  <span className="btn__icon">{i === 0 ? <CalendarCheck size={17} aria-hidden /> : <LayoutGrid size={17} aria-hidden />}</span>
                  {b.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="container-x hero__rail">
        <div className="flex items-end justify-between gap-6">
          <ContactPanel socials={site.socials} phones={site.contact.phones} labels={{ follow: ui["panel.follow"], call: ui["panel.call"], label: ui["panel.label"] }} />
          {variant === "home" ? (
            <span className="scroll-cue" aria-hidden>
              <span className="scroll-cue__track" />
              {ui["common.scroll"]}
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
          <path key={i} d={`M${(i % 4) * 32 + 8} ${Math.floor(i / 4) * 32 + 4}v8M${(i % 4) * 32 + 4} ${Math.floor(i / 4) * 32 + 8}h8`} stroke="#49D9F4" strokeOpacity={0.55} strokeWidth="1.4" />
        ))}
      </svg>
    </div>
  );
}
