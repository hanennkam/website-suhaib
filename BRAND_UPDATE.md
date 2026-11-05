# Brand identity update — sources, decisions, limitations

## What was found

- The site had no Instagram links, official business logos or brand-specific palettes.
- Business sections used curated stock photography as explicitly labelled context, not as actual client work.
- Duits appeared only as a work-reel project; it had no live-product status or brand world.
- The BVRCODE section used a stock textile image and a stock jersey photo; the 3D jersey is a stylised object, not a product reference.

## Official sources accessed

| Source | Access | Use |
| --- | --- | --- |
| [bvrcodeapparel.com](https://bvrcodeapparel.com/) | Public | Official BVRCODE logo, real product photography, official site palette. |
| [Duits live app](https://duits-money-tracking.onrender.com/) | Public | Official wallet logo + public invite-only sign-in screenshot. |
| [Instagram @devx.media](https://www.instagram.com/devx.media/) | Public profile via browser; media behind login | Public reel still via Instagram oEmbed: [COMBAT 2025](https://www.instagram.com/reel/DKAROWSgwPW/). |
| [Instagram @sejenakphotobooth](https://www.instagram.com/sejenakphotobooth/) | Public profile metadata; media behind login | Profile link only; original media requested. |
| [Instagram @bvrcode.apparel](https://www.instagram.com/bvrcode.apparel/) | Public profile metadata; media behind login | Profile link; official website used for assets. |
| [Instagram @tintavisuals](https://www.instagram.com/tintavisuals/) | Public profile metadata; media behind login | Profile link only; original media requested. |

No credentials, cookies or private endpoints were used. No live Instagram feed is embedded.

## Implemented

- Added official Instagram links to DevXMedia, Sejenak, Tinta and BVRCODE.
- Added BVRCODE official logo, real product photography, WebP/JPEG derivatives and the verified official site palette.
- Added a dedicated **Duits** live-product world and updated the Duits work-reel scene with a LIVE status, official wallet logo and light-blue glass identity.
- Added a real DevXMedia Instagram reel poster linking to the original COMBAT 2025 reel.
- Added Duits to the Hannenkam ecosystem map, worlds cover index and photographic strip.
- Added a local brand-asset library, manifest, credits and a non-destructive importer: `tools/import_brand_assets.py`.
- Preserved all existing interactions, chapter structure, navigation and typography.

## Brand colours

| Brand | Status | Values |
| --- | --- | --- |
| Duits | **Extracted from official logo** | `#6FA6F2`, `#BED8FB`, `#2F65D3`, `#E3EDFB`, `#F1F7FF`, ink `#0B1A33` |
| BVRCODE Apparel | **Logo + verified official site** | Logo `#000000 / #FFFFFF`; site ink `#0E0F0A`, panel `#17190F`, olive `#565C3F`, light olive `#7A8358`, cream `#F2EDE0`, gold `#C9A66B` |
| Dev X Media | Provisional only | Existing section palette; no official logo supplied. |
| Sejenak Photobooth | Provisional only | Existing lime identity; no official logo supplied. |
| Tinta Visuals | Provisional only | Existing crimson identity; no official logo supplied. |
| Hannenkam Rise Ventures | Provisional only | Existing champagne identity; no official logo supplied. |

## Still missing

- DevXMedia official logo / profile mark and original work media.
- Sejenak official logo, event photos, print/equipment details and reels.
- Tinta official logo, original photography / videography and BTS media.
- Hannenkam official logo, guidelines and Instagram URL.
- Duits Instagram URL (not supplied); optional post-login dashboard screenshots.
- Optional BVRCODE vector logo and extra production photos.

The manual import workflow is documented in `assets/brands/README.md`; the machine-readable manifest is `assets/brands/manifest.json`.
