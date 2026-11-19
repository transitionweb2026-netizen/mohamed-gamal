import type { SiteView } from "@/lib/cms/view";
import { socialIcons, socialNames } from "./brand-icons";

export function SocialLinks({ socials, light = false, className = "" }: { socials: SiteView["socials"]; light?: boolean; className?: string }) {
  if (!socials.length) return null;
  return (
    <ul className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {socials.map(({ platform, href }) => {
        const Glyph = socialIcons[platform];
        return (
          <li key={platform}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={socialNames[platform]} title={socialNames[platform]} className={`social-btn ${light ? "social-btn--light" : ""}`}>
              <Glyph />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
