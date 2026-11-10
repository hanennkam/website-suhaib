# Ahmad Suhaib — Portfolio

A single-page portfolio for **Ahmad Suhaib**, a software engineer, creative technologist and founder. The site presents four selected products, three studio objects in a pinned 3D sequence, the ventures around them, recognition and a contact point.

**Production:** https://website-suhaib.vercel.app/

## Stack

- Static HTML, CSS and JavaScript — no framework and no build step.
- **Three.js r128** with GLTFLoader for the hero and objects scenes.
- **GSAP 3.12.5** and **ScrollTrigger 3.12.5** for the scroll choreography.
- **Lenis 1.1.14** for smooth scrolling, integrated with ScrollTrigger.
- **Inter** (local WOFF2) as the only typeface.
- **Vercel** for hosting, compression and cache headers.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

No install or build step is required.

## Structure

```
index.html          page content, metadata and JSON-LD
styles.css          reset, tokens, header, shared foundations
phase-a.css         hero, About, navigation and typography layer
phase-c.css         selected work and More work
phase-d.css         pinned Objects stage and static cards
phase-e.css         Ventures, Recognition, Contact, footer and final polish
main.js             navigation, scroll-spy, tone, page background, email copy
stage3d.js          shared Three.js renderer
hero3d.js           hero camera stage
pinned3d.js         pinned Objects sequence and canvas handover
work.js             work reveals, counters and lazy demo loader
work-demos.js       selected work demo interactions
assets/             fonts, models, images and brand records
vendor/             local Three.js and GLTFLoader
docs/               internal notes and historical archive
```

## Performance and resilience

Measured with Lighthouse against a gzip-enabled local server:

| Mode | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 100 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Mobile: LCP 1.8s, TBT 0–10ms, CLS 0, about 200 KiB transferred. Desktop: LCP 0.4s, TBT 0ms, CLS 0. The page keeps around 500 DOM elements. The pinned sequence was measured at 60fps in headless Chromium; verify on the target device.

The hero is poster-first. The 3D camera loads after idle, and the Objects section loads its models progressively. One WebGL renderer is shared between the hero and the pinned stage. On mobile, coarse pointers, reduced motion, low-memory devices or WebGL failure, the Objects section becomes three static product cards with no pin and no 3D. A no-JavaScript fallback also exposes the static content.

## Design notes

The design follows Apple product-page principles: one message per section, large type, generous space, a single warm accent (`#ff5a2a` graphics, `#c2410c` on light, `#ff8a5f` on dark), and no decorative UI noise. Content is limited to facts already present in the project record — no invented clients, screenshots or metrics. The 3D is used as product photography, not as a gimmick: the camera opens the page, the pinned objects give three ventures a physical presence, and every 3D path has a static equivalent.

Internal notes in Bahasa Malaysia are in [`docs/PROJEK.md`](docs/PROJEK.md). The pre-redesign audit and brand integration notes are kept in [`docs/archive/`](docs/archive/).
