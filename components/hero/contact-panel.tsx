import { Phone } from "lucide-react";
import { phones, primaryPhone, telFor, telHref } from "@/config/site";
import { SocialLinks } from "@/components/ui/social-links";

interface Props {
  labels: { follow: string; call: string; label: string };
}

/**
 * The hero's unified horizontal panel: [ social icons ] | [ phone numbers ].
 * One row at every width — the booking numbers stack, so adding a number
 * never widens the panel; on phones the labels drop and controls shrink.
 */
export function ContactPanel({ labels }: Props) {
  return (
    <div className="lg lg--deep hero-panel" role="group" aria-label={labels.label}>
      <div className="flex flex-none items-center gap-2">
        <span className="hero-panel__label">{labels.follow}</span>
        <SocialLinks />
      </div>
      <span className="panel-divider" aria-hidden />
      <div className="panel-phone">
        <a href={telHref} className="panel-phone__icon" aria-label={`${labels.call}: ${primaryPhone.display}`}>
          <Phone size={18} strokeWidth={2.2} aria-hidden />
        </a>
        <span className="flex flex-col">
          {phones.map((p) => (
            <a key={p.e164} href={telFor(p)} dir="ltr" className="panel-phone__num" aria-label={`${labels.call}: ${p.display}`}>
              {p.display}
            </a>
          ))}
        </span>
      </div>
    </div>
  );
}
