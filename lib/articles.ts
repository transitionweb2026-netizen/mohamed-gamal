import type { Article } from "@/content/types";
import type { Locale } from "@/i18n/config";

export function readingMinutes(article: Article): number {
  const words = article.body
    .flatMap((b) => (b.type === "list" ? b.items : [b.text]))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 160));
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(date));
}
