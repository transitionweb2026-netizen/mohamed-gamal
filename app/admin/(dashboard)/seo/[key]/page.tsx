import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { savePageSeo } from "@/lib/cms/admin/actions/settings";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getPageSeoDoc } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { pageDef, pageSeoFields } from "@/lib/cms/registry";
import { FieldsForm } from "@/components/admin/form/fields-form";
import { MediaProvider } from "@/components/admin/media/media-context";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Page SEO" };

export default async function PageSeoPage({ params }: PageProps<"/admin/seo/[key]">) {
  const { key } = await params;
  const def = pageDef(key);
  if (!def || def.path === null) notFound();
  const session = await requireAdmin();
  const [doc, basics] = await Promise.all([getPageSeoDoc(session.db, key), editorBasics(session)]);
  if (!doc) notFound();
  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <Link href="/admin/seo" className="ad-muted mb-2 inline-flex items-center gap-1.5 text-sm hover:text-ink-900">
        <ArrowLeft size={15} /> SEO
      </Link>
      <PageHeader title={`SEO · ${def.label}`} description={`Search and sharing details of ${def.path}. Empty fields use the website defaults.`} />
      <FieldsForm fields={pageSeoFields} initial={doc} action={savePageSeo.bind(null, key)} />
    </MediaProvider>
  );
}
