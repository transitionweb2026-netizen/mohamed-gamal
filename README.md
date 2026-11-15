# Dr. Mohamed Gamal — Physiotherapy & Rehabilitation

Bilingual (Arabic default, RTL / English, LTR) website built with Next.js 16, React 19 and Tailwind CSS v4.

```bash
npm install
npm run dev        # http://localhost:3000  →  redirects to /ar
npm run build      # production build (all pages prerendered)
```

## Where to edit content

| What | File |
| --- | --- |
| Phone, WhatsApp, social links, map, doctor portrait | `config/site.ts` |
| All Arabic text (pages, services, videos, articles, FAQ…) | `content/ar.ts` |
| All English text | `content/en.ts` |
| Photos (paths + alt text) | `content/media.ts` → files in `public/images/photos/` |
| YouTube videos | `youtubeId` of each entry in `videos` (both language files) |
| Article publication dates | optional `date: "YYYY-MM-DD"` on each article |

Text wrapped in `[[double brackets]]` is a **placeholder** and is highlighted on the page
with a dashed cyan outline. Search the project for `[[` to find every one.

## Structure

- `app/[lang]/…` — pages (home, about, services, videos, articles, articles/[slug], contact, 404)
- `app/globals.css` — design tokens, liquid-glass material system, hero, nav, motion
- `components/` — navbar, footer, page hero + social/phone panel, global CTA, cards, sections
- `proxy.ts` — redirects un-prefixed URLs to `/ar` (or the visitor's saved language)

The global CTA and footer are rendered once in `app/[lang]/layout.tsx`, so they appear on every page.
