"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/ui/rich-text";

/**
 * A statistic value. Real numbers ("15+", "98%") count up from zero when
 * scrolled into view; placeholders ("[[XX]]+") render as highlighted text.
 */
export function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  const numeric = match !== null;
  const target = match ? Number(match[1]) : 0;
  const [n, setN] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!numeric || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1600);
          setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [numeric, target]);

  if (!match) return <RichText text={value} />;
  return (
    <span ref={ref}>
      {n}
      {match[2]}
    </span>
  );
}
