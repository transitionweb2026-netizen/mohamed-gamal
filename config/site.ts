/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION — the single place for real contact details.
 * ─────────────────────────────────────────────────────────────────────────
 *  Every value marked  ⚠ PLACEHOLDER  must be replaced with Dr. Mohamed
 *  Gamal's real information before launch. Nothing here was invented:
 *  the phone number, WhatsApp number and social links below are
 *  deliberately non-working placeholders.
 *
 *  Changing a value here updates the navbar, every hero contact panel,
 *  the global CTA, the contact page and the footer at once.
 */

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "tiktok";

export const siteConfig = {
  /** ⚠ PLACEHOLDER — the production domain, used for metadata/Open Graph. */
  url: "https://www.example.com",

  phone: {
    /** ⚠ PLACEHOLDER — shown to visitors exactly as written. */
    display: "+XXX XX XXX XXXX",
    /** ⚠ PLACEHOLDER — international format, digits only (e.g. 201001234567). Used for tel: links. */
    e164: "000000000000",
  },

  whatsapp: {
    /** ⚠ PLACEHOLDER — WhatsApp number, international format, digits only. Used for wa.me links. */
    number: "000000000000",
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

export const telHref = `tel:+${siteConfig.phone.e164}`;

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
