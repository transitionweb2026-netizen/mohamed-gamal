import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { Img } from "@/lib/cms/view";

/**
 * Logo mark next to the doctor's name (Website settings → Logo mark).
 * Decorative: the doctor's name is always written next to it. Without a
 * logo, the monogram is shown on the brand tile.
 */
export function BrandMark({ logo, monogram = "MG", className = "" }: { logo: Img | null; monogram?: string; className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden>
      {logo ? <Image src={logo.src} alt="" width={96} height={96} sizes="96px" /> : <span className="grid h-full w-full place-items-center bg-aqua-500 font-display text-sm font-extrabold text-ink-900">{monogram}</span>}
    </span>
  );
}

/** Forward arrow that points the reading direction (flips in RTL). */
export function Arrow({ className = "", ...props }: LucideProps) {
  return <ArrowRight aria-hidden className={`rtl:-scale-x-100 ${className}`} {...props} />;
}
