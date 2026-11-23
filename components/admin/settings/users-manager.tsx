"use client";

import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { changeRole, grantAccess, revokeAccess } from "@/lib/cms/admin/actions/admins";
import type { AdminListItem } from "@/lib/cms/admin/shapes";
import { useConfirm, useToast } from "../ui/feedback";
import { Spinner, TimeAgo } from "../ui/primitives";

export function UsersManager({ admins, currentUserId, mode }: { admins: AdminListItem[]; currentUserId: string; mode: "supabase" | "local" }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "editor">("editor");
  const [busy, setBusy] = useState<string | null>(null);

  const grant = async () => {
    setBusy("grant");
    const result = await grantAccess(email, role, name);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`${email} can now sign in to the dashboard.`);
    setEmail("");
    setName("");
    router.refresh();
  };

  const updateRole = async (admin: AdminListItem, next: "owner" | "editor") => {
    setBusy(admin.user_id);
    const result = await changeRole(admin.user_id, admin.email, next);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Role updated.");
    router.refresh();
  };

  const revoke = async (admin: AdminListItem) => {
    if (!(await confirm({ title: `Remove ${admin.email}?`, body: "The account can no longer open the dashboard. The Supabase account itself is not deleted, and access can be granted again later.", confirmLabel: "Remove access", tone: "danger" }))) return;
    setBusy(admin.user_id);
    const result = await revokeAccess(admin.user_id);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(result.message ?? "Access removed.");
    router.refresh();
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="ad-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Role</th>
                <th>Last sign-in</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.user_id}>
                  <td>
                    <span className="block font-semibold">{a.display_name || a.email.split("@")[0]}</span>
                    <span className="ad-muted block text-xs">{a.email}</span>
                  </td>
                  <td>
                    <select className="ad-input !min-h-8 w-auto !py-1 text-sm" aria-label={`Role of ${a.email}`} value={a.role} disabled={busy === a.user_id || a.user_id === currentUserId} onChange={(e) => updateRole(a, e.target.value as "owner" | "editor")}>
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                    </select>
                    {a.user_id === currentUserId ? <span className="ad-badge ad-badge-aqua ms-2">You</span> : null}
                  </td>
                  <td className="ad-muted text-xs">
                    <TimeAgo value={a.last_sign_in_at} />
                  </td>
                  <td className="text-end">
                    {a.user_id !== currentUserId ? (
                      <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon text-[var(--danger)]" aria-label={`Remove ${a.email}`} disabled={busy === a.user_id} onClick={() => revoke(a)}>
                        {busy === a.user_id ? <Spinner size={14} /> : <Trash2 size={15} />}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--line)] px-4 py-3 text-xs">
          <p className="ad-muted flex items-start gap-2">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-aqua-700" />
            Owners can manage administrators; editors can edit all website content. The dashboard always keeps at least one owner.
          </p>
        </div>
      </section>

      <section className="ad-card ad-card-pad">
        <h2 className="ad-h2 flex items-center gap-2">
          <UserPlus size={18} className="text-aqua-700" /> Grant access
        </h2>
        <ol className="ad-muted mt-2 list-decimal space-y-1 ps-5 text-sm">
          <li>
            Create the person&apos;s account in Supabase: <strong>Authentication → Users → Add user</strong> (they choose or receive their own password).
          </li>
          <li>Enter the same email here and choose a role.</li>
        </ol>
        {mode === "local" ? <p className="mt-3 rounded-xl bg-[var(--warn-bg)] px-3 py-2 text-xs text-[var(--warn)]">Local development mode has no Supabase accounts besides the local administrator.</p> : null}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            grant();
          }}
        >
          <label className="block">
            <span className="ad-label">Email</span>
            <input className="ad-input" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="ad-label">Name shown in the dashboard (optional)</span>
            <input className="ad-input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="ad-label">Role</span>
            <select className="ad-input" value={role} onChange={(e) => setRole(e.target.value as "owner" | "editor")}>
              <option value="editor">Editor — edits content</option>
              <option value="owner">Owner — edits content and manages administrators</option>
            </select>
          </label>
          <button type="submit" className="ad-btn ad-btn-primary w-full" disabled={!email || busy === "grant"}>
            {busy === "grant" ? <Spinner /> : null} Grant access
          </button>
        </form>
      </section>
    </div>
  );
}
