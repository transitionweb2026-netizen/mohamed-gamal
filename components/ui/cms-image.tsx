import Image from "next/image";
import type { Img } from "@/lib/cms/view";

/** A media-library image filling its frame, with the focal point chosen in the dashboard. */
export function CmsImage({ img, sizes, className = "object-cover", alt, defaultPosition }: { img: Img | null; sizes: string; className?: string; alt?: string; defaultPosition?: string }) {
  if (!img) return null;
  const position = img.position || defaultPosition;
  return <Image src={img.src} alt={alt ?? img.alt} fill sizes={sizes} className={className} style={position ? { objectPosition: position } : undefined} />;
}
