"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Arrow } from "@/components/ui/brand";

export interface ExplorerItem {
  id: string;
  icon: IconName;
  region: string;
  text: string;
  items: string[];
  img: { src: string; alt: string };
}

/** Interactive "where does it hurt?" explorer — glass tabs drive a large image panel. */
export function SpecialtyExplorer({ groups, cta, href }: { groups: ExplorerItem[]; cta: string; href: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = groups[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    const next = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key as string];
    if (!next) return;
    e.preventDefault();
    const n = (i + next + groups.length) % groups.length;
    setActive(n);
    tabs.current[n]?.focus();
  };

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
      <div role="tablist" aria-orientation="vertical" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-1" data-reveal="start">
        {groups.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`${base}-t${i}`}
            role="tab"
            type="button"
            aria-selected={active === i}
            aria-controls={`${base}-panel`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className="tab-btn lg lg--sm group flex items-center gap-3 p-3 text-start lg:p-3.5"
          >
            <span className={`icon-tile icon-tile--sm ${active === i ? "" : "icon-tile--ink"}`}>
              <Icon name={item.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1 font-display text-sm font-semibold leading-snug sm:text-base">{item.region}</span>
            <ChevronRight size={18} className={`hidden flex-none transition-opacity duration-500 lg:block rtl:-scale-x-100 ${active === i ? "text-aqua-400" : "opacity-40"}`} aria-hidden />
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-t${active}`} className="lg overflow-hidden p-2.5" data-reveal="end">
        <div className="img-frame relative min-h-[420px] rounded-[22px] sm:aspect-[16/11] sm:min-h-0">
          <Image key={g.id} src={g.img.src} alt={g.img.alt} fill sizes="(min-width: 1024px) 720px, 100vw" className="animate-[page-in_0.7s_ease_both] object-cover" />
          <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgb(73 217 244 / 0.18), transparent 35%, rgb(0 22 28 / 0.65))" }} aria-hidden />
          <div key={`${g.id}-c`} className="lg lg--deep absolute inset-x-3 bottom-3 z-[2] animate-[rise_0.7s_var(--ease)_both] p-5 sm:inset-x-5 sm:bottom-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile--sm">
                <Icon name={g.icon} size={18} />
              </span>
              <h3 className="text-xl font-bold sm:text-2xl">{g.region}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/78 sm:text-[0.95rem]">{g.text}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.items.map((c) => (
                <li key={c} className="chip chip--dark">
                  {c}
                </li>
              ))}
            </ul>
            <Link href={href} className="link-arrow link-arrow--light mt-5">
              {cta}
              <Arrow size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
