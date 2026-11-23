import type { Metadata } from "next";
import { saveSettings } from "@/lib/cms/admin/actions/settings";
import { getSettingsDoc, listPhones } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { FieldsForm } from "@/components/admin/form/fields-form";
import { PhonesManager } from "@/components/admin/settings/phones-manager";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Contact information" };

const KEYS = ["whatsappDigits", "whatsappMessage", "email", "address", "hours", "mapEmbedUrl", "mapLinkUrl"];

export default async function ContactPage() {
  const session = await requireAdmin();
  const [{ fields, doc }, phones] = await Promise.all([getSettingsDoc(session.db, KEYS), listPhones(session.db)]);
  return (
    <>
      <PageHeader
        eyebrow="Site-wide"
        title="Contact information"
        description="Used everywhere on the website: the hero contact panels, the contact page, the booking form (WhatsApp), the global call to action and the footer."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <FieldsForm fields={fields} initial={doc} action={saveSettings.bind(null, KEYS)} title="WhatsApp, email, address and map" description="Empty fields are simply not shown on the website." />
        <PhonesManager phones={phones} />
      </div>
    </>
  );
}
