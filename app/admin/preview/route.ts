import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionState } from "@/lib/cms/admin/session";

/** Website addresses that can be previewed (no open redirects). */
const SITE_PATH = /^\/(ar|en)(\/[a-z0-9-]+){0,3}\/?(#[A-Za-z0-9_-]*)?$/;

/**
 * Turns on preview mode for a signed-in administrator and opens the page:
 * the website then shows unpublished section drafts and draft items (the
 * database only returns them to administrators). Visitors are unaffected.
 */
export async function GET(request: NextRequest) {
  const state = await getSessionState();
  if (state.status !== "admin") return NextResponse.redirect(new URL("/admin/login", request.nextUrl.origin));
  const path = request.nextUrl.searchParams.get("path") ?? "/ar";
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(SITE_PATH.test(path) ? path : "/ar", request.nextUrl.origin));
}
