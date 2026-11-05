# Brand asset inbox

Drop original files here, then run:

```bash
python3 tools/import_brand_assets.py --dry-run
python3 tools/import_brand_assets.py
```

Filename format:

```
<brand>__<kind>__<slug>.<ext>
```

Valid brands:

- `hannenkam-rise-ventures`
- `dev-x-media`
- `sejenak-photobooth`
- `tinta-visuals`
- `bvrcode-apparel`
- `duits`

Valid kinds: `logo`, `photo`, `video`, `screenshot`, `promotional`.

Examples:

```
sejenak-photobooth__photo__event-setup-01.jpg
tinta-visuals__video__event-film-01.mp4
dev-x-media__logo__devx-mark.svg
duits__screenshot__dashboard-01.png
```

The importer preserves the original under the brand's `source/` folder and writes optimised derivatives next to it. It does not overwrite originals.

Do not place passwords, tokens or account exports containing private data here.
