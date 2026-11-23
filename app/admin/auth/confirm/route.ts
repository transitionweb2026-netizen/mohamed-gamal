import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["recovery", "invite", "magiclink", "email", "email_change", "signup"];

/**
 * Links in Supabase Auth emails (password reset, invitation) land here. The
 * one-time code is exchanged for a session on the server, then the user is
 * sent on to a dashboard page (e.g. to choose a new password).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const nextParam = searchParams.get("next") ?? "/admin";
  const next = /^\/admin(\/[A-Za-z0-9/_-]*)?(\?[A-Za-z0-9=&_%-]*)?$/.test(nextParam) ? nextParam : "/admin";
  const fail = (reason: string) => NextResponse.redirect(new URL(`/admin/login?reason=${reason}`, origin));
  if (!isSupabaseConfigured) return fail("not-configured");

  const supabase = await createSupabaseServerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("link-expired");
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail("link-expired");
  } else return fail("link-invalid");

  const destination = type === "invite" ? "/admin/account?reset=1&welcome=1" : next;
  return NextResponse.redirect(new URL(destination, origin));
}
