import { Phone } from "lucide-react";
import { telLink } from "@/lib/cms/links";
import type { SiteView } from "@/lib/cms/view";
import { SocialLinks } from "@/components/ui/social-links";

interface Props {
  socials: SiteView["socials"];
  phones: SiteView["contact"]["phones"];
  labels: { follow: string; call: string; label: string };
}

/**
 * The hero's unified horizontal panel: [ social icons ] | [ phone numbers ].
 * One row at every width — the numbers stack, so more numbers never widen
 * the panel; on phones the labels drop and controls shrink.
 */
export function ContactPanel({ socials, phones, labels }: Props) {
  if (!socials.length && !phones.length) return null;
  const primary = phones[0];
  return (
    <div className="lg lg--deep hero-panel" role="group" aria-label={labels.label}>
      {socials.length ? (
        <div className="flex flex-none items-center gap-2">
          <span className="hero-panel__label">{labels.follow}</span>
          <SocialLinks socials={socials} />
        </div>
      ) : null}
      {socials.length && phones.length ? <span className="panel-divider" aria-hidden /> : null}
      {primary ? (
        <div className="panel-phone">
          <a href={telLink(primary.digits)} className="panel-phone__icon" aria-label={`${labels.call}: ${primary.display}`}>
            <Phone size={18} strokeWidth={2.2} aria-hidden />
          </a>
          <span className="flex flex-col">
            {phones.map((p) => (
              <a key={p.digits} href={telLink(p.digits)} dir="ltr" className="panel-phone__num" aria-label={`${labels.call}: ${p.display}`}>
                {p.display}
              </a>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
