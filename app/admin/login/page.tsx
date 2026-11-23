import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Database, ShieldCheck } from "lucide-react";
import { signInLocal, signOut } from "@/lib/cms/admin/actions/auth";
import { cmsMode, getSessionState } from "@/lib/cms/admin/session";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

const REASONS: Record<string, { tone: "info" | "warn"; text: string }> = {
  "signed-out": { tone: "info", text: "You are signed out." },
  "link-expired": { tone: "warn", text: "This link has expired or was already used. Request a new one below." },
  "link-invalid": { tone: "warn", text: "This link is not valid. Request a new one below." },
  "not-configured": { tone: "warn", text: "Supabase is not connected yet." },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";
  const reason = typeof params.reason === "string" ? params.reason : "signed-out" in params ? "signed-out" : "";
  const state = await getSessionState();
  if (state.status === "admin") redirect(/^\/admin(\/|$)/.test(next) ? next : "/admin");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="ad-ink-card relative hidden flex-col justify-between rounded-none p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white/10 font-display text-sm font-semibold text-aqua-400">MG</span>
          <span className="font-display font-semibold">Dr. Mohamed Gamal</span>
        </div>
        <div className="max-w-md">
          <p className="ad-eyebrow !text-aqua-400">Content dashboard</p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold">Manage the website in Arabic and English.</h1>
          <p className="mt-4 text-white/65">Pages, services, videos, articles, media and settings — saved as drafts, previewed, then published.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/50">
          <ShieldCheck size={16} /> Access is limited to the clinic&apos;s administrators.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="ad-card ad-card-pad w-full max-w-md">
          {state.status === "not-admin" || reason === "no-access" ? (
            <div>
              <h2 className="ad-h1">No dashboard access</h2>
              <p className="ad-muted mt-2 text-sm">
                {state.status === "not-admin" ? <>The account {state.email} is signed in but is not an administrator of this website. </> : null}
                Ask the website owner to grant access under Users, then sign in again.
              </p>
              <form action={signOut} className="mt-6">
                <button type="submit" className="ad-btn ad-btn-primary w-full">
                  Sign out
                </button>
              </form>
            </div>
          ) : cmsMode === "supabase" ? (
            <LoginForm next={next} notice={REASONS[reason] ?? null} />
          ) : cmsMode === "local" ? (
            <div>
              <span className="ad-badge ad-badge-aqua">
                <Database size={12} /> Local development mode
              </span>
              <h2 className="ad-h1 mt-3">Sign in</h2>
              <p className="ad-muted mt-2 text-sm">
                Supabase is not connected yet, so the dashboard uses a local test database on this computer (<code>.cms-local/</code>). Nothing here reaches the live website. Real sign-in with email and password starts once Supabase is connected.
              </p>
              <form action={signInLocal} className="mt-6">
                <input type="hidden" name="next" value={next} />
                <button type="submit" className="ad-btn ad-btn-primary w-full">
                  Continue as the local administrator
                </button>
              </form>
            </div>
          ) : (
            <div>
              <span className="ad-badge ad-badge-warn">Setup needed</span>
              <h2 className="ad-h1 mt-3">The CMS is not connected</h2>
              <p className="ad-muted mt-2 text-sm">
                Add the Supabase project address and publishable key to the environment (<code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>), then restart. The steps are in <code>docs/cms/SETUP.md</code>. Until then the website shows its built-in content.
              </p>
              <p className="ad-muted mt-3 text-sm">
                For development without Supabase, start the dev server with <code>CMS_LOCAL=1</code> to use a local test database.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
