/**
 * ─────────────────────────────────────────────────────────────────────────
 *  INITIAL CONTACT DETAILS — the starting content of the CMS.
 * ─────────────────────────────────────────────────────────────────────────
 *  Once Supabase is connected, contact details are edited in the dashboard
 *  (/admin/contact, /admin/social, /admin/seo) and this file is no longer
 *  read by the website. It is only the source of the initial content:
 *  `npm run cms:seed-sql` turns it (with content/) into
 *  supabase/seed/content.sql, and it is what the website shows while the
 *  CMS is not connected.
 *
 *  Values marked  ⚠ PLACEHOLDER  were never invented: the social links are
 *  deliberately non-working placeholders. The phone numbers are the
 *  doctor's real booking numbers.
 */

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok";

export const siteConfig = {
  /** ⚠ PLACEHOLDER — the production domain, used for metadata/Open Graph. */
  url: "https://www.example.com",

  /**
   * Booking & enquiry numbers (Egypt). The first one is the primary number,
   * used by single "Call now" buttons; every number is listed where space allows.
   *  - display: shown to visitors exactly as written
   *  - e164: international format, digits only — used for tel: links
   */
  phones: [
    { display: "0114 654 0705", e164: "201146540705" },
    { display: "0114 654 0706", e164: "201146540706" },
  ],

  whatsapp: {
    /**
     * ⚠ CONFIRM — the number registered on WhatsApp (international format,
     * digits only). Set to the first booking number; change it if WhatsApp
     * is on the other number.
     */
    number: "201146540705",
  },

  /** ⚠ PLACEHOLDER — replace each URL with the doctor's real profile (or remove the entry). */
  socials: [
    { platform: "facebook", href: "https://www.facebook.com/" },
    { platform: "instagram", href: "https://www.instagram.com/" },
    { platform: "youtube", href: "https://www.youtube.com/" },
    { platform: "tiktok", href: "https://www.tiktok.com/" },
  ] satisfies { platform: SocialPlatform; href: string }[],

  /** ⚠ PLACEHOLDER — optional. A Google Maps *embed* URL; when set, the contact page shows a live map. */
  mapEmbedUrl: "" as string,

  /**
   * ⚠ PLACEHOLDER — path to the doctor's real portrait in /public (e.g. "/images/doctor.jpg").
   * While empty, a branded monogram panel is shown instead of a photo.
   */
  doctorPortrait: "" as string,
} as const;

export type Phone = (typeof siteConfig.phones)[number];

export const phones: readonly Phone[] = siteConfig.phones;
export const primaryPhone: Phone = siteConfig.phones[0];

export function telFor(phone: Phone): string {
  return `tel:+${phone.e164}`;
}

/** tel: link for the primary number. */
export const telHref = telFor(primaryPhone);

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
