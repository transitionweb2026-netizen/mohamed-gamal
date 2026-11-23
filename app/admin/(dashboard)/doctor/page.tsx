import type { Metadata } from "next";
import { saveSettings } from "@/lib/cms/admin/actions/settings";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getSettingsDoc } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { SectionTabs } from "@/components/admin/collections/section-tabs";
import { FieldsForm } from "@/components/admin/form/fields-form";
import { MediaProvider } from "@/components/admin/media/media-context";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Doctor profile" };

const KEYS = ["doctorName", "doctorRole", "doctorTagline", "monogram", "portrait"];

export default async function DoctorPage() {
  const session = await requireAdmin();
  const [{ fields, doc }, basics] = await Promise.all([getSettingsDoc(session.db, KEYS), editorBasics(session)]);
  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader
        eyebrow="Clinic"
        title="Doctor profile"
        description="The doctor's name, title and portrait appear in the navigation bar, the hero panels, the about page, the footer and search results. Qualifications and figures are edited under Credentials and Statistics."
      />
      <SectionTabs current="/admin/doctor" />
      <FieldsForm fields={fields} initial={doc} action={saveSettings.bind(null, KEYS)} title="Name and portrait" description="Write only verified information — titles and qualifications are shown to patients as stated." />
    </MediaProvider>
  );
}
