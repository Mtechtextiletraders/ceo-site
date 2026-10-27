# ceo-site

Personal history website of Abdul Rasheed Gill, founder of M Tech Textile Traders (1988).
Static site on Cloudflare Pages: push to `main` = live. Canonical domain: https://abdulrasheedgill.com

Keep `google87a7b96032fd7402.html` (Search Console verification) and `functions/_middleware.js`
(301 from `ceo.mtechtextiletraders.com` and `www.` to the main domain).

## Pages

| File | URL | What it is |
|---|---|---|
| `index.html` | `/` | Short home: name intro (once per browser session), hero with background video and portrait, three teasers, contact strip |
| `journey.html` | `/journey` | The life story in seven chapters, one photo each |
| `milestones.html` | `/milestones` | Vertical timeline, one line per era |
| `gallery.html` | `/gallery` | Photo grid with a keyboard-accessible lightbox |
| `contact.html` | `/contact` | WhatsApp, call, email, city-level locations |
| `404.html` | - | Not-found page (noindex) |

Cloudflare Pages serves `journey.html` at `/journey`, so internal links, canonicals and the sitemap use the
extensionless URLs. Header and footer are repeated in each page; change all pages together.

## Assets

- `css/style.css` - all styles (one accent `--accent`, one radius `--r`).
- `js/main.js` - menu, scroll reveals, home intro, hero video, lightbox. No libraries.
- `assets/video/bg-d.mp4` + `bg-d.webp` (desktop, 16:9) and `bg-m.mp4` + `bg-m.webp` (mobile, 9:16).
  The `.webp` is the still poster shown first; the video starts after page load and is skipped
  for reduced motion and Save-Data.
- `assets/fonts/` - Bodoni Moda 500 (name, headings) and Hanken Grotesk 400/600 (text).

## Swapping photos

Photos live in `assets/img/` as a `.jpg` (fallback, social/schema) plus a `.webp` with the same name (what browsers load).
Replace both with the **same name and aspect ratio**:

| File | Shape |
|---|---|
| `hero.jpg` / `hero.webp` / `hero-800.webp` | Square 1640x1640 (800x800 for `hero-800`), face in the upper third |
| `advisory.*` | Square 1100x1100 |
| `field-*.*` | Portrait 825x1100 (3:4) |
| `og.jpg` | 1200x630 link preview |

To make a WebP from a JPG: `python3 -c "from PIL import Image; Image.open('x.jpg').save('x.webp', quality=78)"`.
