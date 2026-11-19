import { siteConfig } from "@/config/site";
import { ar } from "@/content/ar";
import { en } from "@/content/en";
import { photos, type PhotoKey } from "@/content/media";
import type { Dictionary } from "@/content/types";
import { stableId } from "./ids";
import { PAGES } from "./registry";
import { blocksToDoc } from "./richtext";
import type {
  ArticleCategoryRow,
  ArticleRow,
  CmsSnapshot,
  ConditionRow,
  CredentialRow,
  FaqRow,
  L,
  MediaRow,
  NavRow,
  PageRow,
  PhoneRow,
  ProcessStepRow,
  SectionRow,
  ServiceRow,
  SettingsRow,
  SocialRow,
  StatRow,
  TestimonialRow,
  UiStringRow,
  VideoRow,
} from "./types";

/**
 * The website's content as it was before the CMS (content/ar.ts, content/en.ts,
 * content/media.ts, config/site.ts), in the exact shape of the database. It is
 *  - what the website renders until Supabase is connected, and
 *  - the source of supabase/seed/content.sql, which imports it (same ids).
 */

type Pick<T> = (d: Dictionary) => T;
const both = <T>(pick: Pick<T>): L<T> => ({ ar: pick(ar), en: pick(en) });

/* ---- Media ----------------------------------------------------------------------- */

const HERO_PHOTOS: PhotoKey[] = ["legRaiseTable", "shoulderAssess", "gymStretch", "matExercise", "kneeHands", "floorGuidance"];
const LOGO_PATH = "/images/brand/logo-mark.png";

const mediaId = (path: string) => stableId("media", path);
const photoId = (key: PhotoKey) => mediaId(photos[key].src);
const image = (key: PhotoKey, position = "") => ({ id: photoId(key), position });

function buildMedia(): MediaRow[] {
  const rows: MediaRow[] = (Object.keys(photos) as PhotoKey[]).map((key) => {
    const p = photos[key];
    return {
      id: photoId(key),
      kind: "image",
      bucket: null,
      path: p.src,
      folder: HERO_PHOTOS.includes(key) ? "hero" : "website",
      mime_type: "image/jpeg",
      size_bytes: null,
      width: p.width,
      height: p.height,
      duration_seconds: null,
      title: key,
      alt_ar: p.alt.ar,
      alt_en: p.alt.en,
      legacy_path: p.src,
    };
  });
  rows.push({
    id: mediaId(LOGO_PATH),
    kind: "image",
    bucket: null,
    path: LOGO_PATH,
    folder: "icons",
    mime_type: "image/png",
    size_bytes: null,
    width: 512,
    height: 512,
    duration_seconds: null,
    title: "Logo mark",
    alt_ar: "شعار د. محمد جمال",
    alt_en: "Dr. Mohamed Gamal logo",
    legacy_path: LOGO_PATH,
  });
  return rows;
}

/* ---- Sections ---------------------------------------------------------------------- */

type HeroKey = keyof Dictionary["heroes"];
const HERO_PHOTO: Record<HeroKey, PhotoKey> = {
  home: "legRaiseTable",
  about: "kneeHands",
  services: "gymStretch",
  videos: "matExercise",
  articles: "shoulderAssess",
  contact: "floorGuidance",
};

const heading = (pick: Pick<{ eyebrow: string; title: string; text?: string }>, withText = true) => ({
  eyebrow: both((d) => pick(d).eyebrow),
  title: both((d) => pick(d).title),
  ...(withText ? { text: both((d) => pick(d).text ?? "") } : {}),
});
const iconText = (list: Pick<{ icon: string; title: string; text: string }[]>) =>
  list(ar).map((item, i) => ({ icon: item.icon, title: both((d) => list(d)[i].title), text: both((d) => list(d)[i].text) }));
const cta = (label: Pick<string>, href: string) => ({ label: both(label), href });

function hero(key: HeroKey): Record<string, unknown> {
  const copy: Pick<Dictionary["heroes"][HeroKey]> = (d) => d.heroes[key];
  const isHome = key === "home";
  return {
    eyebrow: both((d) => copy(d).eyebrow),
    titleLead: both((d) => copy(d).title[0]),
    titleAccent: both((d) => copy(d).title[1]),
    subtitle: both((d) => copy(d).subtitle),
    image: image(HERO_PHOTO[key]),
    primaryCta: isHome ? cta((d) => d.home.heroActions.primary, "/contact#booking") : null,
    secondaryCta: isHome ? cta((d) => d.home.heroActions.secondary, "/services") : null,
    badges: isHome ? (["Route", "TrendingUp", "House"] as const).map((icon, i) => ({ icon, label: both((d) => d.home.heroBadges[i]) })) : [],
  };
}

const ACHIEVEMENTS_HEADING = {
  eyebrow: { ar: "إنجازات", en: "Achievements" },
  title: { ar: "محطات نفخر بها", en: "Milestones we are proud of" },
  text: { ar: "", en: "" },
};

const SECTION_CONTENT: Record<string, Record<string, unknown>> = {
  "home.hero": hero("home"),
  "home.ticker": {},
  "home.intro": {
    eyebrow: both((d) => d.home.intro.eyebrow),
    title: both((d) => d.home.intro.title),
    paragraphs: both((d) => d.home.intro.paragraphs),
    points: iconText((d) => d.home.intro.points),
    signatureRole: both((d) => d.home.intro.signatureRole),
    cta: cta((d) => d.common.aboutDoctor, "/about"),
    image: image("bandFoot"),
    secondaryImage: image("kneeClose"),
  },
  "home.services": { heading: heading((d) => d.home.services), cta: cta((d) => d.common.allServices, "/services") },
  "home.why": { heading: heading((d) => d.home.why), items: iconText((d) => d.home.why.items), image: image("shoulderHands") },
  "home.specialties": { heading: heading((d) => d.home.specialties), hint: both((d) => d.common.explorerHint), cta: cta((d) => d.common.allServices, "/services") },
  "home.stats": { eyebrow: both((d) => d.home.stats.eyebrow), title: both((d) => d.home.stats.title), image: image("kneeHands") },
  "home.journey": { heading: heading((d) => d.home.journey) },
  "home.videos": { heading: heading((d) => d.home.videos, false), cta: cta((d) => d.common.allVideos, "/videos") },
  "home.articles": { heading: heading((d) => d.home.articles, false), cta: cta((d) => d.common.allArticles, "/articles") },
  "home.testimonials": { heading: heading((d) => d.home.testimonials) },
  "home.faq": { heading: heading((d) => d.home.faq) },

  "about.hero": hero("about"),
  "about.intro": {
    eyebrow: both((d) => d.about.intro.eyebrow),
    title: both((d) => d.about.intro.title),
    paragraphs: both((d) => d.about.intro.paragraphs),
    highlights: iconText((d) => d.about.intro.highlights),
  },
  "about.bio": {
    eyebrow: both((d) => d.about.bio.eyebrow),
    title: both((d) => d.about.bio.title),
    paragraphs: both((d) => d.about.bio.paragraphs),
    quote: both((d) => d.about.bio.quote),
  },
  "about.education": { heading: heading((d) => d.about.education) },
  "about.experience": { heading: heading((d) => d.about.experience), image: image("electro") },
  "about.certifications": { heading: heading((d) => d.about.certifications) },
  "about.achievements": { heading: ACHIEVEMENTS_HEADING },
  "about.philosophy": {
    eyebrow: both((d) => d.about.philosophy.eyebrow),
    title: both((d) => d.about.philosophy.title),
    quote: both((d) => d.about.philosophy.quote),
    pillars: iconText((d) => d.about.philosophy.pillars),
    image: image("balanceBoard"),
  },
  "about.values": { heading: heading((d) => d.about.values), items: iconText((d) => d.about.values.items) },
  "about.stats": { eyebrow: both((d) => d.about.stats.eyebrow), title: both((d) => d.about.stats.title), image: image("shoulderHands") },

  "services.hero": hero("services"),
  "services.intro": {
    eyebrow: both((d) => d.servicesPage.intro.eyebrow),
    title: both((d) => d.servicesPage.intro.title),
    paragraphs: both((d) => d.servicesPage.intro.paragraphs),
    highlights: iconText((d) => d.servicesPage.intro.highlights),
    cardTitle: both((d) => d.home.heroBadges[0]),
    cardText: both((d) => d.home.heroBadges[1]),
    image: image("ankleTable"),
    secondaryImage: image("kneeTape"),
  },
  "services.main": { heading: heading((d) => d.servicesPage.main) },
  "services.all": { heading: heading((d) => d.servicesPage.all) },
  "services.conditions": { heading: heading((d) => d.servicesPage.conditions) },
  "services.process": { heading: heading((d) => d.servicesPage.process, false) },
  "services.approach": {
    eyebrow: both((d) => d.servicesPage.approach.eyebrow),
    title: both((d) => d.servicesPage.approach.title),
    statement: both((d) => d.servicesPage.approach.statement),
    items: iconText((d) => d.servicesPage.approach.items),
  },
  "services.faq": { heading: heading((d) => d.servicesPage.faq) },

  "videos.hero": hero("videos"),
  "videos.intro": {
    heading: heading((d) => d.videosPage.intro),
    chips: (["CirclePlay", "House", "Lightbulb"] as const).map((icon, i) => ({ icon, label: both((d) => d.videosPage.intro.chips[i]) })),
    channelLabel: both((d) => d.common.visitChannel),
  },
  "videos.grid": { heading: heading((d) => d.videosPage.grid, false) },

  "articles.hero": hero("articles"),
  "articles.featured": { heading: heading((d) => d.articlesPage.intro), featuredLabel: both((d) => d.articlesPage.featuredLabel) },
  "articles.latest": { heading: heading((d) => d.articlesPage.latest, false) },

  "contact.hero": hero("contact"),
  "contact.channels": {
    heading: heading((d) => d.contactPage.intro),
    phone: { title: both((d) => d.contactPage.cards.phone.title), text: both((d) => d.contactPage.cards.phone.text), action: both((d) => d.contactPage.cards.phone.action) },
    whatsapp: {
      title: both((d) => d.contactPage.cards.whatsapp.title),
      text: both((d) => d.contactPage.cards.whatsapp.text),
      action: both((d) => d.contactPage.cards.whatsapp.action),
    },
    location: { title: both((d) => d.contactPage.cards.location.title), text: both((d) => d.contactPage.cards.location.text) },
    hours: { title: both((d) => d.contactPage.cards.hours.title), text: both((d) => d.contactPage.cards.hours.text) },
  },
  "contact.socials": { heading: heading((d) => d.contactPage.socials) },
  "contact.booking": {
    heading: { eyebrow: both((d) => d.contactPage.form.eyebrow), title: both((d) => d.contactPage.form.title), text: both((d) => d.contactPage.form.text ?? "") },
    nameLabel: both((d) => d.contactPage.form.name),
    phoneLabel: both((d) => d.contactPage.form.phone),
    reasonLabel: both((d) => d.contactPage.form.reason),
    reasons: both((d) => d.contactPage.form.reasons),
    messageLabel: both((d) => d.contactPage.form.message),
    submitLabel: both((d) => d.contactPage.form.submit),
    sentMessage: both((d) => d.contactPage.form.sent),
    requiredMessage: both((d) => d.contactPage.form.required),
    privacyNote: both((d) => d.contactPage.form.privacy),
    greeting: both((d) => d.contactPage.form.greeting),
    map: { eyebrow: both((d) => d.contactPage.map.eyebrow), title: both((d) => d.contactPage.map.title), pending: both((d) => d.contactPage.map.pending) },
  },

  "global.navbar": { bookCta: cta((d) => d.nav.book, "/contact#booking") },
  "global.cta": {
    eyebrow: both((d) => d.cta.eyebrow),
    title: both((d) => d.cta.title),
    lines: both((d) => [...d.cta.lines]),
    showWhatsapp: true,
    showCall: true,
    whatsappLabel: both((d) => d.cta.whatsapp),
    callLabel: both((d) => d.cta.call),
    note: both((d) => d.cta.note),
    badge: both((d) => d.home.heroBadges[0]),
    image: image("armRaise"),
  },
  "global.footer": {
    about: both((d) => d.footer.about),
    quickLinksTitle: both((d) => d.footer.quickLinks),
    servicesTitle: both((d) => d.footer.services),
    contactTitle: both((d) => d.footer.contact),
    phoneLabel: both((d) => d.footer.phone),
    whatsappLabel: both((d) => d.footer.whatsapp),
    whatsappAction: both((d) => d.cta.whatsapp),
    showServices: true,
    servicesCount: 6,
    rights: both((d) => d.footer.rights),
    backToTop: both((d) => d.footer.backToTop),
  },
};

function buildSections(): SectionRow[] {
  return PAGES.flatMap((page) =>
    page.sections.map((section, i) => {
      const content = SECTION_CONTENT[`${page.key}.${section.key}`];
      if (!content) throw new Error(`Bundled content: missing section ${page.key}.${section.key}`);
      return {
        id: stableId("section", `${page.key}.${section.key}`),
        page_key: page.key,
        key: section.key,
        type: section.type,
        sort_order: (i + 1) * 10,
        visible: true,
        content,
        published_at: null,
      };
    }),
  );
}

/* ---- Pages, settings, contact, navigation ----------------------------------------- */

const NAV: { key: string; href: string; label: Pick<string> }[] = [
  { key: "home", href: "/", label: (d) => d.nav.home },
  { key: "about", href: "/about", label: (d) => d.nav.about },
  { key: "services", href: "/services", label: (d) => d.nav.services },
  { key: "videos", href: "/videos", label: (d) => d.nav.videos },
  { key: "articles", href: "/articles", label: (d) => d.nav.articles },
  { key: "contact", href: "/contact", label: (d) => d.nav.contact },
];

function buildPages(): PageRow[] {
  return PAGES.map((page, i) => {
    const nav = NAV.find((n) => n.key === page.key);
    const hero = page.key in HERO_PHOTO ? page.key as HeroKey : null;
    const name = nav ? both(nav.label) : { ar: "عناصر مشتركة", en: "Shared elements" };
    return {
      key: page.key,
      path: page.path,
      sort_order: (i + 1) * 10,
      name_ar: name.ar,
      name_en: name.en,
      seo_title_ar: page.key === "home" || !nav ? "" : name.ar,
      seo_title_en: page.key === "home" || !nav ? "" : name.en,
      seo_description_ar: hero ? ar.heroes[hero].subtitle : "",
      seo_description_en: hero ? en.heroes[hero].subtitle : "",
      og_title_ar: "",
      og_title_en: "",
      og_description_ar: "",
      og_description_en: "",
      og_image_id: null,
      canonical_url: "",
      robots_index: true,
      robots_follow: true,
      twitter_card: "summary_large_image",
    };
  });
}

function buildSettings(): SettingsRow {
  return {
    id: 1,
    site_name_ar: ar.meta.siteName,
    site_name_en: en.meta.siteName,
    doctor_name_ar: ar.doctor.name,
    doctor_name_en: en.doctor.name,
    doctor_role_ar: ar.doctor.role,
    doctor_role_en: en.doctor.role,
    doctor_tagline_ar: ar.doctor.tagline,
    doctor_tagline_en: en.doctor.tagline,
    monogram: ar.doctor.monogram,
    logo_id: mediaId(LOGO_PATH),
    favicon_id: null,
    portrait_id: siteConfig.doctorPortrait ? mediaId(siteConfig.doctorPortrait) : null,
    default_title_ar: ar.meta.title,
    default_title_en: en.meta.title,
    default_description_ar: ar.meta.description,
    default_description_en: en.meta.description,
    og_image_id: photoId("legRaiseTable"),
    site_url: /^https:\/\/(?!www\.example\.com)/.test(siteConfig.url) ? siteConfig.url : "",
    default_locale: "ar",
    robots_index: true,
    whatsapp_digits: siteConfig.whatsapp.number,
    whatsapp_message_ar: ar.cta.whatsappMessage,
    whatsapp_message_en: en.cta.whatsappMessage,
    email: "",
    address_ar: ar.contactPage.cards.location.value,
    address_en: en.contactPage.cards.location.value,
    hours_ar: ar.contactPage.cards.hours.value,
    hours_en: en.contactPage.cards.hours.value,
    map_embed_url: siteConfig.mapEmbedUrl,
    map_link_url: "",
  };
}

const PHONE_LABELS: L[] = [
  { ar: "للحجز", en: "Bookings" },
  { ar: "للاستفسار", en: "Enquiries" },
];

function buildPhones(): PhoneRow[] {
  return siteConfig.phones.map((p, i) => ({
    id: stableId("phone", p.e164),
    label_ar: PHONE_LABELS[i]?.ar ?? "",
    label_en: PHONE_LABELS[i]?.en ?? "",
    display: p.display,
    digits: p.e164,
    sort_order: (i + 1) * 10,
    visible: true,
  }));
}

function buildSocials(): SocialRow[] {
  return siteConfig.socials.map((s, i) => ({ id: stableId("social", s.platform), platform: s.platform, url: s.href, sort_order: (i + 1) * 10, visible: true }));
}

function buildNavigation(): NavRow[] {
  return NAV.map((n, i) => ({
    id: stableId("nav", n.key),
    key: n.key,
    parent_id: null,
    href: n.href,
    label_ar: n.label(ar),
    label_en: n.label(en),
    sort_order: (i + 1) * 10,
    visible: true,
    show_in_header: true,
    show_in_footer: true,
    open_in_new_tab: false,
  }));
}

/* ---- Collections ------------------------------------------------------------------------ */

const order = (i: number) => (i + 1) * 10;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function buildServices(): ServiceRow[] {
  return ar.services.map((s, i) => ({
    id: stableId("service", s.slug),
    slug: s.slug,
    icon: s.icon,
    image_id: photoId(s.photo),
    featured: i < 3,
    sort_order: order(i),
    status: "published",
    title_ar: s.title,
    title_en: en.services[i].title,
    summary_ar: s.summary,
    summary_en: en.services[i].summary,
    points_ar: s.points,
    points_en: en.services[i].points,
  }));
}

function buildConditions(): ConditionRow[] {
  return ar.conditions.map((c, i) => ({
    id: stableId("condition", c.id),
    slug: c.id,
    icon: c.icon,
    image_id: photoId(c.photo),
    sort_order: order(i),
    status: "published",
    region_ar: c.region,
    region_en: en.conditions[i].region,
    text_ar: c.text,
    text_en: en.conditions[i].text,
    items_ar: c.items,
    items_en: en.conditions[i].items,
  }));
}

function buildProcess(): ProcessStepRow[] {
  return ar.process.map((p, i) => ({
    id: stableId("process", `step-${i + 1}`),
    key: `step-${i + 1}`,
    icon: p.icon,
    sort_order: order(i),
    status: "published",
    title_ar: p.title,
    title_en: en.process[i].title,
    text_ar: p.text,
    text_en: en.process[i].text,
  }));
}

const STAT_KEYS = ["years", "patients", "sessions", "satisfaction"];

function buildStats(): StatRow[] {
  return ar.stats.map((s, i) => ({
    id: stableId("stat", STAT_KEYS[i] ?? `stat-${i + 1}`),
    key: STAT_KEYS[i] ?? `stat-${i + 1}`,
    icon: s.icon,
    value: s.value,
    sort_order: order(i),
    status: "published",
    label_ar: s.label,
    label_en: en.stats[i].label,
  }));
}

function buildVideos(): VideoRow[] {
  return ar.videos.map((v, i) => {
    const slug = slugify(en.videos[i].title) || v.id;
    return {
      id: stableId("video", slug),
      slug,
      source: "youtube",
      youtube_id: v.youtubeId || null,
      video_url: null,
      file_id: null,
      poster_id: photoId(v.photo),
      featured: i < 3,
      sort_order: order(i),
      status: "published",
      category_ar: v.category,
      category_en: en.videos[i].category,
      title_ar: v.title,
      title_en: en.videos[i].title,
      description_ar: v.description,
      description_en: en.videos[i].description,
    };
  });
}

function buildArticleCategories(): ArticleCategoryRow[] {
  const seen = new Map<string, ArticleCategoryRow>();
  ar.articles.forEach((a, i) => {
    const key = slugify(en.articles[i].category);
    if (!seen.has(key)) seen.set(key, { id: stableId("category", key), key, sort_order: order(seen.size), name_ar: a.category, name_en: en.articles[i].category });
  });
  return [...seen.values()];
}

function buildArticles(): ArticleRow[] {
  return ar.articles.map((a, i) => {
    const e = en.articles[i];
    return {
      id: stableId("article", a.slug),
      slug: a.slug,
      category_id: stableId("category", slugify(e.category)),
      cover_id: photoId(a.photo),
      og_image_id: null,
      published_on: a.date ?? null,
      featured: i === 0,
      sort_order: order(i),
      status: "published",
      title_ar: a.title,
      title_en: e.title,
      excerpt_ar: a.excerpt,
      excerpt_en: e.excerpt,
      author_ar: "",
      author_en: "",
      cover_alt_ar: "",
      cover_alt_en: "",
      body_ar: blocksToDoc(a.body),
      body_en: blocksToDoc(e.body),
      seo_title_ar: "",
      seo_title_en: "",
      seo_description_ar: "",
      seo_description_en: "",
    };
  });
}

function buildTestimonials(): TestimonialRow[] {
  return ar.home.testimonials.items.map((t, i) => ({
    id: stableId("testimonial", `placeholder-${i + 1}`),
    key: `placeholder-${i + 1}`,
    rating: null,
    avatar_id: null,
    is_placeholder: true,
    sort_order: order(i),
    status: "published",
    quote_ar: t.quote,
    quote_en: en.home.testimonials.items[i].quote,
    name_ar: t.name,
    name_en: en.home.testimonials.items[i].name,
    meta_ar: t.meta,
    meta_en: en.home.testimonials.items[i].meta,
  }));
}

function buildFaqs(): FaqRow[] {
  const group = (key: "home" | "services", list: Pick<{ q: string; a: string }[]>): FaqRow[] =>
    list(ar).map((f, i) => ({
      id: stableId("faq", `${key}-${i + 1}`),
      group_key: key,
      sort_order: order(i),
      status: "published",
      question_ar: f.q,
      question_en: list(en)[i].q,
      answer_ar: f.a,
      answer_en: list(en)[i].a,
    }));
  return [...group("home", (d) => d.home.faq.items), ...group("services", (d) => d.servicesPage.faq.items)];
}

function buildCredentials(): CredentialRow[] {
  const rows: CredentialRow[] = [];
  const add = (kind: CredentialRow["kind"], i: number, v: L<{ title: string; place: string; period: string; text?: string }>) =>
    rows.push({
      id: stableId("credential", `${kind}-${i + 1}`),
      kind,
      sort_order: order(i),
      status: "published",
      title_ar: v.ar.title,
      title_en: v.en.title,
      place_ar: v.ar.place,
      place_en: v.en.place,
      period_ar: v.ar.period,
      period_en: v.en.period,
      text_ar: v.ar.text ?? "",
      text_en: v.en.text ?? "",
    });
  ar.about.education.items.forEach((_, i) => add("education", i, both((d) => d.about.education.items[i])));
  ar.about.experience.items.forEach((_, i) => add("experience", i, both((d) => d.about.experience.items[i])));
  ar.about.certifications.items.forEach((_, i) =>
    add("certification", i, both((d) => ({ title: d.about.certifications.items[i].title, place: d.about.certifications.items[i].issuer, period: d.about.certifications.items[i].year }))),
  );
  return rows;
}

/* ---- Interface text ---------------------------------------------------------------------- */

const NOT_FOUND: Record<"title" | "text" | "action", L> = {
  title: { ar: "الصفحة غير موجودة", en: "Page not found" },
  text: { ar: "ربما تم نقل الصفحة أو أن الرابط غير صحيح. لنعد بك إلى المسار الصحيح.", en: "The page may have moved or the link may be incorrect. Let's get you back on track." },
  action: { ar: "العودة للرئيسية", en: "Back to home" },
};

function buildUiStrings(): UiStringRow[] {
  const value = (key: string): L => {
    const [group, name] = key.split(".");
    if (group === "notFound") return NOT_FOUND[name as keyof typeof NOT_FOUND];
    if (key === "faq.askText") return both((d) => d.home.faq.text ?? "");
    return both((d) => (d as unknown as Record<string, Record<string, string>>)[group][name]);
  };
  const keys = [
    "common.readMore", "common.learnMore", "common.watch", "common.visitChannel", "common.backToArticles", "common.close",
    "common.minRead", "common.related", "common.recommended", "common.disclaimer", "common.videoSoonTitle", "common.videoSoonText",
    "common.home", "common.breadcrumb", "common.scroll", "nav.primary", "nav.openMenu", "nav.closeMenu", "nav.language",
    "panel.follow", "panel.call", "panel.label", "common.questions", "faq.askText", "common.portraitNote",
    "notFound.title", "notFound.text", "notFound.action",
  ];
  return keys.map((key) => {
    const v = value(key);
    return { key, value_ar: v.ar, value_en: v.en };
  });
}

/* ---- Snapshot -------------------------------------------------------------------------- */

export function buildBundledSnapshot(): CmsSnapshot {
  return {
    preview: false,
    settings: buildSettings(),
    phones: buildPhones(),
    socials: buildSocials(),
    navigation: buildNavigation(),
    pages: buildPages(),
    sections: buildSections(),
    media: buildMedia(),
    services: buildServices(),
    conditions: buildConditions(),
    processSteps: buildProcess(),
    stats: buildStats(),
    videos: buildVideos(),
    articleCategories: buildArticleCategories(),
    articles: buildArticles(),
    testimonials: buildTestimonials(),
    faqs: buildFaqs(),
    credentials: buildCredentials(),
    uiStrings: buildUiStrings(),
  };
}
