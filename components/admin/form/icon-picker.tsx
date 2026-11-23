"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, ICON_NAMES } from "@/components/ui/icon";

const words = (name: string) => name.replace(/([a-z])([A-Z])/g, "$1 $2");

/** Chooses one of the website's icons. */
export function IconPicker({ value, onChange, id, invalid }: { value: string; onChange: (name: string) => void; id?: string; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ICON_NAMES.filter((n) => words(n).toLowerCase().includes(q)) : ICON_NAMES;
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" id={id} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`ad-input flex items-center gap-2.5 text-start ${invalid ? "!border-[var(--danger)]" : ""}`}>
        <span className="grid size-7 place-items-center rounded-lg bg-aqua-100 text-aqua-700">
          <Icon name={value} size={16} />
        </span>
        <span className="flex-1 truncate">{words(value || "Choose an icon")}</span>
        <ChevronDown size={16} className="ad-muted" />
      </button>
      {open ? (
        <div className="ad-popover start-0 top-full mt-2 w-[min(22rem,85vw)] p-3">
          <label className="relative block">
            <span className="sr-only">Search icons</span>
            <Search size={15} className="ad-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
            <input autoFocus className="ad-input ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons" />
          </label>
          <ul role="listbox" aria-label="Icons" className="mt-3 grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto">
            {list.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={name === value}
                  title={words(name)}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`grid aspect-square w-full place-items-center rounded-xl transition ${name === value ? "bg-ink-900 text-aqua-400" : "text-ink-700 hover:bg-aqua-100"}`}
                >
                  <Icon name={name} size={18} />
                  <span className="sr-only">{words(name)}</span>
                </button>
              </li>
            ))}
          </ul>
          {!list.length ? <p className="ad-muted py-4 text-center text-sm">No icon matches.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
