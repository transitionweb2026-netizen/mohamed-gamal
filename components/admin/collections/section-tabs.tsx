import Link from "next/link";

/** Related dashboard areas shown as tabs (e.g. Services · Conditions · Treatment steps). */
const GROUPS: { href: string; label: string }[][] = [
  [
    { href: "/admin/services", label: "Services" },
    { href: "/admin/conditions", label: "Conditions" },
    { href: "/admin/process", label: "Treatment steps" },
  ],
  [
    { href: "/admin/articles", label: "Articles" },
    { href: "/admin/article-categories", label: "Categories" },
  ],
  [
    { href: "/admin/doctor", label: "Profile" },
    { href: "/admin/credentials", label: "Credentials" },
    { href: "/admin/stats", label: "Statistics" },
  ],
];

export function SectionTabs({ current }: { current: string }) {
  const group = GROUPS.find((g) => g.some((t) => t.href === current));
  if (!group) return null;
  return (
    <nav className="ad-tabs mb-5" aria-label="Related">
      {group.map((t) => (
        <Link key={t.href} href={t.href} className="ad-tab inline-flex items-center" aria-current={t.href === current ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
