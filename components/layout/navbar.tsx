"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarCheck, ChevronDown, Phone } from "lucide-react";
import { localizeHref, splitLocale, type Locale } from "@/i18n/config";
import { isExternal, telLink, whatsappLink } from "@/lib/cms/links";
import type { Img, LinkView, NavItemView, PhoneView, SiteView } from "@/lib/cms/view";
import { BrandMark } from "@/components/ui/brand";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { SocialLinks } from "@/components/ui/social-links";
import { LangToggle } from "./lang-toggle";

interface Props {
  locale: Locale;
  items: NavItemView[];
  bookCta: LinkView | null;
  doctor: { name: string; tagline: string; monogram: string; logo: Img | null };
  contact: { phones: PhoneView[]; whatsappDigits: string; whatsappMessage: string; whatsappLabel: string };
  socials: SiteView["socials"];
  labels: { openMenu: string; closeMenu: string; language: string; primary: string; call: string };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Navbar({ locale, items, bookCta, doctor, contact, socials, labels }: Props) {
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false });

  const href = useCallback((h: string) => (isExternal(h) ? h : localizeHref(h, locale)), [locale]);
  const isActive = useCallback(
    (h: string) => !isExternal(h) && (h === "/" ? path === "/" : path === h || path.startsWith(`${h.split("#")[0]}/`) || path === h.split("#")[0]),
    [path],
  );

  // Liquid indicator: glides to the hovered link, rests on the active one.
  const moveTo = useCallback((el: HTMLElement | null | undefined) => {
    const list = listRef.current;
    if (!el || !list) return setIndicator((s) => ({ ...s, visible: false }));
    const a = el.getBoundingClientRect();
    const b = list.getBoundingClientRect();
    setIndicator({ x: a.left - b.left, w: a.width, visible: true });
  }, []);
  const toActive = useCallback(() => {
    moveTo(listRef.current?.querySelector<HTMLElement>('.nav-link[aria-current="page"]'));
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

  const newTab = (item: NavItemView) => (item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <>
      <header className="site-header" data-scrolled={scrolled || open}>
        <div className="nav-shell">
          <Link href={localizeHref("/", locale)} className="brand" aria-label={doctor.name}>
            <BrandMark logo={doctor.logo} monogram={doctor.monogram} />
            <span className="brand-text">
              <strong>{doctor.name}</strong>
              <small>{doctor.tagline}</small>
            </span>
          </Link>

          <nav aria-label={labels.primary} className="contents">
            <div ref={listRef} className="nav-links" onMouseLeave={toActive}>
              <span className="nav-indicator" aria-hidden style={{ width: indicator.w, transform: `translateX(${indicator.x}px)`, opacity: indicator.visible ? 1 : 0 }} />
              {items.map((item) => (
                <div key={item.key} className={item.children.length ? "nav-drop" : "contents"}>
                  <Link
                    href={href(item.href)}
                    className="nav-link"
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onMouseEnter={(e) => moveTo(e.currentTarget)}
                    onFocus={(e) => moveTo(e.currentTarget)}
                    onBlur={toActive}
                    {...newTab(item)}
                  >
                    {item.label}
                    {item.children.length ? <ChevronDown size={14} className="nav-drop__chevron" aria-hidden /> : null}
                  </Link>
                  {item.children.length ? (
                    <div className="nav-dropdown">
                      {item.children.map((child) => (
                        <Link key={child.key} href={href(child.href)} className="nav-dropdown__link" aria-current={isActive(child.href) ? "page" : undefined} {...newTab(child)}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </nav>

          <div className="nav-actions">
            <LangToggle locale={locale} label={labels.language} />
            {bookCta ? (
              <Link href={href(bookCta.href)} className="btn btn--aqua btn--sm hidden sm:inline-flex">
                <span className="btn__icon">
                  <CalendarCheck size={15} strokeWidth={2.2} aria-hidden />
                </span>
                {bookCta.label}
              </Link>
            ) : null}
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
            <div key={item.key}>
              <Link href={href(item.href)} className="mobile-menu__link" aria-current={isActive(item.href) ? "page" : undefined} style={{ "--i": i } as React.CSSProperties} {...newTab(item)}>
                <small>{String(i + 1).padStart(2, "0")}</small>
                {item.label}
              </Link>
              {item.children.map((child) => (
                <Link key={child.key} href={href(child.href)} className="mobile-menu__link mobile-menu__link--child" aria-current={isActive(child.href) ? "page" : undefined} style={{ "--i": i } as React.CSSProperties} {...newTab(child)}>
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="container-x mt-8 grid gap-3 !px-0 sm:grid-cols-2">
          {contact.whatsappDigits ? (
            <a href={whatsappLink(contact.whatsappDigits, contact.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn--aqua w-full sm:col-span-2">
              <span className="btn__icon">
                <WhatsAppIcon width={17} height={17} />
              </span>
              {contact.whatsappLabel}
            </a>
          ) : null}
          {contact.phones.map((p) => (
            <a key={p.digits} href={telLink(p.digits)} className="btn btn--glass w-full" aria-label={`${labels.call}: ${p.display}`}>
              <span className="btn__icon">
                <Phone size={16} aria-hidden />
              </span>
              <span dir="ltr">{p.display}</span>
            </a>
          ))}
        </div>
        <div className="container-x mt-8 flex items-center justify-between !px-0">
          <SocialLinks socials={socials} />
        </div>
      </div>
    </>
  );
}
