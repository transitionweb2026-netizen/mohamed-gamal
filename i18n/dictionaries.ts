import "server-only";
import { ar } from "@/content/ar";
import { en } from "@/content/en";
import type { Dictionary } from "@/content/types";
import { isLocale, type Locale } from "./config";
import { notFound } from "next/navigation";

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Resolves the `[lang]` route param; unknown languages render the 404 page. */
export async function resolveLocale(params: Promise<{ lang: string }>): Promise<{ locale: Locale; t: Dictionary }> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return { locale: lang, t: dictionaries[lang] };
}
