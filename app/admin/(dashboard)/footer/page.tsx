import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GlobalSectionEditor } from "@/components/admin/sections/global-section";

export const metadata: Metadata = { title: "Footer" };

export default function FooterPage() {
  return (
    <GlobalSectionEditor sectionKey="footer" title="Footer" description="Texts of the footer on every page.">
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { href: "/admin/navigation", text: "Footer links are the menu items marked “Show in footer”." },
          { href: "/admin/contact", text: "Phone numbers, WhatsApp, email and address come from Contact information." },
          { href: "/admin/social", text: "The social icons come from Social media." },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="flex items-start justify-between gap-3 rounded-2xl border border-aqua-500/30 bg-aqua-50/80 px-4 py-3 text-sm hover:border-aqua-600">
            {n.text}
            <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-aqua-700" />
          </Link>
        ))}
      </div>
    </GlobalSectionEditor>
  );
}
