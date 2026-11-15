import type { SVGProps } from "react";
import type { SocialPlatform } from "@/config/site";

type P = SVGProps<SVGSVGElement>;

/** Simplified brand glyphs (lucide v1 ships no brand icons). */
export function WhatsAppIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.04 2.5a9.45 9.45 0 0 0-8.13 14.27L2.5 21.5l4.86-1.37a9.45 9.45 0 1 0 4.68-17.63Zm0 1.7a7.75 7.75 0 1 1-3.95 14.42l-.29-.17-2.88.81.83-2.8-.19-.3A7.75 7.75 0 0 1 12.04 4.2Z" />
      <path d="M8.86 7.35c.18-.4.37-.41.55-.42h.47c.16 0 .41.06.63.5.22.46.75 1.82.82 1.95.07.14.11.3.02.48-.1.19-.14.3-.28.47-.14.16-.3.37-.42.5-.14.13-.29.28-.12.55.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.44.12.6-.07.17-.19.7-.82.89-1.1.18-.28.37-.23.62-.14.25.09 1.6.76 1.88.9.27.13.46.2.52.32.07.11.07.64-.15 1.26-.22.62-1.3 1.22-1.79 1.26-.46.05-1.03.07-1.66-.1a15.2 15.2 0 0 1-1.5-.56c-2.64-1.14-4.36-3.8-4.5-3.97-.12-.18-1.06-1.42-1.06-2.7 0-1.29.67-1.92.91-2.18Z" />
    </svg>
  );
}

export function FacebookIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.6 21.5v-8.06h2.7l.4-3.14h-3.1V8.3c0-.9.26-1.53 1.56-1.53h1.66V3.96c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.03 1.46-4.03 4.14v2.32H7.66v3.14h2.71v8.06h3.23Z" />
    </svg>
  );
}

export function InstagramIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path
        fillRule="evenodd"
        d="M21.58 7.19a2.65 2.65 0 0 0-1.86-1.87C18.07 4.88 12 4.88 12 4.88s-6.07 0-7.72.44a2.65 2.65 0 0 0-1.86 1.87A27.6 27.6 0 0 0 2 12a27.6 27.6 0 0 0 .42 4.81 2.65 2.65 0 0 0 1.86 1.87c1.65.44 7.72.44 7.72.44s6.07 0 7.72-.44a2.65 2.65 0 0 0 1.86-1.87A27.6 27.6 0 0 0 22 12a27.6 27.6 0 0 0-.42-4.81ZM10 15.06V8.94L15.2 12 10 15.06Z"
      />
    </svg>
  );
}

export function TikTokIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.7 5.82A4.28 4.28 0 0 1 15.64 3h-3.09v12.4a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.38-2.48V9.66a5.73 5.73 0 0 0-.78-.05 5.69 5.69 0 0 0-5.69 5.69A5.69 5.69 0 0 0 9.95 21a5.69 5.69 0 0 0 5.69-5.69V9.07a7.33 7.33 0 0 0 4.28 1.37V7.35a4.29 4.29 0 0 1-3.22-1.53Z" />
    </svg>
  );
}

export const socialIcons: Record<SocialPlatform, (props: P) => React.JSX.Element> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
};

export const socialNames: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};
