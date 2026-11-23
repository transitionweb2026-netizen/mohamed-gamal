"use client";

import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return <button type="button" id={id} role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="ad-switch" onClick={() => onChange(!checked)} />;
}

export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`ad-spin ${className}`} aria-hidden />;
}

export function StatusBadge({ status }: { status: "draft" | "published" | null }) {
  if (!status) return null;
  return status === "published" ? (
    <span className="ad-badge ad-badge-ok">
      <span className="ad-dot" />
      Published
    </span>
  ) : (
    <span className="ad-badge ad-badge-warn">
      <span className="ad-dot" />
      Draft
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-aqua-100 text-aqua-700">{icon}</div>
      <h3 className="ad-h2">{title}</h3>
      {text ? <p className="ad-muted mt-1 max-w-md text-sm">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="ad-eyebrow mb-1">{eyebrow}</p> : null}
        <h1 className="ad-h1">{title}</h1>
        {description ? <p className="ad-muted mt-1.5 max-w-3xl text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Relative time ("3 min ago") with the exact time on hover. */
export function TimeAgo({ value }: { value: string | null | undefined }) {
  const [now] = useState(() => Date.now());
  if (!value) return <span className="ad-muted">—</span>;
  const date = new Date(value);
  const seconds = Math.round((now - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const label =
    Math.abs(seconds) < 60
      ? "just now"
      : Math.abs(seconds) < 3600
        ? rtf.format(-Math.round(seconds / 60), "minute")
        : Math.abs(seconds) < 86400
          ? rtf.format(-Math.round(seconds / 3600), "hour")
          : Math.abs(seconds) < 86400 * 30
            ? rtf.format(-Math.round(seconds / 86400), "day")
            : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <time dateTime={date.toISOString()} title={date.toLocaleString("en-GB")} suppressHydrationWarning>
      {label}
    </time>
  );
}
