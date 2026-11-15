import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, splitLocale } from "@/i18n/config";

/**
 * Every page lives under /ar or /en. Requests without a language prefix
 * (the bare domain, /about, …) are redirected to the same path in the
 * visitor's saved language (NEXT_LOCALE cookie, set by the language
 * switch) or in Arabic, the default.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (splitLocale(pathname).locale) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const target = isLocale(saved) ? saved : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and files (anything with a dot).
  matcher: ["/((?!_next|api/|.*\\..*).*)"],
};
