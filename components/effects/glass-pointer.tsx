"use client";

import { useEffect } from "react";

/**
 * Light-reflection effect for interactive liquid glass: tracks the pointer
 * over any `.lg-hover` card and feeds its position to the CSS (--mx/--my),
 * where a soft white + cyan highlight follows the cursor across the glass.
 * One passive listener for the whole document, throttled to animation frames.
 */
export function GlassPointer() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      frame = 0;
      if (!last) return;
      const card = (last.target as Element | null)?.closest?.<HTMLElement>(".lg-hover");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${last.clientX - rect.left}px`);
      card.style.setProperty("--my", `${last.clientY - rect.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
