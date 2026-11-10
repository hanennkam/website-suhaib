> **Pra-redesign archive.** This document is kept for historical reference only and does not describe the current site.

# Brand integration — Phase 2

**Scope:** integrate the verified brand recovery package into the existing Signal Archive. No recovery assets were modified. No deployment has been made.

## What changed

- `index.html` — real brand media, editorial galleries, product-surface strip, temporary logo slots and explicit missing-asset states.
- `brands.css` — brand-specific colour tokens, gallery layouts, responsive rules and empty-state styling.
- `main.js` — added the new galleries/product strip to the existing reveal observer; no new dependency.
- `assets/brands/` — optimized derivatives copied from the recovery package and temporary 150 px avatars for the small mark slots.
- `assets/brands/integration-manifest.json` — machine-readable list of the integrated files and sources.

The recovery package at `public/assets/brands/` remains untouched.

## Brand status

### BVRCODE Apparel — full asset integration

- Official logo: `assets/brands/bvrcode-apparel/logo/logo-bvrcode-transparent.png` (plus black, cream and original variants).
- Colour tokens: black `#000000`, cream `#f2ede0`, gold `#c9a66b`, olive `#565c3f` / `#7a8358`, dark background `#0e0f0a`.
- Integrated real photography:
  - 6 selected Instagram product/team photographs: checkerboard, cream, blue 23, charcoal, team delivery and portrait print.
  - Official website workshop, green team kit and blue kit photography retained.
- Presentation: dedicated `BVRCODE / FIELD ARCHIVE` editorial grid with varied aspect ratios, original Instagram links, real jersey designs and no generic sportswear stock.

### Duits — full product identity

- Official logo: `assets/brands/duits/logo/duits-logo-transparent.png`.
- Colour tokens: primary `#6fa6f2`, secondary `#bed8fb`, deep `#2f65d3`, ice `#e3edfb`, ink `#0b1a33`.
- Integrated screenshot: `assets/brands/duits/screenshots/duits-live-signin-430.jpg` (public sign-in surface only).
- Added a dedicated `PRODUCT SURFACE / VERIFIED SCREENSHOTS` strip with the real public sign-in capture and an explicit empty slot for an approved dashboard capture.
- No dashboard screenshots or product features were invented.

### Sejenak Photobooth — real media integration

- Temporary mark only: `profile-avatar-150-LOW-RES.jpg` displayed at 42 px with a visible “full-res logo pending” note. It is never used as a large logo.
- Colour tokens sampled from the official avatar: cobalt `#0e4adc`, ice `#d2e6fb`, electric `#074af0`, ink `#071a4a`.
- Integrated media:
  - Hero event photograph: `sejenak-event-stage-*`.
  - Print detail: `sejenak-print-detail-*`.
  - Gallery: guest portrait, print strips, kiosk guests, print wall, print detail and one Reel poster.
  - The Reel poster is labelled “NOT PLAYABLE HERE” and links to the original Instagram Reel.
- The original event photographs replace the previous licensed stock imagery in the Sejenak section.

### Dev X Media — real activity integration

- Temporary mark only: official 150 px avatar at 42 px with a visible pending-logo note.
- Colour tokens sampled from the official avatar: red `#b50631`, black `#0d0d0d`, white `#ffffff`.
- Integrated media:
  - UMPSA Innovatech closing-ceremony team photograph (hero).
  - Activity photograph for the detail layer.
  - Gallery: closing ceremony, award certificate and the official services index graphic.
  - Existing `COMBAT 2025` Reel poster retained as a link, not a playable video.
- The previous licensed stock workspace image was removed from the Dev X section.

### Tinta Visuals — prepared, not fabricated

- Temporary mark only: official 150 px avatar at 42 px, with a visible pending-logo note.
- Provisional tokens sampled from the official avatar: brown `#5d2f1f`, cream `#c5b1a8`, accent `#e6d4c4`, background `#150b07`.
- The stock production photographs were removed from the Tinta world and Tinta cover card.
- The section now has an explicit `TINTA / MEDIA VAULT` with three empty media slots, working filmstrip controls and a clear note that no stock or unrelated-account media is presented as Tinta work.
- No Tinta portfolio work was invented.

### Hannenkam Rise Ventures — logo slot only

- No logo, monogram, substitute mark or invented palette.
- Added a visible dashed `OFFICIAL MARK / AWAITING SOURCE` slot in the copy and replaced the HRV monogram in the ecosystem centre with a `LOGO SLOT` state.
- The cover card is now a neutral pending plate rather than a stock image presented as brand identity.

## Still missing

- Sejenak: full-resolution/vector logo; original MP4 exports for two Reels.
- Dev X Media: full-resolution/vector logo; original MP4 exports for three Reels.
- Tinta Visuals: full-resolution/vector logo; verified owned photography/video. The only public profile item is owned by `@vnaisuu` and is deliberately excluded.
- Hannenkam Rise Ventures: official logo, verified palette/guidelines, Instagram URL if one exists.
- Duits: approved post-login dashboard screenshot(s); optional additional logo lockups.
- BVRCODE: optional SVG logo and optional additional production photography.

These slots are documented in `assets/brands/integration-manifest.json` and the recovery report at `public/assets/brands/RECOVERY-REPORT.md`.

## Validation

- Every new `src`/`srcset`/`href` asset path resolves locally.
- 75 unique local asset references checked; 0 missing.
- Page console: 0 errors at desktop test viewport.
- Network: 0 failed asset requests at 1440 and 390 widths.
- Desktop (1440 × 1000) and mobile (390 × 844) world layouts rendered and inspected.
- No horizontal overflow at either test width.
- Galleries use responsive `<picture>`/`srcset`, explicit dimensions, `loading="lazy"` and `decoding="async"`.
- All new images have alt text.
- Tinta filmstrip state switching verified; no Tinta stock imagery remains.
- No unrelated `@vnaisuu` media is assigned to a brand.
- No playable video is claimed for the Reel posters.
- Lighthouse (desktop audit): **100 Accessibility · 100 Best Practices · 100 SEO**.
- The existing navigation, chapter system, typography, motion and overall Signal Archive identity are preserved.

### Final visual QA — 2026-11-07

Reviewed every world at **1440 px, 768 px and 390 px**:

- No horizontal overflow, unloaded images, failed requests or console errors.
- BVRCODE, Sejenak and Dev X galleries crop cleanly; logo/avatar sizes and alignments hold at all three widths.
- Duits’s mark → live device → status → screenshot archive hierarchy remains clear.
- Tinta’s media vault and Hannenkam’s logo-slot states read as explicit pending states, not broken media.
- Gallery reveal, Tinta filmstrip switching, BVRCODE pattern switching and the Sejenak shutter demo all work.
- The only visual QA adjustment was the Dev X Reel card: the ambiguous play triangle was changed to an external-open arrow and the caption now says “POSTER”, so a poster frame is not presented as a playable local video.
- No spacing, logo, image-cropping, colour or layout changes were required beyond that affordance correction.
- Removed dead Tinta stock-image references from `photos.css`; Tinta now resolves only to brand-native gradients and empty media slots.

## Verification commands

```bash
python3 -m http.server 4173
# browse http://localhost:4173/
```

No build step or package install was added. Nothing has been pushed or deployed.
