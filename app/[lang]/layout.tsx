import type { Metadata, Viewport } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import Link from "next/link";
import { Eye } from "lucide-react";
import { localeSettings, locales } from "@/i18n/config";
import { pageMetadata, siteFor, siteOrigin } from "@/lib/cms/page";
import type { Img } from "@/lib/cms/view";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SiteProvider } from "@/components/layout/site-context";
import { GlobalCta } from "@/components/cta/global-cta";
import { RevealObserver } from "@/components/effects/reveal-observer";
import { GlassPointer } from "@/components/effects/glass-pointer";
import { ArticleModalProvider } from "@/components/articles/article-modal";
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
  const { site } = await siteFor(params);
  const { identity } = site;
  const base = pageMetadata(site, undefined, "/");
  return {
    ...base,
    metadataBase: new URL(siteOrigin(site)),
    title: { default: identity.defaultTitle || identity.siteName, template: `%s | ${identity.siteName}` },
    applicationName: identity.siteName,
    icons: identity.favicon
      ? { icon: [{ url: identity.favicon.src, type: identity.favicon.type }], apple: [{ url: identity.favicon.src }] }
      : { icon: [{ url: "/favicon.png", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
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
  const { locale, site } = await siteFor(params);
  const { ui, identity, contact } = site;

  return (
    <html lang={locale} dir={localeSettings[locale].dir} className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body id="top">
        <noscript>
          <style>{noScriptStyles}</style>
        </noscript>
        <SiteProvider
          value={{
            locale,
            notFound: { title: ui["notFound.title"], text: ui["notFound.text"], action: ui["notFound.action"] },
            panel: { follow: ui["panel.follow"], call: ui["panel.call"], label: ui["panel.label"] },
            socials: site.socials,
            phones: contact.phones,
            image: site.pages.services?.sections.find((s) => s.key === "hero")?.content.image as Img | null,
          }}
        >
          <Navbar
            locale={locale}
            items={site.nav.header}
            bookCta={site.global.navbar?.bookCta ?? null}
            doctor={{ name: identity.doctorName, tagline: identity.tagline, monogram: identity.monogram, logo: identity.logo }}
            contact={{ phones: contact.phones, whatsappDigits: contact.whatsappDigits, whatsappMessage: contact.whatsappMessage, whatsappLabel: site.global.cta?.whatsappLabel ?? "WhatsApp" }}
            socials={site.socials}
            labels={{ openMenu: ui["nav.openMenu"], closeMenu: ui["nav.closeMenu"], language: ui["nav.language"], primary: ui["nav.primary"], call: ui["panel.call"] }}
          />
          <span className="scroll-progress" aria-hidden />
          <ArticleModalProvider
            articles={site.articles}
            labels={{ close: ui["common.close"], minRead: ui["common.minRead"], readMore: ui["common.readMore"], recommended: ui["common.recommended"], disclaimer: ui["common.disclaimer"] }}
          >
            <main id="main">{children}</main>
          </ArticleModalProvider>
          <GlobalCta site={site} />
          <Footer site={site} />
        </SiteProvider>
        {site.preview ? (
          <div className="preview-banner" role="status">
            <div>
              <Eye size={16} aria-hidden />
              <span>{locale === "ar" ? "وضع المعاينة — تظهر التعديلات غير المنشورة" : "Preview mode — unpublished changes are shown"}</span>
              <Link href="/admin/preview/exit" prefetch={false} className="btn btn--ink btn--sm">
                {locale === "ar" ? "إنهاء المعاينة" : "Exit preview"}
              </Link>
            </div>
          </div>
        ) : null}
        <RevealObserver />
        <GlassPointer />
      </body>
    </html>
  );
}

