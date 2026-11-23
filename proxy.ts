import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, splitLocale, type Locale } from "@/i18n/config";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/** Dashboard pages reachable without a session. */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/"];

const isLocalCms = process.env.NODE_ENV !== "production" && process.env.CMS_LOCAL === "1" && !isSupabaseConfigured;

/**
 * /admin: refreshes the Supabase session cookies and sends visitors without a
 * session to the sign-in page. This is only a convenience — every dashboard
 * page and Server Action checks the session and the administrator role again
 * on the server, and Row Level Security checks it in the database.
 */
async function adminProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  };

  if (isLocalCms) {
    if (!isPublic && request.cookies.get("cms_local_session")?.value !== "1") return toLogin();
    return NextResponse.next();
  }
  if (!isSupabaseConfigured) return NextResponse.next(); // the dashboard explains how to connect Supabase

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isPublic) {
    const redirect = toLogin();
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

/** The default language chosen in the dashboard (Website settings), cached for a minute. */
let localeCache: { value: Locale; at: number } | null = null;
async function cmsDefaultLocale(): Promise<Locale> {
  if (!isSupabaseConfigured) return defaultLocale;
  if (localeCache && Date.now() - localeCache.at < 60_000) return localeCache.value;
  let value = defaultLocale;
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=default_locale&id=eq.1`, {
      headers: { apikey: supabasePublishableKey, authorization: `Bearer ${supabasePublishableKey}` },
      signal: AbortSignal.timeout(1500),
    });
    const rows = (await response.json()) as { default_locale?: string }[];
    if (isLocale(rows?.[0]?.default_locale)) value = rows[0].default_locale as Locale;
  } catch {
    // Supabase unreachable: keep the built-in default.
  }
  localeCache = { value, at: Date.now() };
  return value;
}

/**
 * Every website page lives under /ar or /en. Requests without a language
 * prefix (the bare domain, /about, …) are redirected to the same path in the
 * visitor's saved language (NEXT_LOCALE cookie, set by the language switch)
 * or in the website's default language (Arabic unless changed in the dashboard).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminProxy(request);
  if (splitLocale(pathname).locale) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const target = isLocale(saved) ? saved : await cmsDefaultLocale();
  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and files (anything with a dot).
  matcher: ["/((?!_next|api/|.*\\..*).*)"],
};
