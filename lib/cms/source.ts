import "server-only";
import { cookies, draftMode } from "next/headers";
import { cache } from "react";
import { buildBundledSnapshot } from "./bundled";
import { isLocalCms, LOCAL_ADMIN, LOCAL_STORAGE_BASE, localDb } from "./local/local-db";
import { buildSiteView } from "./reader";
import type { CmsSnapshot, Locale } from "./types";
import type { SiteView } from "./view";
import { isSupabaseConfigured, storagePublicBaseUrl } from "@/lib/supabase/env";
import { publicSupabase } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where the website's content comes from:
 *  - Supabase (when NEXT_PUBLIC_SUPABASE_URL and the publishable key are set):
 *    one `cms_snapshot()` call per render, published content only — or, for a
 *    signed-in administrator in preview mode, including drafts;
 *  - otherwise the content bundled in content/, so the website works before
 *    the CMS is connected.
 *
 * Availability: pages are static and rebuilt when content is published. If
 * Supabase cannot be reached during a rebuild, Next.js keeps serving the last
 * good page (the error is logged and the rebuild retried on a later request),
 * so a short outage never takes the website down or shows stale bundled
 * content. A transient failure is retried once before giving up.
 */
export const contentSource: "supabase" | "local" | "bundled" = isSupabaseConfigured ? "supabase" : isLocalCms ? "local" : "bundled";

/** Same name as in lib/cms/admin/session.ts (kept here to avoid a dependency on the dashboard). */
const LOCAL_SESSION_COOKIE = "cms_local_session";

let bundled: CmsSnapshot | undefined;

async function fetchSnapshot(preview: boolean): Promise<CmsSnapshot> {
  const client = preview ? await createSupabaseServerClient() : publicSupabase!;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await client.rpc("cms_snapshot", { p_preview: preview });
    if (!error) {
      const snapshot = data as CmsSnapshot | null;
      if (!snapshot?.settings) {
        throw new Error("CMS: Supabase is connected but holds no website content yet. Import supabase/seed/content.sql (see docs/cms/SETUP.md).");
      }
      return snapshot;
    }
    lastError = error.message;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`CMS: could not load the website content from Supabase (${lastError}).`);
}

/** Development only (CMS_LOCAL=1): the local database the dashboard edits. */
async function fetchLocalSnapshot(preview: boolean): Promise<CmsSnapshot> {
  const signedIn = (await cookies()).get(LOCAL_SESSION_COOKIE)?.value === "1";
  const db = localDb(preview && signedIn ? { userId: LOCAL_ADMIN.id } : "anon");
  return db.rpc<CmsSnapshot>("cms_snapshot", { p_preview: preview && signedIn });
}

export const getSnapshot = cache(async (): Promise<CmsSnapshot> => {
  if (isLocalCms) return fetchLocalSnapshot((await draftMode()).isEnabled);
  if (!isSupabaseConfigured) {
    bundled ??= buildBundledSnapshot();
    return bundled;
  }
  const preview = (await draftMode()).isEnabled;
  return fetchSnapshot(preview);
});

/**
 * Published content only, without reading the request — for build-time code
 * such as generateStaticParams, where draftMode() and cookies() throw.
 */
export const getPublishedSnapshot = cache(async (): Promise<CmsSnapshot> => {
  if (isLocalCms) return localDb("anon").rpc<CmsSnapshot>("cms_snapshot", { p_preview: false });
  if (!isSupabaseConfigured) {
    bundled ??= buildBundledSnapshot();
    return bundled;
  }
  return fetchSnapshot(false);
});

/** The whole website resolved for one language (one snapshot per request). */
export const getSite = cache(async (locale: Locale): Promise<SiteView> =>
  buildSiteView(await getSnapshot(), locale, isLocalCms ? LOCAL_STORAGE_BASE : storagePublicBaseUrl),
);
