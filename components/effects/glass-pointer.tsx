"use client";

import { useEffect } from "react";

/**
 * Liquid-glass pointer effects for every `.lg-hover` card:
 *  – a soft white + cyan highlight that follows the cursor (--mx / --my)
 *  – a subtle 3D tilt toward the cursor (--rx / --ry; larger cards tilt less)
 * One passive listener for the whole document, throttled to animation
 * frames; skipped on touch devices and for reduced-motion users (tilt only).
 */
export function GlassPointer() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const tilt = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last: PointerEvent | null = null;
    let current: HTMLElement | null = null;

    const reset = (el: HTMLElement | null) => {
      el?.style.removeProperty("--rx");
      el?.style.removeProperty("--ry");
    };

    const apply = () => {
      frame = 0;
      if (!last) return;
      const card = (last.target as Element | null)?.closest?.<HTMLElement>(".lg-hover") ?? null;
      if (card !== current) {
        reset(current);
        current = card;
      }
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = last.clientX - rect.left;
      const y = last.clientY - rect.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      if (tilt) {
        const max = rect.width > 520 ? 2 : 4.5;
        card.style.setProperty("--ry", `${((x / rect.width - 0.5) * 2 * max).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${((0.5 - y / rect.height) * 2 * max).toFixed(2)}deg`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      reset(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
