import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/** Leaves preview mode and returns to the same page as visitors see it. */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const referer = request.headers.get("referer");
  let target = "/ar";
  try {
    const url = referer ? new URL(referer) : null;
    if (url && url.origin === request.nextUrl.origin && /^\/(ar|en)(\/|$)/.test(url.pathname)) target = url.pathname;
  } catch {
    // keep the default
  }
  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}
