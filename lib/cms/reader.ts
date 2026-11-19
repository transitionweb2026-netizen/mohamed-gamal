import { isLocalized, type Field } from "./fields";
import { CREDENTIAL_SECTIONS, PAGES, sectionTypeDef } from "./registry";
import { readingMinutes, sanitizeRichDoc } from "./richtext";
import type { CmsSnapshot, CredentialKind, ImageRef, L, Locale, MediaRow } from "./types";
import type { ArticleView, Img, NavItemView, PageView, SectionView, SiteView } from "./view";

/**
 * Turns a CMS snapshot into what the website renders for one language.
 * Missing translations fall back to the other language, so a page never
 * shows an empty label because one language was not filled in yet.
 */

const other = (locale: Locale): Locale => (locale === "ar" ? "en" : "ar");

export function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(date));
}

export function buildSiteView(snapshot: CmsSnapshot, locale: Locale, storageBase: string | null): SiteView {
  const fallback = other(locale);
  const mediaById = new Map(snapshot.media.map((m) => [m.id, m]));

  const mediaUrl = (row: MediaRow) => (row.bucket ? `${storageBase ?? ""}/${row.bucket}/${row.path}` : row.path);
  const img = (id: string | null | undefined, position = "", altOverride = ""): Img | null => {
    const row = id ? mediaById.get(id) : undefined;
    if (!row || row.kind !== "image") return null;
    return {
      src: mediaUrl(row),
      alt: altOverride || row[`alt_${locale}`] || row[`alt_${fallback}`] || "",
      width: row.width,
      height: row.height,
      position,
    };
  };

  /** A translated column pair (`title_ar` / `title_en`) of a row. */
  const col = (row: object, base: string): string => {
    const r = row as Record<string, unknown>;
    return String(r[`${base}_${locale}`] || r[`${base}_${fallback}`] || "");
  };
  const colList = (row: object, base: string): string[] => {
    const r = row as Record<string, unknown>;
    const own = (r[`${base}_${locale}`] as string[] | undefined) ?? [];
    return own.some((v) => v.trim()) ? own : ((r[`${base}_${fallback}`] as string[] | undefined) ?? []);
  };
  const pick = (value: unknown): string => {
    const v = value as L | undefined;
    return v ? String(v[locale] || v[fallback] || "") : "";
  };

  /** Section content with every value resolved for this language. */
  const localize = (fields: Field[], doc: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const field of fields) {
      const value = doc?.[field.key];
      switch (field.type) {
        case "text":
          out[field.key] = isLocalized(field) ? pick(value) : (value ?? "");
          break;
        case "stringList": {
          const v = value as L<string[]> | undefined;
          const own = (v?.[locale] ?? []).filter((x) => x.trim());
          out[field.key] = own.length ? own : (v?.[fallback] ?? []).filter((x) => x.trim());
          break;
        }
        case "cta": {
          const v = value as { label: L; href: string } | null | undefined;
          out[field.key] = v && v.href && pick(v.label) ? { label: pick(v.label), href: v.href } : null;
          break;
        }
        case "image": {
          const v = value as ImageRef | undefined;
          out[field.key] = img(v?.id, v?.position ?? "");
          break;
        }
        case "media":
          out[field.key] = img(value as string | null);
          break;
        case "group":
          out[field.key] = localize(field.fields, (value as Record<string, unknown>) ?? {});
          break;
        case "list":
          out[field.key] = Array.isArray(value) ? value.map((item) => localize(field.fields, item as Record<string, unknown>)) : [];
          break;
        default:
          out[field.key] = value;
      }
    }
    return out;
  };

  /* ---- Pages and sections ---- */
  const pages: Record<string, PageView> = {};
  for (const def of PAGES) {
    const row = snapshot.pages.find((p) => p.key === def.key);
    const sections: SectionView[] = snapshot.sections
      .filter((s) => s.page_key === def.key && s.visible)
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((s) => {
        const type = sectionTypeDef(s.type);
        return type ? [{ id: s.id, key: s.key, type: s.type, content: localize(type.fields, s.content) }] : [];
      });
    pages[def.key] = {
      key: def.key,
      path: def.path ?? "",
      name: row ? col(row, "name") : def.label,
      seo: {
        title: row ? col(row, "seo_title") : "",
        description: row ? col(row, "seo_description") : "",
        ogTitle: row ? col(row, "og_title") : "",
        ogDescription: row ? col(row, "og_description") : "",
        ogImage: img(row?.og_image_id),
        canonical: row?.canonical_url ?? "",
        index: row?.robots_index ?? true,
        follow: row?.robots_follow ?? true,
        twitterCard: row?.twitter_card ?? "summary_large_image",
      },
      sections,
    };
  }
  const globalSection = <T>(key: string) => (pages.global?.sections.find((s) => s.key === key)?.content as T | undefined) ?? null;

  /* ---- Settings, contact, navigation ---- */
  const settings = snapshot.settings;
  const s = (base: string) => (settings ? col(settings, base) : "");
  const favicon = settings?.favicon_id ? mediaById.get(settings.favicon_id) : undefined;

  const navRows = snapshot.navigation.filter((n) => n.visible);
  const navItem = (row: (typeof navRows)[number]): NavItemView => ({
    key: row.key,
    label: col(row, "label"),
    href: row.href,
    newTab: row.open_in_new_tab,
    children: navRows.filter((c) => c.parent_id === row.id).sort((a, b) => a.sort_order - b.sort_order).map(navItem),
  });
  const topLevel = navRows.filter((n) => !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);

  /* ---- Collections ---- */
  const categories = new Map(snapshot.articleCategories.map((c) => [c.id, c]));
  const articles: ArticleView[] = snapshot.articles.map((a) => {
    const body = sanitizeRichDoc(a[`body_${locale}`]?.content?.length ? a[`body_${locale}`] : a[`body_${fallback}`]);
    const category = a.category_id ? categories.get(a.category_id) : undefined;
    const cover = img(a.cover_id, "", col(a, "cover_alt"));
    return {
      slug: a.slug,
      title: col(a, "title"),
      excerpt: col(a, "excerpt"),
      category: category ? col(category, "name") : "",
      author: col(a, "author"),
      date: a.published_on,
      dateLabel: a.published_on ? formatDate(a.published_on, locale) : null,
      cover,
      ogImage: img(a.og_image_id) ?? cover,
      body,
      minutes: readingMinutes(body),
      featured: a.featured,
      seoTitle: col(a, "seo_title"),
      seoDescription: col(a, "seo_description"),
    };
  });
  // The featured article first, then the others in their order.
  articles.sort((x, y) => Number(y.featured) - Number(x.featured));

  const credentials = { education: [], experience: [], certification: [], achievement: [] } as SiteView["credentials"];
  for (const c of snapshot.credentials) {
    credentials[c.kind as CredentialKind]?.push({ title: col(c, "title"), place: col(c, "place"), period: col(c, "period"), text: col(c, "text") });
  }

  const ui: Record<string, string> = {};
  for (const u of snapshot.uiStrings) ui[u.key] = (locale === "ar" ? u.value_ar : u.value_en) || (locale === "ar" ? u.value_en : u.value_ar);

  return {
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    preview: snapshot.preview,
    identity: {
      siteName: s("site_name"),
      doctorName: s("doctor_name"),
      doctorRole: s("doctor_role"),
      tagline: s("doctor_tagline"),
      monogram: settings?.monogram || "MG",
      logo: img(settings?.logo_id),
      portrait: img(settings?.portrait_id),
      favicon: favicon ? { src: mediaUrl(favicon), type: favicon.mime_type } : null,
      siteUrl: settings?.site_url ?? "",
      defaultTitle: s("default_title"),
      defaultDescription: s("default_description"),
      ogImage: img(settings?.og_image_id),
      robotsIndex: settings?.robots_index ?? true,
      defaultLocale: settings?.default_locale ?? "ar",
    },
    contact: {
      phones: snapshot.phones.filter((p) => p.visible).map((p) => ({ label: col(p, "label"), display: p.display, digits: p.digits })),
      whatsappDigits: settings?.whatsapp_digits ?? "",
      whatsappMessage: s("whatsapp_message"),
      email: settings?.email ?? "",
      address: s("address"),
      hours: s("hours"),
      mapEmbedUrl: settings?.map_embed_url ?? "",
      mapLinkUrl: settings?.map_link_url ?? "",
    },
    socials: snapshot.socials.filter((x) => x.visible).map((x) => ({ platform: x.platform, href: x.url })),
    nav: {
      header: topLevel.filter((n) => n.show_in_header).map(navItem),
      footer: navRows.filter((n) => n.show_in_footer).sort((a, b) => a.sort_order - b.sort_order).map((n) => ({ ...navItem(n), children: [] })),
    },
    ui,
    pages,
    global: { navbar: globalSection("navbar"), cta: globalSection("cta"), footer: globalSection("footer") },
    services: snapshot.services.map((x) => ({ slug: x.slug, icon: x.icon, image: img(x.image_id), featured: x.featured, title: col(x, "title"), summary: col(x, "summary"), points: colList(x, "points") })),
    conditions: snapshot.conditions.map((x) => ({ slug: x.slug, icon: x.icon, image: img(x.image_id), region: col(x, "region"), text: col(x, "text"), items: colList(x, "items") })),
    process: snapshot.processSteps.map((x, i) => ({ tag: String(i + 1).padStart(2, "0"), icon: x.icon, title: col(x, "title"), text: col(x, "text") })),
    stats: snapshot.stats.map((x) => ({ value: x.value, label: col(x, "label"), icon: x.icon })),
    videos: snapshot.videos.map((v) => {
      const file = v.file_id ? mediaById.get(v.file_id) : undefined;
      return {
        id: v.id,
        slug: v.slug,
        source: v.source,
        youtubeId: v.source === "youtube" ? v.youtube_id : null,
        fileUrl: v.source === "file" && file ? mediaUrl(file) : v.source === "url" ? v.video_url : null,
        poster: img(v.poster_id),
        featured: v.featured,
        category: col(v, "category"),
        title: col(v, "title"),
        description: col(v, "description"),
      };
    }),
    articles,
    testimonials: snapshot.testimonials.map((t) => ({ quote: col(t, "quote"), name: col(t, "name"), meta: col(t, "meta"), rating: t.rating, avatar: img(t.avatar_id), isPlaceholder: t.is_placeholder })),
    faqs: {
      home: snapshot.faqs.filter((f) => f.group_key === "home").map((f) => ({ q: col(f, "question"), a: col(f, "answer") })),
      services: snapshot.faqs.filter((f) => f.group_key === "services").map((f) => ({ q: col(f, "question"), a: col(f, "answer") })),
    },
    credentials,
  };
}

/** Which credentials kind a section of the about page lists. */
export function credentialKindOf(sectionKey: string): CredentialKind | null {
  return CREDENTIAL_SECTIONS[sectionKey] ?? null;
}
