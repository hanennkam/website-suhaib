# Ahmad Suhaib — The Signal Archive

An immersive, single-page portfolio for **Ahmad Suhaib** — software engineer, creative technologist, and founder. The experience is built as a sequence of visual chapters rather than a conventional hero → about → ventures → contact page.

The three concept directions considered, and the reasoning behind the selected direction, are documented in [`CONCEPTS.md`](CONCEPTS.md).

## The experience

| Chapter | What happens |
| --- | --- |
| **00 — Arrival** | A cinematic boot sequence, then a custom WebGL monolith assembles from orbital shards while the name reveals. The scene responds to the cursor and can be dragged. |
| **01 — Operator** | A scroll-driven manifesto reveals word by word, followed by the capability ledger and operating metrics. |
| **02 — The Universe** | A real interactive Three.js domain map. Four distinct node sculptures (Code, AI, Creative, Enterprise) can be selected by click, touch, or the accessible controls. Each domain opens linked portfolio content. |
| **03 — Selected Work** | A pinned horizontal film of six full-screen project scenes. Every project has its own palette, layout, and interactive schematic. |
| **04 — Worlds** | Five venture environments with distinct identities: Hannenkam Rise Ventures, DevXMedia, Sejenak Photobooth & Terabooth, Tinta Visuals, and BVRCODE Apparel. |
| **05 — Record** | Honours, education, and the internship availability window as an editorial ledger. |
| **06 — Transmit** | A typographic finale with a copy-to-clipboard email action, local time, and ecosystem links. |

## Architecture

No framework, no build step. A static site with three authored files:

```
index.html      semantic markup and content
styles.css      design system, chapter layouts, responsive rules, fallbacks
main.js         intro monolith, universe map, horizontal work film, venture interactions
og-image.png    1200 × 630 social preview
assets/grain.png  generated film-grain texture (original asset)
```

### Libraries

- **Three.js r128** — intro monolith and universe map (custom shader, instanced shards, raycaster).
- **GSAP 3.12 + ScrollTrigger** — pinned horizontal work, manifesto reveal, section choreography.
- **Lenis** — smooth scroll, integrated with ScrollTrigger.
- **Google Fonts** — Archivo, Instrument Serif, JetBrains Mono (open-source licences).
- No external photography or project images. All project and venture visuals are procedural / generated from factual content.

### Interaction inventory

- Cinematic intro with calibration boot, name reveal, draggable crystal, cursor parallax, orbital shards, and particle field.
- Universe: click/touch raycasting, drag-to-orbit, accessible domain buttons, camera pulse, linked content panel.
- Work: scroll-driven horizontal reel, snap alignment, project index, keyboard/button navigation, and one interaction per project:
  - Duits receipt parsing
  - Waspada Banjir alert-state simulation
  - Agent task dispatch log
  - Invoicing architecture node explorer
  - XAUUSD news-guard toggle
- Worlds: DevXMedia terminal commands, Sejenak photobooth shutter, Tinta filmstrip, BVRCODE pattern customiser, Hannenkam ecosystem jump links.
- Contact: clipboard copy with toast and fallback.
- Custom cursor labels, chapter rail, live Kuala Lumpur clock, and mobile index menu.

### Performance and resilience

- Two WebGL contexts, both paused when off-screen and on hidden tabs.
- Device-pixel ratio capped; particle/instance counts reduced on small screens.
- `prefers-reduced-motion` alternative: static monolith, no 3D canvases, accessible static universe, vertical project stack, no autoplay motion.
- No-WebGL fallback: CSS monolith and static universe content.
- No-JavaScript fallback: all content remains readable, and the work reel becomes a vertical stack.
- Work reel automatically becomes a vertical stack below 1100 px.
- Accessibility audited with Lighthouse: **100 accessibility / 100 best practices / 100 SEO**.

## Run locally

No build step:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

Static hosting — Cloudflare Pages, GitHub Pages, Netlify, or any static file server. Deploy the repository root.

## Notes

- Content is factual and drawn from the existing portfolio.
- Diagrams on project scenes are explicitly labelled as illustrative, schematics, or interface studies; they are not presented as live data or project screenshots.
- The `journey-website/` and `reference/` folders are source material and are not used by the site.
