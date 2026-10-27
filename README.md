# ceo-site

Personal history website of Abdul Rasheed Gill, founder of M Tech Textile Traders (1988).
Static site on Cloudflare Pages: push to `main` = live. Canonical domain: https://abdulrasheedgill.com

Keep `google87a7b96032fd7402.html` (Search Console verification) and `functions/_middleware.js`
(301 from `ceo.mtechtextiletraders.com` and `www.` to the main domain).

## Pages

| File | URL | What it is |
|---|---|---|
| `index.html` | `/` | Short home: name intro (once per tab), hero card with portrait and film, life-in-numbers strip, makes ticker, three story tiles, grey band, "the way he works", contact band |
| `journey.html` | `/journey` | The life story in seven chapters, one photo each, plus a short FAQ (FAQPage schema) |
| `milestones.html` | `/milestones` | Vertical timeline, one line per era |
| `gallery.html` | `/gallery` | Photo grid with a keyboard-accessible lightbox |
| `contact.html` | `/contact` | WhatsApp, call, email, city-level locations |
| `404.html` | - | Not-found page (noindex) |

Cloudflare Pages serves `journey.html` at `/journey`, so internal links, canonicals and the sitemap use the
extensionless URLs. Header and footer are repeated in each page; change all pages together.

## Assets

- `css/style.css` - all styles. Look: warm editorial (linen `--linen` and white backgrounds, copper accent `--copper`,
  deep ink `--ink` only for the contact band and footer), Bodoni Moda headings with one italic word, arched photo frames.
- `js/main.js` - menu, soft entrance animations, counters, home intro, hero film, header shrink, back to top,
  gentle photo parallax, story rail (phones), FAQ accordion, footer wordmark, lightbox. No libraries.
  Elements carry `data-a="rise|fade|img"`, headings `data-split`, numbers `data-count`, icons `data-draw`;
  `main.js` adds `.in` when they enter the screen. Without JS, or with reduced motion, everything shows in its final state.
  No scroll-pinning, scroll-scrubbing, cursor effects or particles.
- Home intro: linen screen, name rises, a copper line draws, panel lifts away (~2 s). Once per browser tab (`sessionStorage` key `arg_intro`); click/tap/Esc skips.
- `assets/video/bg-d.mp4` + `bg-d.webp` (desktop, 16:9) and `bg-m.mp4` + `bg-m.webp` (mobile, 9:16) play in the small
  rounded "film" frame beside the hero portrait. The `.webp` poster shows first; the video starts after page load and is
  skipped for reduced motion and Save-Data.
- `assets/fonts/` - Bodoni Moda 400 + italic (headings), Hanken Grotesk 300/400/500 (text).
- `assets/img/mtech-mark-ink.png` - M Tech mark (dark) in the header.
- `assets/img/mood-*.webp` - supporting Pexels photos (cotton field, ring frames, blue yarn), free under the Pexels
  licence. Used as mood images only, never presented as his own photos.

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
