"use client";

import { createContext, useContext } from "react";
import type { Img, PhoneView, SiteView } from "@/lib/cms/view";

/** The few site values client-only screens need (the 404 page, which receives no route params). */
export interface ClientSite {
  locale: SiteView["locale"];
  notFound: { title: string; text: string; action: string };
  panel: { follow: string; call: string; label: string };
  socials: SiteView["socials"];
  phones: PhoneView[];
  image: Img | null;
}

const Ctx = createContext<ClientSite | null>(null);

export function SiteProvider({ value, children }: { value: ClientSite; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClientSite(): ClientSite | null {
  return useContext(Ctx);
}
