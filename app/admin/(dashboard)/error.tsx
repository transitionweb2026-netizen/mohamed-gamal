"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="ad-card ad-card-pad mx-auto mt-10 max-w-xl text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[var(--danger-bg)] text-[var(--danger)]">
        <TriangleAlert size={26} />
      </div>
      <h1 className="ad-h2">This page could not be loaded</h1>
      <p className="ad-muted mt-2 text-sm">The content database did not answer as expected. Check the connection and try again. Nothing you saved before was lost.</p>
      {error.digest ? <p className="ad-muted mt-2 font-mono text-xs">Reference: {error.digest}</p> : null}
      <button type="button" className="ad-btn ad-btn-primary mt-5" onClick={reset}>
        <RotateCcw size={16} /> Try again
      </button>
    </div>
  );
}
