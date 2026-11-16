import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { LucideProps } from "lucide-react";
import logoMark from "@/public/images/brand/logo-mark.png";

/**
 * Logo mark — Dr. Mohamed Gamal's MG monogram on the teal tile
 * (compact version of the full logo, which has the wordmark underneath).
 * Decorative: the doctor's name is always written next to it.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden>
      <Image src={logoMark} alt="" sizes="96px" />
    </span>
  );
}

/** Forward arrow that points the reading direction (flips in RTL). */
export function Arrow({ className = "", ...props }: LucideProps) {
  return <ArrowRight aria-hidden className={`rtl:-scale-x-100 ${className}`} {...props} />;
}
