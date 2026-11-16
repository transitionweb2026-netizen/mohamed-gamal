import type { IconName } from "@/components/ui/icon";
import type { PhotoKey } from "./media";

/**
 * Content model shared by the Arabic and English dictionaries.
 *
 * Placeholder convention: any text wrapped in [[double brackets]] is
 * rendered with the `.ph` highlight so missing information is easy to
 * spot on the page and in the code (search the repo for "[[").
 */

export interface HeroCopy {
  eyebrow: string;
  /** Two-word title: the second word gets the cyan treatment. */
  title: [string, string];
  subtitle: string;
}

export interface Service {
  slug: string;
  icon: IconName;
  photo: PhotoKey;
  title: string;
  summary: string;
  points: string[];
}

export interface ConditionGroup {
  id: string;
  icon: IconName;
  photo: PhotoKey;
  region: string;
  text: string;
  items: string[];
}

export interface Video {
  id: string;
  /** ⚠ PLACEHOLDER — the YouTube video ID (the part after "v=" in the URL). Empty = "coming soon" state. */
  youtubeId: string;
  photo: PhotoKey;
  category: string;
  title: string;
  description: string;
}

export type ArticleBlock = { type: "p"; text: string } | { type: "h"; text: string } | { type: "list"; items: string[] };

export interface Article {
  slug: string;
  photo: PhotoKey;
  category: string;
  title: string;
  excerpt: string;
  /** Optional ISO date (YYYY-MM-DD). Hidden when empty — add real publication dates when available. */
  date?: string;
  body: ArticleBlock[];
}

export interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

export interface Step extends Feature {
  tag: string;
}

export interface Stat {
  value: string;
  label: string;
  icon: IconName;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  meta: string;
}

export interface TimelineEntry {
  title: string;
  place: string;
  period: string;
  text?: string;
}

export interface SectionHead {
  eyebrow: string;
  title: string;
  text?: string;
}

export interface Dictionary {
  meta: { siteName: string; title: string; description: string };
  doctor: { name: string; role: string; monogram: string; tagline: string };
  nav: {
    home: string;
    about: string;
    services: string;
    videos: string;
    articles: string;
    contact: string;
    book: string;
    openMenu: string;
    closeMenu: string;
    switchTo: string;
    language: string;
    primary: string;
  };
  common: {
    readMore: string;
    learnMore: string;
    watch: string;
    allServices: string;
    allVideos: string;
    allArticles: string;
    aboutDoctor: string;
    minRead: string;
    home: string;
    breadcrumb: string;
    scroll: string;
    close: string;
    videoSoonTitle: string;
    videoSoonText: string;
    visitChannel: string;
    portraitNote: string;
    disclaimer: string;
    related: string;
    backToArticles: string;
    questions: string;
    recommended: string;
    explorerHint: string;
  };
  panel: { follow: string; call: string; label: string };
  heroes: Record<"home" | "about" | "services" | "videos" | "articles" | "contact", HeroCopy>;
  cta: { eyebrow: string; title: string; lines: [string, string]; whatsapp: string; call: string; whatsappMessage: string; note: string };
  footer: {
    about: string;
    quickLinks: string;
    services: string;
    contact: string;
    rights: string;
    backToTop: string;
    address: string;
    hours: string;
    phone: string;
    whatsapp: string;
  };
  services: Service[];
  conditions: ConditionGroup[];
  process: Step[];
  stats: Stat[];
  videos: Video[];
  articles: Article[];
  home: {
    heroActions: { primary: string; secondary: string };
    heroBadges: string[];
    intro: SectionHead & { paragraphs: string[]; points: Feature[]; signatureRole: string };
    services: SectionHead;
    why: SectionHead & { items: Feature[] };
    specialties: SectionHead;
    stats: SectionHead;
    journey: SectionHead;
    videos: SectionHead;
    articles: SectionHead;
    testimonials: SectionHead & { items: Testimonial[] };
    faq: SectionHead & { items: Faq[] };
  };
  about: {
    intro: SectionHead & { paragraphs: string[]; highlights: Feature[] };
    bio: SectionHead & { paragraphs: string[]; quote: string };
    education: SectionHead & { items: TimelineEntry[] };
    experience: SectionHead & { items: TimelineEntry[] };
    certifications: SectionHead & { items: { title: string; issuer: string; year: string }[] };
    philosophy: SectionHead & { quote: string; pillars: Feature[] };
    values: SectionHead & { items: Feature[] };
    stats: SectionHead;
  };
  servicesPage: {
    intro: SectionHead & { paragraphs: string[]; highlights: Feature[] };
    main: SectionHead;
    all: SectionHead;
    conditions: SectionHead;
    process: SectionHead;
    approach: SectionHead & { items: Feature[]; statement: string };
    faq: SectionHead & { items: Faq[] };
  };
  videosPage: { intro: SectionHead & { chips: string[] }; grid: SectionHead };
  articlesPage: { intro: SectionHead; featuredLabel: string; latest: SectionHead };
  contactPage: {
    intro: SectionHead;
    cards: {
      phone: { title: string; text: string; action: string };
      whatsapp: { title: string; text: string; action: string };
      location: { title: string; text: string; value: string };
      hours: { title: string; text: string; value: string };
    };
    socials: SectionHead;
    map: SectionHead & { pending: string };
    form: SectionHead & {
      name: string;
      phone: string;
      reason: string;
      reasons: string[];
      message: string;
      submit: string;
      sent: string;
      required: string;
      privacy: string;
      greeting: string;
    };
  };
}
