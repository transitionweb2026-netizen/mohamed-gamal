"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ChevronRight, MousePointerClick, Pin } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Arrow } from "@/components/ui/brand";

export interface ExplorerItem {
  id: string;
  icon: string;
  region: string;
  text: string;
  items: string[];
  img: { src: string; alt: string; position?: string } | null;
}

/**
 * Interactive "where does it hurt?" explorer.
 * Hovering a tab previews it in the panel (no click needed); clicking pins
 * it, and the panel returns to the pinned tab when the pointer leaves.
 * Touch and keyboard users select (pin) directly.
 */
export function SpecialtyExplorer({ groups, cta, href, hint }: { groups: ExplorerItem[]; cta: string; href: string; hint: string }) {
  const [pinned, setPinned] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = preview ?? pinned;
  const g = groups[shown];

  const pin = (i: number) => {
    setPinned(i);
    setPreview(null);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key as string];
    if (!step) return;
    e.preventDefault();
    const n = (i + step + groups.length) % groups.length;
    pin(n);
    tabs.current[n]?.focus();
  };

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
      <div data-reveal="start">
        <div role="tablist" aria-orientation="vertical" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-1" onPointerLeave={() => setPreview(null)}>
          {groups.map((item, i) => {
            const isPinned = pinned === i;
            const isPreview = preview === i && !isPinned;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                id={`${base}-t${i}`}
                role="tab"
                type="button"
                aria-selected={isPinned}
                aria-controls={`${base}-panel`}
                tabIndex={isPinned ? 0 : -1}
                data-preview={isPreview}
                onPointerEnter={(e) => e.pointerType === "mouse" && setPreview(i)}
                onClick={() => pin(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="tab-btn lg lg--sm group flex items-center gap-3 p-3 text-start lg:p-3.5"
              >
                <span className={`icon-tile icon-tile--sm ${isPinned ? "" : "icon-tile--ink"}`}>
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="min-w-0 flex-1 font-display text-sm font-semibold leading-snug sm:text-base">{item.region}</span>
                {isPinned ? (
                  <Pin size={16} className="hidden flex-none rotate-45 text-aqua-400 lg:block" aria-hidden />
                ) : (
                  <ChevronRight size={18} className={`tab-chevron hidden flex-none lg:block rtl:-scale-x-100 ${isPreview ? "text-aqua-600" : "opacity-40"}`} aria-hidden />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-4 hidden items-center gap-2 text-xs text-ink-900/55 [@media(hover:hover)]:flex">
          <MousePointerClick size={15} className="text-aqua-700" aria-hidden />
          {hint}
        </p>
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-t${shown}`} className="lg overflow-hidden p-2.5" data-reveal="end">
        <div className="img-frame relative min-h-[440px] rounded-[22px] sm:aspect-[16/11] sm:min-h-0">
          {/* All images stay mounted and crossfade, so hovering feels instant. */}
          {groups.map((item, i) =>
            item.img ? (
            <Image
              key={item.id}
              src={item.img.src}
              alt={i === shown ? item.img.alt : ""}
              style={item.img.position ? { objectPosition: item.img.position } : undefined}
              fill
              sizes="(min-width: 1024px) 720px, 100vw"
              className={`object-cover transition-[opacity,scale] duration-700 ease-out ${i === shown ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
            />
            ) : null,
          )}
          <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgb(73 217 244 / 0.18), transparent 35%, rgb(0 22 28 / 0.65))" }} aria-hidden />
          <div key={g.id} className="lg lg--deep absolute inset-x-3 bottom-3 z-[2] animate-[rise_0.6s_var(--ease)_both] p-5 sm:inset-x-5 sm:bottom-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile--sm">
                <Icon name={g.icon} size={18} />
              </span>
              <h3 className="text-xl font-bold sm:text-2xl">{g.region}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/78 sm:text-[0.95rem]">{g.text}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {g.items.map((c, k) => (
                <li key={c} className="chip chip--dark animate-[rise_0.6s_var(--ease)_both]" style={{ animationDelay: `${120 + k * 60}ms` }}>
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
