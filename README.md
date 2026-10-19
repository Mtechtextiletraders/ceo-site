# ceo-site

Founder website for Abdul Rasheed Gill (M Tech Textile Traders). Static site on Cloudflare Pages: push to `main` = live.

Keep `google87a7b96032fd7402.html` (Search Console verification).

## Swapping photos

All photos are plain files in `assets/img/`. To use new edited photos, replace the file with one of the
**same name, same aspect ratio** (JPG, roughly the same pixel size). No HTML change is needed.

| File | Where it shows | Shape |
|---|---|---|
| `hero.jpg` | Hero portrait (first screen) and social preview | Square 1640x1640, face near centre, upper third |
| `og.jpg` | Link preview (WhatsApp / Facebook) | 1200x630 |
| `advisory.jpg` | Advisory section | Square 1100x1100 |
| `field-spinning.jpg`, `field-carding.jpg`, `field-dispatch.jpg`, `field-hall.jpg`, `field-exhibition.jpg` | Story chapters | Portrait 825x1100 (3:4) |
| `field-tc07.jpg`, `field-floor-1.jpg`, `field-ringframes.jpg`, `field-abroad.jpg`, `field-travel.jpg` | "On the floor" rail | Portrait 825x1100 (3:4) |

After replacing, bump `?v=` on `css/style.css` in `index.html` is not needed for images; Cloudflare serves new files on deploy.

## Real-time 3D (WebGL)

Source is in a separate build folder (not deployed); the bundle is in `js/cine/` (Three.js r170, code-split per scene,
loaded only when a section is near the screen and disposed when far away).

- `machine` - ring spinning frame: reveal, turn, exploded view with callouts, ring & traveller macro, closes
- `drive` - meshing gear train: spare parts -> machinery -> complete mills -> imports
- `globe` - career journey on a 3D globe (Natural Earth coastlines): Karachi 1988, industrial cities, Turkey/Egypt/Russia, Singapore, Lahore & Faisalabad
- `cotton` - cotton bolls drawn into sliver, twisted into yarn, wound onto a cone (inside "Expertise")

Posters `assets/img/cine/*-d.webp` / `*-m.webp` are frames rendered from the same scenes; they show when WebGL is
unavailable or reduced motion is on. Regenerate by opening `/?poster=<scene>&cinep=<0..1>`.
