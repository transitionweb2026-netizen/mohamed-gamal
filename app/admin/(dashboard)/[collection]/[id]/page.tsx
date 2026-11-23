import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getRecordDoc, getReferenceOptions } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { emptyDoc, isUuid } from "@/lib/cms/fields";
import { collectionByRoute } from "@/lib/cms/registry";
import { RecordEditor } from "@/components/admin/collections/record-editor";
import { MediaProvider } from "@/components/admin/media/media-context";

export async function generateMetadata({ params }: PageProps<"/admin/[collection]/[id]">): Promise<Metadata> {
  const { collection, id } = await params;
  const def = collectionByRoute(collection);
  return { title: def ? `${id === "new" ? "New" : "Edit"} ${def.singular.toLowerCase()}` : "Edit" };
}

/** Editor of one item; /admin/<collection>/new creates one. */
export default async function RecordPage({ params, searchParams }: PageProps<"/admin/[collection]/[id]">) {
  const { collection, id } = await params;
  const def = collectionByRoute(collection);
  if (!def || (id !== "new" && !isUuid(id))) notFound();
  const session = await requireAdmin();
  const [basics, references] = await Promise.all([editorBasics(session), getReferenceOptions(session.db)]);

  let doc: Record<string, unknown>;
  let status: "draft" | "published" | null = def.hasStatus ? "draft" : null;
  let updatedAt: string | null = null;
  if (id === "new") {
    doc = emptyDoc(def.fields);
    // Presets from the list's filter (e.g. ?kind=education, ?group=services).
    const query = await searchParams;
    for (const field of def.fields) {
      const preset = query[field.key];
      if (field.type === "select" && typeof preset === "string" && field.options.some((o) => o.value === preset)) doc[field.key] = preset;
    }
    if (def.key === "articles") doc.publishedOn = new Date().toISOString().slice(0, 10);
  } else {
    const record = await getRecordDoc(session.db, def, id);
    if (!record) notFound();
    doc = record.doc;
    status = record.status;
    updatedAt = record.updatedAt;
  }

  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <RecordEditor key={id} def={def} id={id === "new" ? null : id} initial={doc} status={status} updatedAt={updatedAt} references={references} />
    </MediaProvider>
  );
}
