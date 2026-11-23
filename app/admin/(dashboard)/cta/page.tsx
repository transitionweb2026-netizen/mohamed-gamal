import type { Metadata } from "next";
import { GlobalSectionEditor } from "@/components/admin/sections/global-section";

export const metadata: Metadata = { title: "Global call to action" };

export default function CtaPage() {
  return (
    <GlobalSectionEditor
      sectionKey="cta"
      title="Global call to action"
      description="The booking invitation shown immediately before the footer on every page. The WhatsApp and phone numbers come from Contact information."
    />
  );
}
