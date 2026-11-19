/**
 * What can be edited in the dashboard: the fields of every section type,
 * the sections of every page (in their default order), every collection,
 * the global settings, page SEO, contact details, navigation and the
 * interface texts. Labels are written for the clinic's editors.
 */
import type { Field, Option } from "./fields";
import type { SocialPlatform } from "./types";

/* ---- Building blocks ------------------------------------------------------------ */

const text = (key: string, label: string, max = 160, extra: Partial<Extract<Field, { type: "text" }>> = {}): Field => ({ type: "text", key, label, max, ...extra });
const longText = (key: string, label: string, max = 600, extra: Partial<Extract<Field, { type: "text" }>> = {}): Field =>
  text(key, label, max, { multiline: true, rows: 3, ...extra });
const lines = (key: string, label: string, itemLabel: string, maxItems = 8, max = 800, multiline = true): Field => ({ type: "stringList", key, label, itemLabel, maxItems, max, multiline });
const cta = (key: string, label: string, optional = false): Field => ({ type: "cta", key, label, optional });
const image = (key: string, label: string, help?: string): Field => ({ type: "image", key, label, help });

export const headingField = (label = "Section heading", withText = true): Field => ({
  type: "group",
  key: "heading",
  label,
  fields: [text("eyebrow", "Small label above the heading", 80), text("title", "Heading", 200, { required: true }), ...(withText ? [longText("text", "Supporting text", 500)] : [])],
});

const iconTextList = (key: string, label: string, itemLabel: string, max: number): Field => ({
  type: "list",
  key,
  label,
  itemLabel,
  max,
  fields: [{ type: "icon", key: "icon", label: "Icon" }, text("title", "Title", 100), longText("text", "Text", 300)],
});

const iconLabelList = (key: string, label: string, itemLabel: string, max: number): Field => ({
  type: "list",
  key,
  label,
  itemLabel,
  max,
  fields: [{ type: "icon", key: "icon", label: "Icon" }, text("label", "Label", 80)],
});

/* ---- Section types ------------------------------------------------------------------ */

export interface SectionTypeDef {
  label: string;
  /** What the section shows, for the dashboard. */
  description: string;
  fields: Field[];
  /** Where the repeated items of this section are edited. */
  data?: { label: string; href: string };
}

export const sectionTypes = {
  hero: {
    label: "Hero",
    description: "Full-width cover with the page title. The social / phone panel comes from Contact information.",
    fields: [
      text("eyebrow", "Small label above the title", 80),
      text("titleLead", "Title — first word(s)", 60, { required: true, help: "Shown in white." }),
      text("titleAccent", "Title — accent word(s)", 60, { help: "Shown in cyan with the animated underline." }),
      longText("subtitle", "Supporting phrase", 300),
      image("image", "Cover image", "Landscape, at least 2400 px wide. Set the focal point so faces are not cropped."),
      cta("primaryCta", "Main button", true),
      cta("secondaryCta", "Second button", true),
      iconLabelList("badges", "Floating badges (large screens)", "Badge", 3),
    ],
  },
  ticker: {
    label: "Services ticker",
    description: "Scrolling band with the titles of the published services.",
    fields: [],
    data: { label: "Services", href: "/admin/services" },
  },
  homeIntro: {
    label: "Doctor introduction",
    description: "Photo composition with the doctor's name card, text and key points.",
    fields: [
      text("eyebrow", "Small label", 80),
      text("title", "Heading", 200, { required: true }),
      lines("paragraphs", "Paragraphs", "Paragraph", 4),
      iconTextList("points", "Key points", "Point", 3),
      text("signatureRole", "Line under the doctor's name", 120),
      cta("cta", "Button"),
      image("image", "Main image", "Portrait 4:5."),
      image("secondaryImage", "Small overlapping image", "Landscape 4:3."),
    ],
  },
  homeServices: {
    label: "Key services",
    description: "One large and four small service cards (the first five published services).",
    fields: [headingField(), cta("cta", "Link to all services")],
    data: { label: "Services", href: "/admin/services" },
  },
  features: {
    label: "Feature cards",
    description: "Heading with an image and numbered feature cards.",
    fields: [headingField(), iconTextList("items", "Cards", "Card", 4), image("image", "Image")],
  },
  specialties: {
    label: "Treatment specialties",
    description: "Interactive explorer: hover a body area to preview it, click to pin it.",
    fields: [headingField(), text("hint", "Hint under the list", 160), cta("cta", "Link in the panel")],
    data: { label: "Conditions", href: "/admin/conditions" },
  },
  stats: {
    label: "Statistics",
    description: "Image with the title on it, beside the 2 × 2 statistic cards.",
    fields: [text("eyebrow", "Small label", 80), text("title", "Title on the image", 160, { required: true }), image("image", "Image")],
    data: { label: "Statistics", href: "/admin/stats" },
  },
  journey: {
    label: "Treatment steps",
    description: "Heading above the treatment steps.",
    fields: [headingField()],
    data: { label: "Treatment steps", href: "/admin/process" },
  },
  homeVideos: {
    label: "Featured videos",
    description: "Up to three videos marked as featured.",
    fields: [headingField("Section heading", false), cta("cta", "Link to the video library")],
    data: { label: "Videos", href: "/admin/videos" },
  },
  homeArticles: {
    label: "Featured articles",
    description: "The featured article and the next five articles.",
    fields: [headingField("Section heading", false), cta("cta", "Link to all articles")],
    data: { label: "Articles", href: "/admin/articles" },
  },
  testimonials: {
    label: "Testimonials",
    description: "Published testimonials (three cards).",
    fields: [headingField()],
    data: { label: "Testimonials", href: "/admin/testimonials" },
  },
  faq: {
    label: "Frequently asked questions",
    description: "Questions of this page's FAQ group, with a WhatsApp card.",
    fields: [headingField()],
    data: { label: "FAQs", href: "/admin/faqs" },
  },
  aboutIntro: {
    label: "Doctor introduction",
    description: "Doctor portrait (Doctor profile) beside the introduction.",
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 160, { required: true }), lines("paragraphs", "Paragraphs", "Paragraph", 4), iconTextList("highlights", "Highlights", "Highlight", 3)],
  },
  bio: {
    label: "Biography",
    description: "Biography paragraphs with a pull quote.",
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 160, { required: true }), lines("paragraphs", "Biography paragraphs", "Paragraph", 8, 1500), longText("quote", "Pull quote", 400)],
  },
  credentialCards: {
    label: "Credential cards",
    description: "Cards of the doctor's credentials of one kind.",
    fields: [headingField()],
    data: { label: "Credentials", href: "/admin/credentials" },
  },
  credentialTimeline: {
    label: "Credential timeline",
    description: "Timeline of the doctor's experience with an image.",
    fields: [headingField(), image("image", "Image")],
    data: { label: "Credentials", href: "/admin/credentials" },
  },
  philosophy: {
    label: "Treatment philosophy",
    description: "Image with a quote and three pillars.",
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 200, { required: true }), longText("quote", "Quote on the image", 300), iconTextList("pillars", "Pillars", "Pillar", 3), image("image", "Image")],
  },
  values: {
    label: "Values",
    description: "Grid of value cards.",
    fields: [headingField(), iconTextList("items", "Values", "Value", 6)],
  },
  servicesIntro: {
    label: "Introduction",
    description: "Text with highlights beside an image collage.",
    fields: [
      text("eyebrow", "Small label", 80),
      text("title", "Heading", 200, { required: true }),
      lines("paragraphs", "Paragraphs", "Paragraph", 4),
      iconTextList("highlights", "Highlights", "Highlight", 3),
      text("cardTitle", "Collage card — title", 80),
      text("cardText", "Collage card — text", 120),
      image("image", "Tall image"),
      image("secondaryImage", "Square image"),
    ],
  },
  servicesGrid: {
    label: "Service cards",
    description: "Cards of the published services (featured or the others, depending on the section).",
    fields: [headingField()],
    data: { label: "Services", href: "/admin/services" },
  },
  conditionsGrid: {
    label: "Conditions we treat",
    description: "Cards of the published conditions.",
    fields: [headingField()],
    data: { label: "Conditions", href: "/admin/conditions" },
  },
  processTimeline: {
    label: "Treatment process",
    description: "Zig-zag timeline of the treatment steps.",
    fields: [headingField("Section heading", false)],
    data: { label: "Treatment steps", href: "/admin/process" },
  },
  approach: {
    label: "Our approach",
    description: "Statement card beside numbered principles.",
    fields: [text("eyebrow", "Small label", 80), text("title", "Heading", 200, { required: true }), longText("statement", "Statement", 400), iconTextList("items", "Principles", "Principle", 4)],
  },
  videosIntro: {
    label: "Introduction",
    description: "Introduction with three highlight chips and the channel button.",
    fields: [headingField(), iconLabelList("chips", "Highlights", "Highlight", 3), text("channelLabel", "Channel button label", 60)],
  },
  videoGrid: {
    label: "Video grid",
    description: "All published videos (3 columns on desktop).",
    fields: [headingField("Section heading", false)],
    data: { label: "Videos", href: "/admin/videos" },
  },
  articlesFeatured: {
    label: "Featured article",
    description: "The article marked as featured, as a large card.",
    fields: [headingField(), text("featuredLabel", "Badge on the featured article", 40)],
    data: { label: "Articles", href: "/admin/articles" },
  },
  articlesGrid: {
    label: "Latest articles",
    description: "The next six published articles (3 × 2).",
    fields: [headingField("Section heading", false)],
    data: { label: "Articles", href: "/admin/articles" },
  },
  contactChannels: {
    label: "Contact channels",
    description: "Phone, WhatsApp, location and hours cards. The numbers and address come from Contact information.",
    fields: [
      headingField(),
      { type: "group", key: "phone", label: "Phone card", fields: [text("title", "Title", 60), text("text", "Text", 160), text("action", "Button label", 40)] },
      { type: "group", key: "whatsapp", label: "WhatsApp card", fields: [text("title", "Title", 60), text("text", "Text", 160), text("action", "Button label", 40)] },
      { type: "group", key: "location", label: "Location card", fields: [text("title", "Title", 60), text("text", "Label", 60)] },
      { type: "group", key: "hours", label: "Hours card", fields: [text("title", "Title", 60), text("text", "Label", 60)] },
    ],
  },
  contactSocials: {
    label: "Social media",
    description: "Large tiles of the visible social links.",
    fields: [headingField()],
    data: { label: "Social media", href: "/admin/social" },
  },
  contactForm: {
    label: "Booking form and location",
    description: "The form opens WhatsApp with the visitor's details; the map comes from Contact information.",
    fields: [
      headingField("Form heading"),
      text("nameLabel", "Name field label", 60),
      text("phoneLabel", "Phone field label", 60),
      text("reasonLabel", "Reason field label", 60),
      lines("reasons", "Reasons to choose from", "Reason", 8, 80, false),
      text("messageLabel", "Message field label", 80),
      text("submitLabel", "Send button", 40),
      text("sentMessage", "Message after sending", 160),
      text("requiredMessage", "Required-field message", 80),
      text("privacyNote", "Privacy note", 200),
      text("greeting", "First line of the WhatsApp message", 80),
      { type: "group", key: "map", label: "Location card", fields: [text("eyebrow", "Small label", 60), text("title", "Title", 80), text("pending", "Text while no map is set", 200)] },
    ],
  },
  navbar: {
    label: "Navigation bar",
    description: "The button at the end of the navigation bar. Links are edited under Navigation.",
    fields: [cta("bookCta", "Booking button")],
  },
  siteCta: {
    label: "Global call to action",
    description: "Shown immediately before the footer on every page.",
    fields: [
      text("eyebrow", "Small label", 60),
      text("title", "Heading", 160, { required: true }),
      lines("lines", "Supporting lines", "Line", 2, 200, false),
      { type: "boolean", key: "showWhatsapp", label: "Show the WhatsApp button", half: true },
      { type: "boolean", key: "showCall", label: "Show the call button", half: true },
      text("whatsappLabel", "WhatsApp button label", 40),
      text("callLabel", "Call button label", 40),
      text("note", "Text before the phone numbers", 80),
      text("badge", "Badge on the image", 60),
      image("image", "Image"),
    ],
  },
  siteFooter: {
    label: "Footer",
    description: "Footer texts. Links come from Navigation (\"show in footer\"), contact details from Contact information.",
    fields: [
      longText("about", "Short description", 400),
      text("quickLinksTitle", "Links column title", 60, { half: true }),
      text("servicesTitle", "Services column title", 60, { half: true }),
      text("contactTitle", "Contact column title", 60, { half: true }),
      text("phoneLabel", "Phone label", 40, { half: true }),
      text("whatsappLabel", "WhatsApp label", 40, { half: true }),
      text("whatsappAction", "WhatsApp link text", 60, { half: true }),
      { type: "boolean", key: "showServices", label: "Show the services column" },
      { type: "number", key: "servicesCount", label: "Number of services listed", min: 1, max: 12 },
      text("rights", "Copyright text (after © year and the doctor's name)", 120),
      text("backToTop", "Back-to-top label", 40),
    ],
  },
} satisfies Record<string, SectionTypeDef>;

export type SectionType = keyof typeof sectionTypes;

/* ---- Pages and their sections -------------------------------------------------------- */

export interface SectionDef {
  key: string;
  type: SectionType;
  label: string;
}

export interface PageDef {
  key: string;
  path: string | null;
  label: string;
  sections: SectionDef[];
}

const s = (key: string, type: SectionType, label: string): SectionDef => ({ key, type, label });

export const PAGES: PageDef[] = [
  {
    key: "home",
    path: "/",
    label: "Homepage",
    sections: [
      s("hero", "hero", "Hero"),
      s("ticker", "ticker", "Services ticker"),
      s("intro", "homeIntro", "Doctor introduction"),
      s("services", "homeServices", "Key services"),
      s("why", "features", "Why choose us"),
      s("specialties", "specialties", "Treatment specialties"),
      s("stats", "stats", "Statistics"),
      s("journey", "journey", "Treatment journey"),
      s("videos", "homeVideos", "Featured videos"),
      s("articles", "homeArticles", "Featured articles"),
      s("testimonials", "testimonials", "Testimonials"),
      s("faq", "faq", "FAQ"),
    ],
  },
  {
    key: "about",
    path: "/about",
    label: "About",
    sections: [
      s("hero", "hero", "Hero"),
      s("intro", "aboutIntro", "Doctor introduction"),
      s("bio", "bio", "Biography"),
      s("education", "credentialCards", "Education & qualifications"),
      s("experience", "credentialTimeline", "Professional experience"),
      s("certifications", "credentialCards", "Certifications & training"),
      s("achievements", "credentialCards", "Achievements"),
      s("philosophy", "philosophy", "Treatment philosophy"),
      s("values", "values", "Values"),
      s("stats", "stats", "Statistics"),
    ],
  },
  {
    key: "services",
    path: "/services",
    label: "Services",
    sections: [
      s("hero", "hero", "Hero"),
      s("intro", "servicesIntro", "Introduction"),
      s("main", "servicesGrid", "Main services (featured)"),
      s("all", "servicesGrid", "All other services"),
      s("conditions", "conditionsGrid", "Conditions we treat"),
      s("process", "processTimeline", "Treatment process"),
      s("approach", "approach", "Our approach"),
      s("faq", "faq", "FAQ"),
    ],
  },
  {
    key: "videos",
    path: "/videos",
    label: "Videos",
    sections: [s("hero", "hero", "Hero"), s("intro", "videosIntro", "Introduction"), s("grid", "videoGrid", "Video grid")],
  },
  {
    key: "articles",
    path: "/articles",
    label: "Articles",
    sections: [s("hero", "hero", "Hero"), s("featured", "articlesFeatured", "Featured article"), s("latest", "articlesGrid", "Latest articles")],
  },
  {
    key: "contact",
    path: "/contact",
    label: "Contact",
    sections: [s("hero", "hero", "Hero"), s("channels", "contactChannels", "Contact channels"), s("socials", "contactSocials", "Social media"), s("booking", "contactForm", "Booking form & location")],
  },
  {
    key: "global",
    path: null,
    label: "Shared on every page",
    sections: [s("navbar", "navbar", "Navigation bar"), s("cta", "siteCta", "Global call to action"), s("footer", "siteFooter", "Footer")],
  },
];

export const PUBLIC_PAGES = PAGES.filter((p) => p.path !== null);

export function pageDef(key: string): PageDef | undefined {
  return PAGES.find((p) => p.key === key);
}

export function sectionTypeDef(type: string): SectionTypeDef | undefined {
  return (sectionTypes as Record<string, SectionTypeDef>)[type];
}

/** Which credentials a credentials section lists. */
export const CREDENTIAL_SECTIONS: Record<string, "education" | "experience" | "certification" | "achievement"> = {
  education: "education",
  experience: "experience",
  certifications: "certification",
  achievements: "achievement",
};

/* ---- Collections ---------------------------------------------------------------------- */

export type CollectionKey =
  | "services"
  | "conditions"
  | "processSteps"
  | "stats"
  | "videos"
  | "articles"
  | "articleCategories"
  | "testimonials"
  | "faqs"
  | "credentials";

export interface CollectionDef {
  key: CollectionKey;
  table: string;
  /** Dashboard address (/admin/<route>). */
  route: string;
  label: string;
  singular: string;
  description: string;
  fields: Field[];
  /** Identifier column, fixed after creation. Null = no identifier (FAQs, credentials). */
  naturalKey: "slug" | "key" | null;
  hasStatus: boolean;
  /** Column for the list's title, preferably the English one. */
  titleColumn: string;
  /** Extra columns shown in the list. */
  listColumns?: { column: string; label: string }[];
  /** Fields grouped into editor tabs (field keys). */
  tabs?: { label: string; keys: string[] }[];
  /** Filter tabs over a column (e.g. FAQ group, credential kind). */
  filter?: { column: string; label: string; options: Option[] };
  /** Thumbnail column (media id) for the list. */
  imageColumn?: string;
}

const statusLabel = "Published items are visible on the website; drafts are not.";
const slugField: Field = { type: "slug", key: "slug", label: "Identifier in the address", required: true, help: "Lowercase letters, digits and hyphens. It cannot be changed after the item is created, so links never break." };
const keyField: Field = { type: "slug", key: "key", label: "Identifier", required: true, help: "Lowercase letters, digits and hyphens. Fixed after creation." };

export const collections: Record<CollectionKey, CollectionDef> = {
  services: {
    key: "services",
    table: "services",
    route: "services",
    label: "Services",
    singular: "Service",
    description: "Treatment services: the ticker and key services on the home page, the main and other services on the services page, and the footer.",
    naturalKey: "slug",
    hasStatus: true,
    titleColumn: "title_en",
    imageColumn: "image_id",
    listColumns: [{ column: "featured", label: "Main service" }],
    fields: [
      text("title", "Title", 160, { required: true }),
      longText("summary", "Short description", 600),
      lines("points", "Key points", "Point", 8, 120, false),
      { type: "media", key: "image", kind: "image", label: "Image", help: "Landscape 4:3 works best." },
      { type: "icon", key: "icon", label: "Icon" },
      { type: "boolean", key: "featured", label: "Main service (large card on the services page)" },
      slugField,
    ],
    tabs: [
      { label: "Content", keys: ["title", "summary", "points"] },
      { label: "Media & display", keys: ["image", "icon", "featured", "slug"] },
    ],
  },
  conditions: {
    key: "conditions",
    table: "conditions",
    route: "conditions",
    label: "Conditions",
    singular: "Condition group",
    description: "Body areas and the conditions treated there: the specialty explorer (home) and the conditions grid (services).",
    naturalKey: "slug",
    hasStatus: true,
    titleColumn: "region_en",
    imageColumn: "image_id",
    fields: [
      text("region", "Body area", 120, { required: true }),
      longText("text", "Description", 600),
      lines("items", "Conditions", "Condition", 12, 80, false),
      { type: "media", key: "image", kind: "image", label: "Image" },
      { type: "icon", key: "icon", label: "Icon" },
      slugField,
    ],
  },
  processSteps: {
    key: "processSteps",
    table: "process_steps",
    route: "process",
    label: "Treatment steps",
    singular: "Step",
    description: "The treatment journey (home) and the treatment process (services). Steps are numbered in order.",
    naturalKey: "key",
    hasStatus: true,
    titleColumn: "title_en",
    fields: [text("title", "Title", 120, { required: true }), longText("text", "Text", 400), { type: "icon", key: "icon", label: "Icon" }, keyField],
  },
  stats: {
    key: "stats",
    table: "stats",
    route: "stats",
    label: "Statistics",
    singular: "Statistic",
    description: "Figures on the home and about pages. Numbers such as 15+ count up when shown.",
    naturalKey: "key",
    hasStatus: true,
    titleColumn: "label_en",
    listColumns: [{ column: "value", label: "Value" }],
    fields: [
      { type: "text", key: "value", label: "Value", localized: false, max: 24, required: true, dir: "ltr", help: "As shown, e.g. 15+, 2,000+ or 98%." },
      text("label", "Label", 120, { required: true }),
      { type: "icon", key: "icon", label: "Icon" },
      keyField,
    ],
  },
  videos: {
    key: "videos",
    table: "videos",
    route: "videos",
    label: "Videos",
    singular: "Video",
    description: "The video library (all published videos, in order) and the featured videos on the home page.",
    naturalKey: "slug",
    hasStatus: true,
    titleColumn: "title_en",
    imageColumn: "poster_id",
    listColumns: [
      { column: "source", label: "Source" },
      { column: "featured", label: "Featured" },
    ],
    fields: [
      text("title", "Title", 160, { required: true }),
      longText("description", "Description", 600),
      text("category", "Category label", 60),
      {
        type: "select",
        key: "source",
        label: "Plays from",
        options: [
          { value: "youtube", label: "YouTube video" },
          { value: "url", label: "External video address" },
          { value: "file", label: "Uploaded video file" },
        ],
      },
      { type: "pattern", key: "youtubeId", label: "YouTube video ID", pattern: "^[A-Za-z0-9_-]{11}$", patternHelp: "the 11 characters after watch?v= or shorts/ in the YouTube address.", nullable: true, dir: "ltr", when: { key: "source", equals: "youtube" }, help: "Leave empty to show “coming soon”. Vertical (Shorts) videos fit the portrait player best." },
      { type: "pattern", key: "videoUrl", label: "Video address (https://…)", pattern: "^https://[^\\s]+$", patternHelp: "a full https:// address of an MP4 or WebM file.", nullable: true, dir: "ltr", max: 2048, when: { key: "source", equals: "url" } },
      { type: "media", key: "file", kind: "video", label: "Video file", when: { key: "source", equals: "file" } },
      { type: "media", key: "poster", kind: "image", label: "Thumbnail", help: "Portrait 9:16. Without one, the YouTube thumbnail is used." },
      { type: "boolean", key: "featured", label: "Featured on the home page" },
      slugField,
    ],
    tabs: [
      { label: "Content", keys: ["title", "description", "category"] },
      { label: "Video & thumbnail", keys: ["source", "youtubeId", "videoUrl", "file", "poster"] },
      { label: "Display", keys: ["featured", "slug"] },
    ],
  },
  articles: {
    key: "articles",
    table: "articles",
    route: "articles",
    label: "Articles",
    singular: "Article",
    description: "Health articles. One article is featured (the large card); the others fill the grid and the home page.",
    naturalKey: "slug",
    hasStatus: true,
    titleColumn: "title_en",
    imageColumn: "cover_id",
    listColumns: [
      { column: "featured", label: "Featured" },
      { column: "published_on", label: "Date" },
    ],
    fields: [
      text("title", "Title", 200, { required: true }),
      longText("excerpt", "Short excerpt", 600),
      { type: "richtext", key: "body", label: "Article" },
      { type: "media", key: "cover", kind: "image", label: "Cover image" },
      text("coverAlt", "Cover description for screen readers", 400, { help: "Leave empty to use the image's own description." }),
      { type: "reference", key: "category", collection: "articleCategories", label: "Category" },
      text("author", "Author", 120),
      { type: "date", key: "publishedOn", label: "Publication date", nullable: true, help: "Leave empty to hide the date." },
      { type: "boolean", key: "featured", label: "Featured article (the large card)" },
      text("seoTitle", "Search title", 160, { help: "Leave empty to use the article title." }),
      longText("seoDescription", "Search description", 500, { help: "Leave empty to use the excerpt." }),
      { type: "media", key: "ogImage", kind: "image", label: "Sharing image", help: "Leave empty to use the cover image." },
      slugField,
    ],
    tabs: [
      { label: "Content", keys: ["title", "excerpt", "body"] },
      { label: "Cover & details", keys: ["cover", "coverAlt", "category", "author", "publishedOn", "featured", "slug"] },
      { label: "SEO", keys: ["seoTitle", "seoDescription", "ogImage"] },
    ],
  },
  articleCategories: {
    key: "articleCategories",
    table: "article_categories",
    route: "article-categories",
    label: "Article categories",
    singular: "Category",
    description: "Categories shown on article cards.",
    naturalKey: "key",
    hasStatus: false,
    titleColumn: "name_en",
    fields: [text("name", "Name", 80, { required: true }), keyField],
  },
  testimonials: {
    key: "testimonials",
    table: "testimonials",
    route: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Patient testimonials on the home page. Publish only real testimonials, with the patient's consent.",
    naturalKey: "key",
    hasStatus: true,
    titleColumn: "name_en",
    listColumns: [{ column: "is_placeholder", label: "Placeholder" }],
    fields: [
      longText("quote", "Testimonial", 1200, { required: true, rows: 5 }),
      text("name", "Patient name (or initials)", 120),
      text("meta", "Condition or context", 160),
      { type: "number", key: "rating", label: "Rating (optional, 1–5)", min: 1, max: 5, nullable: true },
      { type: "media", key: "avatar", kind: "image", label: "Photo (optional)" },
      { type: "boolean", key: "isPlaceholder", label: "This is a layout placeholder, not a real testimonial" },
      keyField,
    ],
  },
  faqs: {
    key: "faqs",
    table: "faqs",
    route: "faqs",
    label: "FAQs",
    singular: "Question",
    description: "Frequently asked questions of the home and services pages.",
    naturalKey: null,
    hasStatus: true,
    titleColumn: "question_en",
    listColumns: [{ column: "group_key", label: "Page" }],
    filter: {
      column: "group_key",
      label: "Page",
      options: [
        { value: "home", label: "Home" },
        { value: "services", label: "Services" },
      ],
    },
    fields: [
      {
        type: "select",
        key: "group",
        column: "group_key",
        label: "Shown on",
        options: [
          { value: "home", label: "Home page" },
          { value: "services", label: "Services page" },
        ],
      },
      text("question", "Question", 300, { required: true }),
      longText("answer", "Answer", 1500, { rows: 5 }),
    ],
  },
  credentials: {
    key: "credentials",
    table: "credentials",
    route: "credentials",
    label: "Credentials",
    singular: "Credential",
    description: "Education, experience, certifications and achievements on the about page.",
    naturalKey: null,
    hasStatus: true,
    titleColumn: "title_en",
    listColumns: [{ column: "kind", label: "Kind" }],
    filter: {
      column: "kind",
      label: "Kind",
      options: [
        { value: "education", label: "Education" },
        { value: "experience", label: "Experience" },
        { value: "certification", label: "Certifications" },
        { value: "achievement", label: "Achievements" },
      ],
    },
    fields: [
      {
        type: "select",
        key: "kind",
        label: "Kind",
        options: [
          { value: "education", label: "Education / qualification" },
          { value: "experience", label: "Professional experience" },
          { value: "certification", label: "Certification / training" },
          { value: "achievement", label: "Achievement" },
        ],
      },
      text("title", "Title (degree, role, certificate …)", 200, { required: true }),
      text("place", "Institution or organisation", 200),
      text("period", "Year or period", 60),
      longText("text", "Description (experience and achievements)", 600),
    ],
  },
};

export const COLLECTION_LIST = Object.values(collections);

export function collectionByRoute(route: string): CollectionDef | undefined {
  return COLLECTION_LIST.find((c) => c.route === route);
}

export { statusLabel };

/* ---- Settings, contact, SEO ------------------------------------------------------------ */

export const identityFields: Field[] = [
  text("siteName", "Website name", 120, { required: true }),
  text("doctorName", "Doctor's name", 120, { required: true }),
  text("doctorRole", "Professional title", 160),
  text("doctorTagline", "Short tagline (under the name in the navigation bar)", 120),
  { type: "text", key: "monogram", label: "Monogram (decorative letters)", localized: false, max: 4, dir: "ltr" },
];

export const brandFields: Field[] = [
  { type: "media", key: "logo", kind: "image", label: "Logo mark", help: "Square, at least 256 × 256 px. Shown next to the doctor's name." },
  { type: "media", key: "favicon", kind: "image", label: "Browser icon (favicon)", help: "Square PNG or ICO, 256 × 256 px." },
  { type: "media", key: "portrait", kind: "image", label: "Doctor portrait", help: "Portrait 4:5. Until one is set, a monogram panel is shown." },
];

export const contactFields: Field[] = [
  { type: "pattern", key: "whatsappDigits", label: "WhatsApp number", pattern: "^[0-9]{8,15}$", patternHelp: "international format, digits only (e.g. 201146540705).", dir: "ltr", placeholder: "201146540705" },
  longText("whatsappMessage", "Default WhatsApp message", 300, { rows: 2 }),
  { type: "pattern", key: "email", label: "Email", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", patternHelp: "a valid email address.", dir: "ltr" },
  longText("address", "Clinic address", 300, { rows: 2 }),
  longText("hours", "Working hours", 300, { rows: 2 }),
  { type: "pattern", key: "mapEmbedUrl", label: "Google Maps embed address", pattern: "^https://(www\\.)?google\\.[a-z.]+/maps/embed\\?[^\\s\"<>]+$", patternHelp: "the src address from Google Maps → Share → Embed a map (starts with https://www.google.com/maps/embed?).", dir: "ltr", max: 2048 },
  { type: "pattern", key: "mapLinkUrl", label: "Google Maps link (directions)", pattern: "^https://[^\\s]+$", patternHelp: "a full https:// address.", dir: "ltr", max: 2048 },
];

export const seoDefaultFields: Field[] = [
  text("defaultTitle", "Default title", 160, { required: true, help: "Used on pages without their own title, and after each page's title." }),
  longText("defaultDescription", "Default description", 500),
  { type: "media", key: "ogImage", kind: "image", label: "Default sharing image", help: "1200 × 630 px." },
  { type: "pattern", key: "siteUrl", label: "Website address", pattern: "^https://[a-z0-9.-]+(:[0-9]+)?$", patternHelp: "https:// and the domain only, e.g. https://www.drmohamedgamal.com", dir: "ltr" },
  { type: "boolean", key: "robotsIndex", label: "Allow search engines to index the website" },
];

export const localeFields: Field[] = [
  {
    type: "select",
    key: "defaultLocale",
    label: "Default language (for visitors without a saved choice)",
    options: [
      { value: "ar", label: "العربية (Arabic)" },
      { value: "en", label: "English" },
    ],
  },
];

export const settingsFields: Field[] = [...identityFields, ...brandFields, ...contactFields, ...seoDefaultFields, ...localeFields];

export const pageSeoFields: Field[] = [
  text("name", "Page name (breadcrumbs and dashboard)", 80),
  text("seoTitle", "Search title", 160, { help: "Leave empty to use the hero title." }),
  longText("seoDescription", "Search description", 500, { help: "Leave empty to use the website description." }),
  text("ogTitle", "Sharing title", 160, { help: "Leave empty to use the search title." }),
  longText("ogDescription", "Sharing description", 500),
  { type: "media", key: "ogImage", kind: "image", label: "Sharing image", help: "1200 × 630 px. Leave empty to use the hero image." },
  { type: "pattern", key: "canonicalUrl", label: "Canonical address (advanced)", pattern: "^https://[^\\s]+$", patternHelp: "a full https:// address.", dir: "ltr", max: 2048, help: "Leave empty: the page's own address is used." },
  { type: "boolean", key: "robotsIndex", label: "Allow search engines to index this page", half: true },
  { type: "boolean", key: "robotsFollow", label: "Allow search engines to follow its links", half: true },
  {
    type: "select",
    key: "twitterCard",
    label: "Card shown when shared on X / Twitter",
    options: [
      { value: "summary_large_image", label: "Large image" },
      { value: "summary", label: "Small image" },
    ],
  },
];

export const phoneFields: Field[] = [
  { type: "text", key: "display", label: "Number as shown", localized: false, max: 40, required: true, dir: "ltr", placeholder: "0114 654 0705" },
  { type: "pattern", key: "digits", label: "International digits (for calling)", pattern: "^[0-9]{8,15}$", patternHelp: "country code + number, digits only (e.g. 201146540705).", dir: "ltr", required: true },
  text("label", "Label (optional, e.g. Bookings)", 60),
];

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "snapchat", label: "Snapchat" },
  { value: "threads", label: "Threads" },
];

export const navigationFields: Field[] = [
  text("label", "Label", 80, { required: true }),
  { type: "href", key: "href", label: "Destination", help: "A site path such as /services, or a full https:// address." },
];

/* ---- Interface text --------------------------------------------------------------------- */

export interface UiStringDef {
  key: string;
  label: string;
  group: string;
}

export const UI_STRINGS: UiStringDef[] = [
  { key: "common.readMore", label: "Read more (article links)", group: "Buttons and links" },
  { key: "common.learnMore", label: "Learn more (service cards)", group: "Buttons and links" },
  { key: "common.watch", label: "Watch video", group: "Buttons and links" },
  { key: "common.visitChannel", label: "Visit the channel", group: "Buttons and links" },
  { key: "common.backToArticles", label: "Back to articles", group: "Buttons and links" },
  { key: "common.close", label: "Close (dialogs)", group: "Buttons and links" },
  { key: "common.minRead", label: "“min read” after the reading time", group: "Articles" },
  { key: "common.related", label: "Related articles (article page)", group: "Articles" },
  { key: "common.recommended", label: "Recommended articles (article popup)", group: "Articles" },
  { key: "common.disclaimer", label: "Medical disclaimer under articles", group: "Articles" },
  { key: "common.videoSoonTitle", label: "Video not published yet — title", group: "Videos" },
  { key: "common.videoSoonText", label: "Video not published yet — text", group: "Videos" },
  { key: "common.home", label: "“Home” in breadcrumbs", group: "Navigation" },
  { key: "common.breadcrumb", label: "Breadcrumb (screen readers)", group: "Navigation" },
  { key: "common.scroll", label: "Scroll cue (home hero)", group: "Navigation" },
  { key: "nav.primary", label: "Main navigation (screen readers)", group: "Navigation" },
  { key: "nav.openMenu", label: "Open menu (screen readers)", group: "Navigation" },
  { key: "nav.closeMenu", label: "Close menu (screen readers)", group: "Navigation" },
  { key: "nav.language", label: "Language switch (screen readers)", group: "Navigation" },
  { key: "panel.follow", label: "“Follow” label in the hero panel", group: "Hero contact panel" },
  { key: "panel.call", label: "“Call us” label", group: "Hero contact panel" },
  { key: "panel.label", label: "Contact panel (screen readers)", group: "Hero contact panel" },
  { key: "common.questions", label: "FAQ card — title", group: "FAQ" },
  { key: "faq.askText", label: "FAQ card — text", group: "FAQ" },
  { key: "common.portraitNote", label: "Label on the portrait placeholder", group: "Doctor" },
  { key: "notFound.title", label: "Page not found — title", group: "Page not found" },
  { key: "notFound.text", label: "Page not found — text", group: "Page not found" },
  { key: "notFound.action", label: "Page not found — button", group: "Page not found" },
];

export type UiKey = (typeof UI_STRINGS)[number]["key"];
