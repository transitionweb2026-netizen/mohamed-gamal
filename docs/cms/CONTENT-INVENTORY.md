# Content inventory and CMS map

Every piece of content on the public website, where it currently lives in the code, and where it lives once the CMS is connected. The dashboard edits exactly these records. There are no fields that the website does not display.

**Languages:** Arabic (default, `/ar`, RTL) and English (`/en`, LTR). Every text below exists in both, and the dashboard edits them side by side.

**Legend:** **Section** = a block of one page, stored in `page_sections` (fields shown) and ordered, hidden and drafted per page. **Collection** = repeatable records in their own table, with draft or published status and an order. **Global** = shared by every page.

---

## Global elements

| Element | Where it appears | Content | CMS home |
| --- | --- | --- | --- |
| Identity | header, footer, metadata, doctor cards, article sidebar | site name, doctor name, professional title, tagline, logo, favicon, doctor portrait | `site_settings` → **Website settings / Doctor profile** |
| Contact details | hero panel (every page), contact page, footer, global CTA, mobile menu | phone numbers (2), WhatsApp number + default message, email, address, working hours, Google Maps embed | `phone_numbers`, `site_settings` → **Contact information** |
| Social links | hero panel, contact page, footer, mobile menu | Facebook, Instagram, YouTube, TikTok (+ X, LinkedIn, Snapchat, Threads available), on/off each | `social_links` → **Social media** |
| Navigation bar | every page | 6 links (label + destination), order, visibility, dropdown children, "Book a visit" button label + destination | `navigation_items` + section `global/navbar` → **Navigation** |
| Global CTA | before the footer on every page | eyebrow, heading, two supporting lines, WhatsApp label + message, call label, "or call" note, image badge text, image, button visibility | section `global/cta` → **Global CTA** |
| Footer | every page | description, column titles, which links to show, copyright text, back-to-top label, labels for phone and WhatsApp | section `global/footer` + `navigation_items.show_in_footer` → **Footer** |
| Services ticker | home, under the hero | the titles of the published services (automatic) | `services` |
| Interface text | buttons, labels, accessible names, 404 page | "Read more", "Watch video", "min read", "Close", breadcrumb label, video "coming soon" texts, article disclaimer, explorer hint, etc. (35 strings) | `ui_strings` → **Website settings → Interface text** |
| SEO defaults | every page without its own values | default title, description, sharing image, indexing switch | `site_settings` → **SEO** |

## Pages and their sections (in display order)

### Home `/`

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | eyebrow, two-word title, subtitle, primary + secondary button (label, link), 3 floating badges (icon, label), cover image + focal point | — |
| 2 | Services ticker | (visibility only) | Services |
| 3 | Doctor introduction | eyebrow, heading, paragraphs, 3 points (icon, title, text), signature role line, button (label, link), main image, secondary image | Website settings (name card) |
| 4 | Key services | eyebrow, heading, text, "all services" button | Services (first 5) |
| 5 | Why choose us | eyebrow, heading, text, 4 items (icon, title, text), image | — |
| 6 | Treatment specialties | eyebrow, heading, text, hover hint, link label | Conditions |
| 7 | Statistics | eyebrow, heading, image | Statistics |
| 8 | Treatment journey | eyebrow, heading, text | Treatment steps |
| 9 | Featured videos | eyebrow, heading, "all videos" button | Videos (featured, up to 3) |
| 10 | Featured articles | eyebrow, heading, "all articles" button | Articles (featured + 5) |
| 11 | Testimonials | eyebrow, heading, text | Testimonials |
| 12 | FAQ | eyebrow, heading, text | FAQs (home group) |

### About `/about`

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | as above | — |
| 2 | Doctor introduction | eyebrow, heading, paragraphs, 3 highlights (icon, title, text) | Doctor portrait, title |
| 3 | Biography | eyebrow, heading, paragraphs, pull quote | — |
| 4 | Education | eyebrow, heading | Credentials (education) |
| 5 | Experience | eyebrow, heading, image | Credentials (experience) |
| 6 | Certifications | eyebrow, heading, text | Credentials (certification) |
| 7 | Achievements | eyebrow, heading, text (shown when at least one achievement is published) | Credentials (achievement) |
| 8 | Treatment philosophy | eyebrow, heading, quote, 3 pillars (icon, title, text), image | — |
| 9 | Values | eyebrow, heading, 6 values (icon, title, text) | — |
| 10 | Statistics | eyebrow, heading, image | Statistics |

### Services `/services`

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | as above | — |
| 2 | Introduction | eyebrow, heading, paragraphs, 3 highlights, card title + text, two images | — |
| 3 | Main services | eyebrow, heading, text | Services marked *featured* (3) |
| 4 | All services | eyebrow, heading, text | Other services (6) |
| 5 | Conditions we treat | eyebrow, heading, text | Conditions |
| 6 | Treatment process | eyebrow, heading | Treatment steps |
| 7 | Our approach | eyebrow, heading, statement, 4 items (icon, title, text) | — |
| 8 | FAQ | eyebrow, heading | FAQs (services group) |

### Videos `/videos`

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | as above | — |
| 2 | Introduction | eyebrow, heading, text, 3 chips (icon, label), channel button label | YouTube link (Social) |
| 3 | Video grid | eyebrow, heading | Videos (all published — 9 at launch) |

### Articles `/articles` (+ `/articles/[slug]`)

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | as above | — |
| 2 | Featured article | eyebrow, heading, text, "featured" badge label | The article marked *featured* |
| 3 | Latest articles | eyebrow, heading | The 6 next published articles |

Each article page uses the article's own title, excerpt, cover image and SEO fields; its sidebar and disclaimer use Interface text.

### Contact `/contact`

| # | Section | Fields | Data from |
| --- | --- | --- | --- |
| 1 | Hero | as above | — |
| 2 | Contact channels | eyebrow, heading, text, card texts (phone, WhatsApp, location, hours) | Contact information |
| 3 | Social media | eyebrow, heading, text | Social links |
| 4 | Booking form + location | form texts (title, labels, reasons, messages), map texts | Contact information (map, address) |

## Collections

| Collection | At launch | Fields |
| --- | --- | --- |
| Services | 9 (3 featured) | slug, icon, image, title, summary, key points, featured, status, order |
| Conditions | 6 | slug, icon, image, body region, description, conditions list, status, order |
| Treatment steps | 4 | icon, title, text, status, order |
| Statistics | 4 | icon, value (e.g. `15+`, counts up when numeric), label, status, order |
| Videos | **9** | slug, category, title, description, YouTube ID **or** external URL **or** uploaded file, thumbnail, featured, status, order |
| Articles | **7 (1 featured + 6)** | slug, title, excerpt, rich-text body (per language), cover image + alt, category, author, publication date, featured, status, SEO title, SEO description, sharing image, order |
| Article categories | 7 | key, name |
| Testimonials | 3 (placeholders) | quote, name, context, placeholder flag, status, order |
| FAQs | 5 home + 5 services | group, question, answer, status, order |
| Credentials | 3 education, 3 experience, 4 certifications (placeholders) | kind (education, experience, certification, achievement), title, place, period, text, status, order |

## Media

28 photographs shipped in `public/images/photos/` (Pexels stock, placeholders) plus the logo mark. They are registered in the media library as *bundled* files, so they can be reused, replaced or retired. New uploads go to Supabase Storage:

| Bucket | Folders | Accepts |
| --- | --- | --- |
| `images` | `website`, `hero`, `doctor`, `articles`, `video-thumbnails`, `icons` | JPG, PNG, WebP, AVIF, GIF, ICO — 15 MB |
| `videos` | `videos` | MP4, WebM, MOV — 500 MB (resumable upload) |
| `documents` | `documents` | PDF — 25 MB |

SVG is deliberately not accepted: SVG files can carry scripts, and the raster formats cover every use on this site.

## Content that stays in code (on purpose)

- Layout, design, animations and the number of grid columns.
- The icon set (editors choose from the registered icons).
- Language codes and text direction (Arabic RTL, English LTR).
