/**
 * What the public website renders: the CMS snapshot resolved for one
 * language (texts picked, images turned into URLs, hidden sections and
 * unpublished items removed). Built by lib/cms/reader.ts.
 */
import type { RichDoc } from "./richtext";
import type { CredentialKind, Locale, SocialPlatform, VideoSource } from "./types";

export interface Img {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  /** CSS object-position (focal point), e.g. "50% 30%". */
  position: string;
}

export interface LinkView {
  label: string;
  href: string;
}

export interface HeadingView {
  eyebrow: string;
  title: string;
  text?: string;
}

export interface IconTextView {
  icon: string;
  title: string;
  text: string;
}

export interface IconLabelView {
  icon: string;
  label: string;
}

/* ---- Section contents (by section type) --------------------------------------------- */

export interface HeroView {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  image: Img | null;
  primaryCta: LinkView | null;
  secondaryCta: LinkView | null;
  badges: IconLabelView[];
}

export interface HomeIntroView {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  points: IconTextView[];
  signatureRole: string;
  cta: LinkView | null;
  image: Img | null;
  secondaryImage: Img | null;
}

export interface HeadingCtaView {
  heading: HeadingView;
  cta: LinkView | null;
}

export interface FeaturesView {
  heading: HeadingView;
  items: IconTextView[];
  image: Img | null;
}

export interface SpecialtiesView {
  heading: HeadingView;
  hint: string;
  cta: LinkView | null;
}

export interface StatsSectionView {
  eyebrow: string;
  title: string;
  image: Img | null;
}

export interface HeadingOnlyView {
  heading: HeadingView;
}

export interface AboutIntroView {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  highlights: IconTextView[];
}

export interface BioView {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  quote: string;
}

export interface HeadingImageView {
  heading: HeadingView;
  image: Img | null;
}

export interface PhilosophyView {
  eyebrow: string;
  title: string;
  quote: string;
  pillars: IconTextView[];
  image: Img | null;
}

export interface ValuesView {
  heading: HeadingView;
  items: IconTextView[];
}

export interface ServicesIntroView {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  highlights: IconTextView[];
  cardTitle: string;
  cardText: string;
  image: Img | null;
  secondaryImage: Img | null;
}

export interface ApproachView {
  eyebrow: string;
  title: string;
  statement: string;
  items: IconTextView[];
}

export interface VideosIntroView {
  heading: HeadingView;
  chips: IconLabelView[];
  channelLabel: string;
}

export interface ArticlesFeaturedView {
  heading: HeadingView;
  featuredLabel: string;
}

export interface ContactChannelsView {
  heading: HeadingView;
  phone: { title: string; text: string; action: string };
  whatsapp: { title: string; text: string; action: string };
  location: { title: string; text: string };
  hours: { title: string; text: string };
}

export interface ContactFormView {
  heading: HeadingView;
  nameLabel: string;
  phoneLabel: string;
  reasonLabel: string;
  reasons: string[];
  messageLabel: string;
  submitLabel: string;
  sentMessage: string;
  requiredMessage: string;
  privacyNote: string;
  greeting: string;
  map: { eyebrow: string; title: string; pending: string };
}

export interface NavbarView {
  bookCta: LinkView | null;
}

export interface SiteCtaView {
  eyebrow: string;
  title: string;
  lines: string[];
  showWhatsapp: boolean;
  showCall: boolean;
  whatsappLabel: string;
  callLabel: string;
  note: string;
  badge: string;
  image: Img | null;
}

export interface SiteFooterView {
  about: string;
  quickLinksTitle: string;
  servicesTitle: string;
  contactTitle: string;
  phoneLabel: string;
  whatsappLabel: string;
  whatsappAction: string;
  showServices: boolean;
  servicesCount: number;
  rights: string;
  backToTop: string;
}

/* ---- Pages ------------------------------------------------------------------------------ */

export interface SectionView<T = Record<string, unknown>> {
  id: string;
  key: string;
  type: string;
  content: T;
}

export interface SeoView {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: Img | null;
  canonical: string;
  index: boolean;
  follow: boolean;
  twitterCard: "summary" | "summary_large_image";
}

export interface PageView {
  key: string;
  path: string;
  name: string;
  seo: SeoView;
  /** Visible sections, in their CMS order. */
  sections: SectionView[];
}

/* ---- Collections ---------------------------------------------------------------------------- */

export interface ServiceView {
  slug: string;
  icon: string;
  image: Img | null;
  featured: boolean;
  title: string;
  summary: string;
  points: string[];
}

export interface ConditionView {
  slug: string;
  icon: string;
  image: Img | null;
  region: string;
  text: string;
  items: string[];
}

export interface StepView {
  tag: string;
  icon: string;
  title: string;
  text: string;
}

export interface StatView {
  value: string;
  label: string;
  icon: string;
}

export interface VideoView {
  id: string;
  slug: string;
  source: VideoSource;
  youtubeId: string | null;
  /** Playable file address (uploaded file or external URL). */
  fileUrl: string | null;
  poster: Img | null;
  featured: boolean;
  category: string;
  title: string;
  description: string;
}

export interface ArticleView {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string | null;
  dateLabel: string | null;
  cover: Img | null;
  ogImage: Img | null;
  body: RichDoc;
  minutes: number;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
}

export interface TestimonialView {
  quote: string;
  name: string;
  meta: string;
  rating: number | null;
  avatar: Img | null;
  isPlaceholder: boolean;
}

export interface FaqView {
  q: string;
  a: string;
}

export interface CredentialView {
  title: string;
  place: string;
  period: string;
  text: string;
}

export interface NavItemView {
  key: string;
  label: string;
  href: string;
  newTab: boolean;
  children: NavItemView[];
}

export interface PhoneView {
  label: string;
  display: string;
  digits: string;
}

/* ---- Whole site ----------------------------------------------------------------------------- */

export interface SiteView {
  locale: Locale;
  dir: "rtl" | "ltr";
  /** True when an administrator is previewing unpublished content. */
  preview: boolean;
  identity: {
    siteName: string;
    doctorName: string;
    doctorRole: string;
    tagline: string;
    monogram: string;
    logo: Img | null;
    portrait: Img | null;
    favicon: { src: string; type: string } | null;
    siteUrl: string;
    defaultTitle: string;
    defaultDescription: string;
    ogImage: Img | null;
    robotsIndex: boolean;
    defaultLocale: Locale;
  };
  contact: {
    phones: PhoneView[];
    whatsappDigits: string;
    whatsappMessage: string;
    email: string;
    address: string;
    hours: string;
    mapEmbedUrl: string;
    mapLinkUrl: string;
  };
  socials: { platform: SocialPlatform; href: string }[];
  nav: { header: NavItemView[]; footer: NavItemView[] };
  ui: Record<string, string>;
  pages: Record<string, PageView>;
  global: { navbar: NavbarView | null; cta: SiteCtaView | null; footer: SiteFooterView | null };
  services: ServiceView[];
  conditions: ConditionView[];
  process: StepView[];
  stats: StatView[];
  videos: VideoView[];
  articles: ArticleView[];
  testimonials: TestimonialView[];
  faqs: { home: FaqView[]; services: FaqView[] };
  credentials: Record<CredentialKind, CredentialView[]>;
}
