"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

/** Liquid-glass FAQ accordion (one item open at a time). Answers may contain [[placeholders]], pre-rendered by the server. */
export function Accordion({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btn = `${base}-b${i}`;
        const panel = `${base}-p${i}`;
        return (
          <div
            key={i}
            className={`lg lg--sm transition-shadow duration-500 ${isOpen ? "shadow-[0_0_0_1px_rgb(73_217_244/0.55),0_20px_50px_-24px_rgb(73_217_244/0.9)]" : ""}`}
            data-reveal
            style={{ "--rd": `${i * 70}ms` } as React.CSSProperties}
          >
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="acc-trigger flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-display text-base font-semibold sm:px-6 sm:py-5 sm:text-lg"
              >
                {item.q}
                <span className="acc-icon icon-tile icon-tile--sm">
                  <Plus size={18} aria-hidden />
                </span>
              </button>
            </h3>
            <div id={panel} role="region" aria-labelledby={btn} className="acc-panel" data-open={isOpen}>
              <div>
                <p className="px-5 pb-5 leading-8 text-ink-900/75 sm:px-6 sm:pb-6">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
