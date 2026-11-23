import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listRecords } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { collectionByRoute } from "@/lib/cms/registry";
import { RecordTable } from "@/components/admin/collections/record-table";
import { SectionTabs } from "@/components/admin/collections/section-tabs";
import { PageHeader } from "@/components/admin/ui/primitives";

export async function generateMetadata({ params }: PageProps<"/admin/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  return { title: collectionByRoute(collection)?.label ?? "Content" };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/admin/[collection]">) {
  const { collection } = await params;
  const def = collectionByRoute(collection);
  if (!def) notFound();
  const session = await requireAdmin();
  const rows = await listRecords(session, def);
  const query = await searchParams;
  const preset = def.filter ? query[def.filter.column === "group_key" ? "group" : def.filter.column] : undefined;

  return (
    <>
      <PageHeader eyebrow="Content" title={def.label} description={def.description} />
      <SectionTabs current={`/admin/${def.route}`} />
      <RecordTable def={def} rows={rows} preset={typeof preset === "string" ? preset : undefined} />
    </>
  );
}
