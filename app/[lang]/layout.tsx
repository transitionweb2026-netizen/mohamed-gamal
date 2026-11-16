import type { Metadata, Viewport } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import { siteConfig } from "@/config/site";
import { localeSettings, locales } from "@/i18n/config";
import { resolveLocale } from "@/i18n/dictionaries";
import { Navbar, type NavItem } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GlobalCta } from "@/components/cta/global-cta";
import { RevealObserver } from "@/components/effects/reveal-observer";
import { GlassPointer } from "@/components/effects/glass-pointer";
import { ArticleModalProvider } from "@/components/articles/article-modal";
import { toModalArticles } from "@/lib/content";
import "../globals.css";

const display = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

/** Both languages are prerendered at build time. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t.meta.title, template: `%s | ${t.meta.siteName}` },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: {
      type: "website",
      locale: localeSettings[locale].ogLocale,
      siteName: t.meta.siteName,
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: "/images/photos/pexels-20860582.jpg", width: 2400, height: 1600 }],
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#002933",
  colorScheme: "light",
};

// Reveal animations start hidden; without JavaScript, show everything.
const noScriptStyles =
  "[data-reveal]{opacity:1!important;transform:none!important}[data-reveal] .img-frame{clip-path:none!important}[data-reveal] .img-frame img{scale:none!important;filter:none!important}[data-reveal] .icon-tile{scale:none!important;opacity:1!important}[data-reveal] .eyebrow::before{width:30px!important}";

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { locale, t } = await resolveLocale(params);

  const items: NavItem[] = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/services", label: t.nav.services },
    { href: "/videos", label: t.nav.videos },
    { href: "/articles", label: t.nav.articles },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <html lang={locale} dir={localeSettings[locale].dir} className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body id="top">
        <noscript>
          <style>{noScriptStyles}</style>
        </noscript>
        <Navbar
          locale={locale}
          items={items}
          doctor={{ name: t.doctor.name, tagline: t.doctor.tagline }}
          labels={{
            book: t.nav.book,
            openMenu: t.nav.openMenu,
            closeMenu: t.nav.closeMenu,
            language: t.nav.language,
            primary: t.nav.primary,
            whatsapp: t.cta.whatsapp,
            call: t.cta.call,
            whatsappMessage: t.cta.whatsappMessage,
          }}
        />
        <span className="scroll-progress" aria-hidden />
        <ArticleModalProvider
          articles={toModalArticles(t, locale)}
          labels={{
            close: t.common.close,
            minRead: t.common.minRead,
            readMore: t.common.readMore,
            recommended: t.common.recommended,
            disclaimer: t.common.disclaimer,
          }}
        >
          <main id="main">{children}</main>
        </ArticleModalProvider>
        <GlobalCta t={t} locale={locale} />
        <Footer t={t} locale={locale} items={items} />
        <RevealObserver />
        <GlassPointer />
      </body>
    </html>
  );
}
