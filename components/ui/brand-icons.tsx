import type { SVGProps } from "react";
import type { SocialPlatform } from "@/lib/cms/types";

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

export function XIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.6 3.5h3.07l-6.7 7.66 7.88 10.34h-6.17l-4.83-6.32-5.53 6.32H2.25l7.17-8.2L1.86 3.5h6.33l4.37 5.78 5.04-5.78Zm-1.08 16.18h1.7L7.25 5.22H5.42l11.1 14.46Z" />
    </svg>
  );
}

export function LinkedInIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.75h3.96V21H3V9.75Zm6.44 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.63 4.74 6.06V21h-3.96v-5.07c0-1.21-.02-2.77-1.69-2.77-1.69 0-1.95 1.32-1.95 2.68V21H9.44V9.75Z" />
    </svg>
  );
}

export function SnapchatIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 3.2c2.9 0 4.9 2.1 4.9 5.1v2.1c.5.2 1.1.1 1.6-.1.5-.2 1 .4.6.8-.6.6-1.5.9-2.1 1.1.5 1.8 2 3.1 3.8 3.6.3.1.4.5.1.7-.7.4-1.6.6-2.4.7-.2.5-.1 1.1-.5 1.3-.6.2-1.4-.1-2.2.1-.9.2-1.6 1.5-3.8 1.5s-2.9-1.3-3.8-1.5c-.8-.2-1.6.1-2.2-.1-.4-.2-.3-.8-.5-1.3-.8-.1-1.7-.3-2.4-.7-.3-.2-.2-.6.1-.7 1.8-.5 3.3-1.8 3.8-3.6-.6-.2-1.5-.5-2.1-1.1-.4-.4.1-1 .6-.8.5.2 1.1.3 1.6.1V8.3c0-3 2-5.1 4.9-5.1Z" />
    </svg>
  );
}

export function ThreadsIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden {...props}>
      <path d="M16.6 10.4c-.4-2.5-2.1-3.9-4.6-3.9-2.2 0-3.7 1.2-4.2 2.9" />
      <path d="M17.9 8.6C17 5.4 14.8 3.5 12 3.5c-4.3 0-7.1 3.4-7.1 8.5s2.8 8.5 7.1 8.5c3.5 0 6.4-2.2 6.4-5.3 0-2.6-2.2-4.2-5.4-4.2-2.4 0-4 1.1-4 2.7 0 1.4 1.2 2.4 3 2.4 2.6 0 3.7-1.9 3.7-5" />
    </svg>
  );
}

export const socialIcons: Record<SocialPlatform, (props: P) => React.JSX.Element> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  linkedin: LinkedInIcon,
  snapchat: SnapchatIcon,
  threads: ThreadsIcon,
};

export const socialNames: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  threads: "Threads",
};
