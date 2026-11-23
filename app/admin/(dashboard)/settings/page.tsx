import type { Metadata } from "next";
import Link from "next/link";
import { saveSettings } from "@/lib/cms/admin/actions/settings";
import { editorBasics } from "@/lib/cms/admin/page-data";
import { getSettingsDoc, listUiStrings } from "@/lib/cms/admin/repo";
import { requireAdmin } from "@/lib/cms/admin/session";
import { FieldsForm } from "@/components/admin/form/fields-form";
import { MediaProvider } from "@/components/admin/media/media-context";
import { UiStringsForm } from "@/components/admin/settings/ui-strings-form";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata: Metadata = { title: "Website settings" };

const GENERAL = ["siteName", "defaultLocale"];
const BRAND = ["logo", "favicon"];
const TABS = [
  { key: "general", label: "General" },
  { key: "brand", label: "Logo & icon" },
  { key: "text", label: "Interface text" },
];

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const session = await requireAdmin();
  const tab = (await searchParams).tab;
  const current = TABS.some((t) => t.key === tab) ? (tab as string) : "general";
  const [general, brand, strings, basics] = await Promise.all([getSettingsDoc(session.db, GENERAL), getSettingsDoc(session.db, BRAND), listUiStrings(session.db), editorBasics(session)]);

  return (
    <MediaProvider items={basics.media} mode={basics.mode}>
      <PageHeader eyebrow="Site-wide" title="Website settings" description="The website's name, default language, logo and browser icon, and the small interface texts (buttons, labels, screen-reader texts)." />
      <nav className="ad-tabs mb-5" aria-label="Settings">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/settings?tab=${t.key}`} className="ad-tab inline-flex items-center" aria-current={current === t.key ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
      {current === "general" ? (
        <FieldsForm fields={general.fields} initial={general.doc} action={saveSettings.bind(null, GENERAL)} title="General" description="The website name is shown in browser tabs, search results and the footer." />
      ) : current === "brand" ? (
        <FieldsForm fields={brand.fields} initial={brand.doc} action={saveSettings.bind(null, BRAND)} title="Logo and browser icon" description="The logo mark is shown next to the doctor's name in the navigation bar and footer." />
      ) : (
        <UiStringsForm rows={strings} />
      )}
    </MediaProvider>
  );
}
