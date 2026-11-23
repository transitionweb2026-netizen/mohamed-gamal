"use client";

import { KeyRound, LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut, updatePassword } from "@/lib/cms/admin/actions/auth";
import { updateDisplayName } from "@/lib/cms/admin/actions/admins";
import { useToast } from "../ui/feedback";
import { Spinner } from "../ui/primitives";

export function AccountForms({ displayName, mode, reset, welcome }: { displayName: string; mode: "supabase" | "local"; reset: boolean; welcome: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(displayName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<null | "name" | "password">(null);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    setBusy("name");
    const result = await updateDisplayName(name);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success("Name saved.");
    router.refresh();
  };

  const savePassword = async () => {
    setError(null);
    setBusy("password");
    const result = await updatePassword(password, confirm);
    setBusy(null);
    if (!result.ok) return setError(result.error);
    setPassword("");
    setConfirm("");
    toast.success("Password changed.");
    router.replace("/admin/account");
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="ad-card ad-card-pad">
        <h2 className="ad-h2">Your name</h2>
        <p className="ad-muted mt-1 text-sm">Shown in the dashboard and the activity log.</p>
        <label className="mt-4 block">
          <span className="ad-label">Name</span>
          <input className="ad-input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="button" className="ad-btn ad-btn-primary mt-4" disabled={name === displayName || busy === "name"} onClick={saveName}>
          {busy === "name" ? <Spinner /> : <Save size={16} />} Save
        </button>
      </section>

      <section className="ad-card ad-card-pad" id="password">
        <h2 className="ad-h2 flex items-center gap-2">
          <KeyRound size={18} className="text-aqua-700" /> {reset ? "Choose a new password" : "Change password"}
        </h2>
        {reset ? <p className="mt-2 rounded-xl bg-aqua-100 px-3 py-2 text-sm">{welcome ? "Welcome! Choose a password for your account." : "You opened a password reset link. Choose a new password now."}</p> : null}
        {mode === "local" ? (
          <p className="ad-muted mt-2 text-sm">Passwords are managed by Supabase Auth, which is not connected in local development mode.</p>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePassword();
            }}
          >
            <label className="block">
              <span className="ad-label">New password</span>
              <input className="ad-input" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="ad-help block">At least 10 characters. A passphrase of several words is easy to remember and hard to guess.</span>
            </label>
            <label className="block">
              <span className="ad-label">Repeat the new password</span>
              <input className="ad-input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error ? (
              <p className="ad-error-text" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="ad-btn ad-btn-primary" disabled={busy === "password" || !password}>
              {busy === "password" ? <Spinner /> : null} Change password
            </button>
          </form>
        )}
      </section>

      <section className="ad-card ad-card-pad lg:col-span-2">
        <h2 className="ad-h2">Sign out</h2>
        <p className="ad-muted mt-1 text-sm">Sign out when you are done on a shared computer.</p>
        <form action={signOut} className="mt-4">
          <button type="submit" className="ad-btn ad-btn-danger-ghost">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
