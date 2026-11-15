import { ArrowRight } from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * Logo mark — ⚠ PLACEHOLDER typographic monogram until a real logo exists.
 * A cyan glass tile with the "MG" monogram and a teal motion arc.
 */
export function BrandMark({ monogram, className = "" }: { monogram: string; className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden>
      <svg viewBox="0 0 46 46" fill="none">
        <path d="M6 35c9 5 23 5 33-9" stroke="rgb(0 41 51 / 0.35)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="39.5" cy="25.5" r="2.4" fill="#002933" />
      </svg>
      <span className="relative -mt-1">{monogram}</span>
    </span>
  );
}

/** Forward arrow that points the reading direction (flips in RTL). */
export function Arrow({ className = "", ...props }: LucideProps) {
  return <ArrowRight aria-hidden className={`rtl:-scale-x-100 ${className}`} {...props} />;
}
