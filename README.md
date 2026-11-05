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
| **04 — Worlds** | Six brand/product environments: Hannenkam Rise Ventures, DevXMedia, Sejenak Photobooth & Terabooth, Tinta Visuals, BVRCODE Apparel, and the live **Duits** product. BVRCODE and Duits use official brand assets. |
| **05 — Record** | Honours, education, and the internship availability window as an editorial ledger. |
| **06 — Transmit** | A typographic finale with a copy-to-clipboard email action, local time, and ecosystem links. |

## Architecture

No framework, no build step. A static site with authored HTML, CSS and JS:

```
index.html       semantic markup and content
styles.css       design system, chapter layouts, responsive rules, fallbacks
photos.css       editorial photography layer, layered compositions, masks
brands.css       official brand palettes + BVRCODE/Duits live-product styles
main.js          intro monolith, universe map, horizontal work film, interactions
artefacts.css    object-study exhibit layout
artefacts.js     lazy glTF viewer (camera / kiosk / jersey)
og-image.png     1200 × 630 social preview
assets/grain.png generated film-grain texture (original asset)
assets/photos/   local, optimised context photography
assets/brands/   official logos, products, screenshots + manifest
assets/models/   authored glTF objects + fallback renders
assets/CREDITS.md   photo sources and licensing
tools/import_brand_assets.py  manual brand-asset importer
```

### Libraries

- **Three.js r128** — intro monolith, universe map and the lazy glTF artefacts viewer (GLTFLoader + OrbitControls).
- **GSAP 3.12 + ScrollTrigger** — pinned horizontal work, manifesto reveal, section choreography.
- **Lenis** — smooth scroll, integrated with ScrollTrigger.
- **Google Fonts** — Archivo, Instrument Serif, JetBrains Mono (open-source licences).
- **Pexels photography** — locally hosted context imagery under the Pexels License. It is used as editorial context only, never as documentation of actual clients, teams, premises or events. See [`assets/CREDITS.md`](assets/CREDITS.md).
- **Official brand assets** — BVRCODE official logo + product photography from bvrcodeapparel.com; Duits official wallet logo + public live-app screenshot. Source, usage and licence notes are in [`assets/brands/manifest.json`](assets/brands/manifest.json) and [`assets/brands/README.md`](assets/brands/README.md).
- Project and venture diagrams remain procedural; no invented project screenshots.

### Interaction inventory

- Cinematic intro with calibration boot, name reveal, draggable crystal, cursor parallax, orbital shards, and particle field.
- Universe: click/touch raycasting, drag-to-orbit, accessible domain buttons, camera pulse, linked content panel.
- Work: scroll-driven horizontal reel, snap alignment, project index, keyboard/button navigation, and one interaction per project:
  - Duits receipt parsing
  - Waspada Banjir alert-state simulation
  - Agent task dispatch log
  - Invoicing architecture node explorer
  - XAUUSD news-guard toggle
- Worlds: official Instagram links for DevXMedia, Sejenak, Tinta and BVRCODE; DevXMedia's COMBAT 2025 reel card; real BVRCODE product photography and official logo; a live Duits product world with official wallet logo, live screenshot and a light-blue glass identity; Sejenak shutter, Tinta filmstrip, BVRCODE pattern customiser, Hannenkam ecosystem jump links, and a six-identity world index.
- Editorial photography: subtle scroll parallax, layered cards, clipped masks, hover zooms, and explicit stock-context captions. Official brand assets are kept separate from licensed context imagery.
- Artefacts: lazy glTF viewer with orbit, zoom, keyboard tabs, fallback renders, and a real workshop-gear reference image.
- Contact: clipboard copy with toast and fallback.
- Custom cursor labels, chapter rail, live Kuala Lumpur clock, and mobile index menu.

### Performance and resilience

- Three WebGL scenes (intro, universe, artefacts), all paused when off-screen and on hidden tabs; the glTF viewer boots only when approached.
- Device-pixel ratio capped; particle/instance counts reduced on small screens.
- Context and brand images are locally hosted with responsive `srcset`, intrinsic dimensions and `loading="lazy"`; BVRCODE assets include WebP + JPEG fallbacks.
- Instagram media is not embedded as a live feed. The public DevXMedia reel still is a local poster; video playback links out to Instagram.
- `prefers-reduced-motion` alternative: static monolith, no 3D canvases, accessible static universe, vertical project stack, no autoplay motion.
- No-WebGL fallback: CSS monolith and static universe content.
- No-JavaScript fallback: all content remains readable, and the work reel becomes a vertical stack.
- Work reel becomes a vertical stack below 1100 px; venture copy and visual stacks reflow below 1280 px so photography keeps its breathing room.
- Lighthouse: **100 accessibility / 100 best practices / 100 SEO**.

## Run locally

No build step:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

Static hosting — Cloudflare Pages, GitHub Pages, Netlify, or any static file server. Deploy the repository root.

## Brand assets and access

- **Official sources used:** [BVRCODE Apparel website](https://bvrcodeapparel.com/) (logo + real products), [Duits live app](https://duits-money-tracking.onrender.com/) (logo + public sign-in screenshot), and the public [Instagram reel](https://www.instagram.com/reel/DKAROWSgwPW/) from Dev X Media.
- **Instagram access:** the four public profiles are linked, but Instagram places profile media behind a login wall. No login, session cookies, private endpoints or credentials were used. No live Instagram feed is embedded.
- **Still needed from Ahmad:** official logos and original media for DevXMedia, Sejenak, Tinta and Hannenkam; a Duits Instagram URL if one exists; optional post-login Duits dashboard screenshots. See the missing list in [`assets/brands/README.md`](assets/brands/README.md).
- **Manual import:** drop originals in `assets/brands/_inbox/` and run `python3 tools/import_brand_assets.py --dry-run`, then without `--dry-run`. The importer preserves originals, creates WebP/JPEG derivatives and updates the manifest.
- **Brand colours:** Duits palette is sampled from the official wallet logo; BVRCODE uses its black/white logo plus the verified official site palette (ink, olive, cream, gold). Palettes for brands without official logos remain visibly labelled as provisional rather than guessed.

## Notes

- Content is factual and drawn from the existing portfolio.
- Diagrams on project scenes are explicitly labelled as illustrative, schematics, or interface studies; they are not presented as live data or project screenshots.
- Stock photography is context imagery only and is labelled as such. It is not a photograph of Ahmad Suhaib, his team, clients, premises or events.
- The design audit is documented in [`AUDIT.md`](AUDIT.md). The brand-source audit and asset status are documented in [`BRAND_UPDATE.md`](BRAND_UPDATE.md).
- The `journey-website/` and `reference/` folders are source material and are not used by the site.
