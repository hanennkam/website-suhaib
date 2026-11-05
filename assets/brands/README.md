# Brand asset library

This directory holds official business assets separately from the site's licensed stock context photography.

## Access status

| Source | Status | What was used |
| --- | --- | --- |
| [Instagram @devx.media](https://www.instagram.com/devx.media/) | Public profile inspected; media behind Instagram's login wall. No authentication bypass. | One public reel still via Instagram oEmbed: https://www.instagram.com/reel/DKAROWSgwPW/ |
| [Instagram @sejenakphotobooth](https://www.instagram.com/sejenakphotobooth/) | Public profile inspected; media behind login wall. | None yet — manual originals needed. |
| [Instagram @bvrcode.apparel](https://www.instagram.com/bvrcode.apparel/) | Public profile inspected; media behind login wall. | Official website assets used instead. |
| [Instagram @tintavisuals](https://www.instagram.com/tintavisuals/) | Public profile inspected; media behind login wall. | None yet — manual originals needed. |
| [bvrcodeapparel.com](https://bvrcodeapparel.com/) | Public official business site. | Official logo + real sublimated teamwear photography. |
| [Duits live app](https://duits-money-tracking.onrender.com/) | Public live product. | Official wallet logo + public invite-only sign-in screenshot. |

No Instagram passwords, cookies, session tokens or access tokens are stored in this repository. No private media was accessed. If Instagram Graph API access is later connected, keep tokens in server-side environment variables only.

## Directory convention

```
assets/brands/<brand>/
  logo/
  photos/
  videos/
  screenshots/      # where relevant
  source/           # untouched originals where downloaded manually
  promotional/
```

Brand slugs:

- `hannenkam-rise-ventures`
- `dev-x-media`
- `sejenak-photobooth`
- `tinta-visuals`
- `bvrcode-apparel`
- `duits`

See `manifest.json` for asset-by-asset source, type, target section and usage notes.

## Manual import workflow

1. Put original files in `assets/brands/_inbox/`.
2. Use this filename pattern:

   ```
   <brand>__<kind>__<slug>.<ext>
   ```

   Examples:

   ```
   sejenak-photobooth__photo__event-setup-01.jpg
   tinta-visuals__video__event-film-01.mp4
   dev-x-media__logo__devx-mark.png
   duits__screenshot__dashboard-01.png
   ```

   Valid kinds: `logo`, `photo`, `video`, `screenshot`, `promotional`.
3. Run:

   ```bash
   python3 tools/import_brand_assets.py --dry-run
   python3 tools/import_brand_assets.py
   ```

4. The script copies the original into the brand's `source/`, creates optimised WebP/JPEG derivatives for images, and appends a manifest entry. It never overwrites an existing source file.
5. For a video, also import a poster image separately (`kind=photo` or `screenshot`) so the site can show a still before the user presses play. Do not autoplay large files.
6. Review `manifest.json`, then reference the optimised files from `index.html`/`brands.css`.

### If you want Instagram API access instead

Use a server-side environment only:

```bash
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
```

Never commit these values. `.gitignore` already ignores `.env` and `.env.*`.

## Missing assets to send

### Hannenkam Rise Ventures
- Official logo (SVG / transparent PNG)
- Brand colours / guidelines
- Official Instagram URL (none was supplied)

### Dev X Media
- Official logo / profile mark
- 6–10 original photos or reels from actual work
- Brand colours extracted from the official logo
- Optional: profile avatar

### Sejenak Photobooth
- Official logo
- Original event photographs (setups, guests, prints, equipment)
- Reels / short event films
- Brand colours extracted from the official logo

### Tinta Visuals
- Official logo
- Original photography / videography stills
- Production BTS images or reel links
- Brand colours extracted from the official logo

### BVRCODE Apparel
- Optional vector SVG of the official logo
- Optional additional high-resolution product / production photos

### Duits
- Official Instagram URL (not supplied)
- Post-login dashboard screenshots, only if safe to share publicly
- Additional logo lockups / guidelines

## Do not

- Do not add stock photos to these brand folders.
- Do not treat licensed stock context imagery as documentation of a client, team or event.
- Do not commit credentials or exported private account data.
