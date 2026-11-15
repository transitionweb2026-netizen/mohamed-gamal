import { siteConfig } from "@/config/site";
import { socialIcons, socialNames } from "./brand-icons";

export function SocialLinks({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <ul className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {siteConfig.socials.map(({ platform, href }) => {
        const Glyph = socialIcons[platform];
        return (
          <li key={platform}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialNames[platform]}
              title={socialNames[platform]}
              className={`social-btn ${light ? "social-btn--light" : ""}`}
            >
              <Glyph />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
