import {
  Activity,
  BookOpenText,
  Compass,
  FileText,
  Home,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageSquareQuote,
  Phone,
  Search,
  Settings,
  Share2,
  Stethoscope,
  UserRound,
  Users,
  Video,
  CircleHelp,
  PanelBottom,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Other addresses that belong to this item (highlighted together). */
  match?: string[];
  ownerOnly?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Website content",
    items: [
      { label: "Website pages", href: "/admin/pages", icon: LayoutTemplate, match: ["/admin/pages/services", "/admin/pages/videos", "/admin/pages/articles", "/admin/pages/contact", "/admin/pages/global"] },
      { label: "Homepage", href: "/admin/pages/home", icon: Home },
      { label: "About page", href: "/admin/pages/about", icon: BookOpenText },
      { label: "Services", href: "/admin/services", icon: Stethoscope, match: ["/admin/conditions", "/admin/process"] },
      { label: "Videos", href: "/admin/videos", icon: Video },
      { label: "Articles", href: "/admin/articles", icon: FileText, match: ["/admin/article-categories"] },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
      { label: "FAQs", href: "/admin/faqs", icon: CircleHelp },
    ],
  },
  {
    label: "Clinic",
    items: [
      { label: "Doctor profile", href: "/admin/doctor", icon: UserRound, match: ["/admin/credentials", "/admin/stats"] },
      { label: "Media library", href: "/admin/media", icon: Images },
    ],
  },
  {
    label: "Site-wide",
    items: [
      { label: "Navigation", href: "/admin/navigation", icon: Compass },
      { label: "Global call to action", href: "/admin/cta", icon: Megaphone },
      { label: "Footer", href: "/admin/footer", icon: PanelBottom },
      { label: "Contact information", href: "/admin/contact", icon: Phone },
      { label: "Social media", href: "/admin/social", icon: Share2 },
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Website settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, ownerOnly: true },
      { label: "Activity log", href: "/admin/activity", icon: Activity },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** The sidebar item a dashboard address belongs to (longest match wins). */
export function activeNavHref(pathname: string): string | null {
  let best: { href: string; length: number } | null = null;
  for (const item of NAV_ITEMS) {
    for (const prefix of [item.href, ...(item.match ?? [])]) {
      const hit = prefix === "/admin" ? pathname === "/admin" : pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (hit && (!best || prefix.length > best.length)) best = { href: item.href, length: prefix.length };
    }
  }
  return best?.href ?? null;
}

/** Labels of address segments, for breadcrumbs. */
export const SEGMENT_LABELS: Record<string, string> = {
  pages: "Website pages",
  home: "Homepage",
  about: "About",
  services: "Services",
  videos: "Videos",
  articles: "Articles",
  contact: "Contact",
  global: "Shared sections",
  conditions: "Conditions",
  process: "Treatment steps",
  stats: "Statistics",
  "article-categories": "Article categories",
  testimonials: "Testimonials",
  faqs: "FAQs",
  credentials: "Credentials",
  doctor: "Doctor profile",
  media: "Media library",
  navigation: "Navigation",
  cta: "Global call to action",
  footer: "Footer",
  social: "Social media",
  seo: "SEO",
  settings: "Website settings",
  users: "Users",
  activity: "Activity log",
  account: "My account",
  new: "New",
};

export const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "New article", href: "/admin/articles/new", icon: FileText },
  { label: "New video", href: "/admin/videos/new", icon: Video },
  { label: "New service", href: "/admin/services/new", icon: Stethoscope },
  { label: "Upload media", href: "/admin/media?upload=1", icon: Images },
  { label: "Edit the homepage", href: "/admin/pages/home", icon: Home },
  { label: "Contact details", href: "/admin/contact", icon: Phone },
];

