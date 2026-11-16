"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { phones, telFor, whatsappHref } from "@/config/site";
import { localizeHref, splitLocale, type Locale } from "@/i18n/config";
import { BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { SocialLinks } from "@/components/ui/social-links";
import { LangToggle } from "./lang-toggle";

export interface NavItem {
  href: string;
  label: string;
}

interface Props {
  locale: Locale;
  items: NavItem[];
  labels: {
    book: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    primary: string;
    whatsapp: string;
    call: string;
    whatsappMessage: string;
  };
  doctor: { name: string; tagline: string };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Navbar({ locale, items, labels, doctor }: Props) {
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false });

  const isActive = useCallback((href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)), [path]);

  // Liquid indicator: glides to the hovered link, rests on the active one.
  const moveTo = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return setIndicator((s) => ({ ...s, visible: false }));
    setIndicator({ x: el.offsetLeft, w: el.offsetWidth, visible: true });
  }, []);
  const toActive = useCallback(() => {
    moveTo(listRef.current?.querySelector<HTMLElement>('[aria-current="page"]'));
  }, [moveTo]);

  useIsoLayoutEffect(() => {
    toActive();
  }, [pathname, toActive]);

  useEffect(() => {
    const onResize = () => toActive();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(toActive).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, [toActive]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu after navigating; lock page scroll while it's open.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);


  return (
    <>
      <header className="site-header" data-scrolled={scrolled || open}>
        <div className="nav-shell">
          <Link href={localizeHref("/", locale)} className="brand" aria-label={doctor.name}>
            <BrandMark />
            <span className="brand-text">
              <strong>{doctor.name}</strong>
              <small>{doctor.tagline}</small>
            </span>
          </Link>

          <nav aria-label={labels.primary} className="contents">
            <div ref={listRef} className="nav-links" onMouseLeave={toActive}>
              <span
                className="nav-indicator"
                aria-hidden
                style={{ width: indicator.w, transform: `translateX(${indicator.x}px)`, opacity: indicator.visible ? 1 : 0 }}
              />
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={localizeHref(item.href, locale)}
                  className="nav-link"
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onMouseEnter={(e) => moveTo(e.currentTarget)}
                  onFocus={(e) => moveTo(e.currentTarget)}
                  onBlur={toActive}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="nav-actions">
            <LangToggle locale={locale} label={labels.language} />
            <Link href={localizeHref("/contact#booking", locale)} className="btn btn--aqua btn--sm hidden sm:inline-flex">
              <span className="btn__icon">
                <CalendarCheck size={15} strokeWidth={2.2} aria-hidden />
              </span>
              {labels.book}
            </Link>
            <button
              type="button"
              className="nav-square burger min-[1100px]:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? labels.closeMenu : labels.openMenu}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="burger__lines block w-5">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className="mobile-menu min-[1100px]:hidden" data-open={open} aria-hidden={!open} inert={!open}>
        <nav aria-label={labels.primary} className="container-x !px-0">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={localizeHref(item.href, locale)}
              className="mobile-menu__link"
              aria-current={isActive(item.href) ? "page" : undefined}
              style={{ "--i": i } as React.CSSProperties}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="container-x mt-8 grid gap-3 !px-0 sm:grid-cols-2">
          <a href={whatsappHref(labels.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua w-full sm:col-span-2">
            <span className="btn__icon">
              <WhatsAppIcon width={17} height={17} />
            </span>
            {labels.whatsapp}
          </a>
          {phones.map((p) => (
            <a key={p.e164} href={telFor(p)} className="btn btn--glass w-full" aria-label={`${labels.call}: ${p.display}`}>
              <span className="btn__icon">
                <Phone size={16} aria-hidden />
              </span>
              <span dir="ltr">{p.display}</span>
            </a>
          ))}
        </div>
        <div className="container-x mt-8 flex items-center justify-between !px-0">
          <SocialLinks />
        </div>
      </div>
    </>
  );
}
