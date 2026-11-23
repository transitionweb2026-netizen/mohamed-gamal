"use client";

import { Check, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRow, reorderRows, saveSocial, setRowVisible } from "@/lib/cms/admin/actions/settings";
import { SOCIAL_PLATFORMS } from "@/lib/cms/registry";
import type { SocialPlatform } from "@/lib/cms/types";
import { socialIcons } from "@/components/ui/brand-icons";
import { useConfirm, useToast } from "../ui/feedback";
import { Spinner, Switch } from "../ui/primitives";
import { SortableRows } from "./sortable-rows";

interface SocialRow {
  id: string;
  platform: string;
  url: string;
  visible: boolean;
}

const label = (platform: string) => SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform;

function PlatformRow({ platform, row, handle }: { platform: SocialPlatform; row: SocialRow | undefined; handle?: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [url, setUrl] = useState(row?.url ?? "");
  const [visible, setVisible] = useState(row?.visible ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Glyph = socialIcons[platform];
  const dirty = url.trim() !== (row?.url ?? "");

  const save = async (nextVisible = visible) => {
    setBusy(true);
    setError(null);
    const result = await saveSocial(platform, url, nextVisible);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return toast.error(result.error);
    }
    toast.success(`${label(platform)} saved. The website is updated.`);
    router.refresh();
  };

  const toggle = async (next: boolean) => {
    setVisible(next);
    if (!row) return;
    const result = await setRowVisible("socials", row.id, next);
    if (!result.ok) {
      setVisible(!next);
      return toast.error(result.error);
    }
    toast.success(result.message ?? "Saved.");
    router.refresh();
  };

  const remove = async () => {
    if (!row) return;
    if (!(await confirm({ title: `Remove the ${label(platform)} link?`, body: "The icon disappears from the website. You can add the link again later.", confirmLabel: "Remove", tone: "danger" }))) return;
    const result = await deleteRow("socials", row.id);
    if (!result.ok) return toast.error(result.error);
    setUrl("");
    toast.success("Removed.");
    router.refresh();
  };

  return (
    <div className={`flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-white/60 p-2.5 sm:flex-row sm:items-center ${row && !visible ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2 sm:w-44">
        {handle ?? <span className="w-8 shrink-0" />}
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-900 text-white">
          <Glyph width={17} height={17} />
        </span>
        <span className="font-semibold">{label(platform)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <input
          className="ad-input"
          dir="ltr"
          value={url}
          placeholder={`https://… (${label(platform)} profile)`}
          aria-label={`${label(platform)} address`}
          aria-invalid={!!error}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && dirty && save()}
        />
        {error ? <p className="ad-error-text">{error}</p> : null}
      </div>
      <div className="flex items-center gap-1.5">
        {row ? <Switch checked={visible} label={`Show ${label(platform)} on the website`} onChange={toggle} /> : <span className="ad-muted w-10 text-center text-xs">Off</span>}
        <button type="button" className="ad-btn ad-btn-primary ad-btn-sm" disabled={!dirty || !url.trim() || busy} onClick={() => save()}>
          {busy ? <Spinner size={14} /> : <Check size={14} />} Save
        </button>
        {row ? (
          <>
            <a href={row.url} target="_blank" rel="noreferrer" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon" aria-label={`Open ${label(platform)}`}>
              <ExternalLink size={15} />
            </a>
            <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm ad-btn-icon text-[var(--danger)]" aria-label={`Remove ${label(platform)}`} onClick={remove}>
              <Trash2 size={15} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Social media profiles: address, visibility and order of the icons. */
export function SocialManager({ links: initial }: { links: SocialRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [links, setLinks] = useState(initial);
  const [source, setSource] = useState(initial);
  if (source !== initial) {
    setSource(initial);
    setLinks(initial);
  }
  const unused = SOCIAL_PLATFORMS.filter((p) => !links.some((l) => l.platform === p.value));

  const reorder = async (next: SocialRow[]) => {
    const previous = links;
    setLinks(next);
    const result = await reorderRows("socials", next.map((l) => l.id));
    if (!result.ok) {
      setLinks(previous);
      return toast.error(result.error);
    }
    toast.success("New order saved.");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <section className="ad-card ad-card-pad">
        <h2 className="ad-h2">On the website</h2>
        <p className="ad-muted mt-1 mb-4 text-sm">Shown in the hero panels, the contact page and the footer, in this order. Switch one off to hide it without losing the address.</p>
        {links.length ? (
          <SortableRows items={links} onReorder={reorder} render={(row, handle) => <PlatformRow key={`${row.id}-${row.url}-${row.visible}`} platform={row.platform as SocialPlatform} row={row} handle={handle} />} />
        ) : (
          <p className="ad-muted text-sm">No social media links yet. Add one below.</p>
        )}
      </section>
      {unused.length ? (
        <section className="ad-card ad-card-pad">
          <h2 className="ad-h2">Add a platform</h2>
          <p className="ad-muted mt-1 mb-4 text-sm">Paste the full address of the clinic&apos;s official profile and save.</p>
          <ul className="space-y-2">
            {unused.map((p) => (
              <li key={p.value}>
                <PlatformRow platform={p.value} row={undefined} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
