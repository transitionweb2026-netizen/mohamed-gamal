"use client";

import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { requestPasswordReset, signIn } from "@/lib/cms/admin/actions/auth";
import { Spinner } from "./ui/primitives";

export function LoginForm({ next, notice }: { next: string; notice: { tone: "info" | "warn"; text: string } | null }) {
  const [mode, setMode] = useState<"sign-in" | "reset">(notice?.tone === "warn" ? "reset" : "sign-in");
  const [show, setShow] = useState(false);
  const [signInState, signInAction, signingIn] = useActionState(signIn, { error: null });
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, { error: null, sent: false });

  if (mode === "reset")
    return (
      <div>
        <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm -ms-2 mb-3" onClick={() => setMode("sign-in")}>
          <ArrowLeft size={15} /> Back to sign in
        </button>
        <h2 className="ad-h1">Reset your password</h2>
        {notice?.tone === "warn" ? <p className="mt-3 rounded-xl bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn)]">{notice.text}</p> : null}
        {resetState.sent ? (
          <div className="mt-5 flex gap-3 rounded-xl bg-aqua-100 px-4 py-3 text-sm text-ink-800">
            <MailCheck size={20} className="shrink-0 text-aqua-700" />
            <p>If an administrator account uses this email, a link to choose a new password is on its way. The link works once and expires after an hour.</p>
          </div>
        ) : (
          <form action={resetAction} className="mt-5 space-y-4">
            <p className="ad-muted text-sm">Enter the email of your administrator account. We will email you a link to choose a new password.</p>
            <label className="block">
              <span className="ad-label">Email</span>
              <input name="email" type="email" required autoComplete="email" className="ad-input" dir="ltr" />
            </label>
            {resetState.error ? (
              <p className="ad-error-text" role="alert">
                {resetState.error}
              </p>
            ) : null}
            <button type="submit" className="ad-btn ad-btn-primary w-full" disabled={resetting}>
              {resetting ? <Spinner /> : null} Send the link
            </button>
          </form>
        )}
      </div>
    );

  return (
    <form action={signInAction} className="space-y-4">
      <div>
        <h2 className="ad-h1">Sign in</h2>
        <p className="ad-muted mt-1 text-sm">Use the email and password of your administrator account.</p>
      </div>
      {notice?.tone === "info" ? <p className="rounded-xl bg-aqua-100 px-3 py-2 text-sm text-ink-800">{notice.text}</p> : null}
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="ad-label">Email</span>
        <input name="email" type="email" required autoComplete="username" className="ad-input" dir="ltr" autoFocus />
      </label>
      <label className="block">
        <span className="ad-label flex items-center justify-between">
          Password
          <button type="button" className="text-xs font-medium text-aqua-700 hover:underline" onClick={() => setMode("reset")}>
            Forgot password?
          </button>
        </span>
        <span className="relative block">
          <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="ad-input pe-10" dir="ltr" />
          <button type="button" className="ad-muted absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md hover:text-ink-900" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </label>
      {signInState.error ? (
        <p className="rounded-xl bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
          {signInState.error}
        </p>
      ) : null}
      <button type="submit" className="ad-btn ad-btn-primary w-full" disabled={signingIn}>
        {signingIn ? <Spinner /> : null} Sign in
      </button>
    </form>
  );
}
