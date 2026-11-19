import "server-only";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, localeSettings, localizeHref, type Locale } from "@/i18n/config";
import { getSite } from "./source";
import type { Img, PageView, SiteView } from "./view";

/** Resolves the `[lang]` route param and loads the site; unknown languages render the 404 page. */
export async function siteFor(params: Promise<{ lang: string }>): Promise<{ locale: Locale; site: SiteView }> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return { locale: lang, site: await getSite(lang) };
}

/** The canonical origin: Website settings → address, the deployment's address, or localhost. */
export function siteOrigin(site?: SiteView): string {
  const fromCms = site?.identity.siteUrl;
  if (fromCms) return fromCms;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const ogImages = (img: Img | null) => (img ? [{ url: img.src, width: img.width ?? undefined, height: img.height ?? undefined, alt: img.alt }] : undefined);

/**
 * Metadata of a page from its SEO settings, with the website defaults as
 * fallbacks. `extra` lets article pages pass their own title / image.
 */
export function pageMetadata(site: SiteView, page: PageView | undefined, path: string, extra: { title?: string; description?: string; image?: Img | null; type?: "website" | "article" } = {}): Metadata {
  const seo = page?.seo;
  const title = extra.title || seo?.title || undefined;
  const description = extra.description || seo?.description || site.identity.defaultDescription;
  const image = extra.image ?? seo?.ogImage ?? site.identity.ogImage;
  const index = site.identity.robotsIndex && (seo?.index ?? true);
  const follow = seo?.follow ?? true;
  const canonical = seo?.canonical || localizeHref(path, site.locale);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical, languages: { ar: localizeHref(path, "ar"), en: localizeHref(path, "en") } },
    openGraph: {
      type: extra.type ?? "website",
      locale: localeSettings[site.locale].ogLocale,
      siteName: site.identity.siteName,
      title: seo?.ogTitle || title || site.identity.defaultTitle,
      description: seo?.ogDescription || description,
      url: canonical,
      images: ogImages(image),
    },
    twitter: { card: seo?.twitterCard ?? "summary_large_image", title: seo?.ogTitle || title || site.identity.defaultTitle, description: seo?.ogDescription || description, images: image ? [image.src] : undefined },
    robots: { index, follow },
  };
}
