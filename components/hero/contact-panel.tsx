import { Phone } from "lucide-react";
import { siteConfig, telHref } from "@/config/site";
import { SocialLinks } from "@/components/ui/social-links";

interface Props {
  labels: { follow: string; call: string; label: string };
}

/**
 * The hero's unified horizontal panel: [ social icons ] | [ phone ].
 * One row at every width — on phones the labels drop and controls shrink.
 */
export function ContactPanel({ labels }: Props) {
  return (
    <div className="lg lg--deep hero-panel" role="group" aria-label={labels.label}>
      <div className="flex flex-none items-center gap-2">
        <span className="hero-panel__label">{labels.follow}</span>
        <SocialLinks />
      </div>
      <span className="panel-divider" aria-hidden />
      <a href={telHref} className="panel-phone" aria-label={`${labels.call}: ${siteConfig.phone.display}`}>
        <span className="panel-phone__icon">
          <Phone size={18} strokeWidth={2.2} aria-hidden />
        </span>
        <span>
          <small>{labels.call}</small>
          <strong dir="ltr">{siteConfig.phone.display}</strong>
        </span>
      </a>
    </div>
  );
}
