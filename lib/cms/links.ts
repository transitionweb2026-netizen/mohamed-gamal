/** tel: link for a number in international digits (e.g. 201146540705). */
export function telLink(digits: string): string {
  return digits ? `tel:+${digits}` : "#";
}

/** wa.me link, optionally with a prefilled message. */
export function whatsappLink(digits: string, message?: string): string {
  if (!digits) return "#";
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** True for links that leave the website. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** A link from content, localized when it points inside the website ("/about" → "/en/about"). */
export function siteHref(href: string, locale: "ar" | "en"): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? "" : href.slice(cut);
  if (/^\/(ar|en)(\/|$)/.test(path)) return href;
  return `/${locale}${path === "/" ? "" : path}${suffix}`;
}
