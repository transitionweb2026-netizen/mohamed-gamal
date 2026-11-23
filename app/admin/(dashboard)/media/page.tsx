import type { Metadata } from "next";
import { Suspense } from "react";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { requireAdmin } from "@/lib/cms/admin/session";
import { MediaProvider } from "@/components/admin/media/media-context";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  const session = await requireAdmin();
  const basics = await editorBasics(session);
  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader
        eyebrow="Clinic"
        title="Media library"
        description="Every image, video and document of the website. Add a description for screen readers to each image. Replacing a file updates it everywhere it is used; files in use cannot be deleted."
      />
      <Suspense>
        <MediaLibrary />
      </Suspense>
    </MediaProvider>
  );
}
