#!/usr/bin/env python3
"""Non-destructive brand-asset importer for the portfolio.

Usage:
  python3 tools/import_brand_assets.py --dry-run
  python3 tools/import_brand_assets.py
  python3 tools/import_brand_assets.py --brand sejenak-photobooth --kind photo --file event-01.jpg

Files in assets/brands/_inbox follow:
  <brand>__<kind>__<slug>.<ext>

The original is copied into the brand's source/ folder, never edited.
Images get optimised WebP + JPEG derivatives. The manifest is updated.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import date
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Pillow is required: python3 -m pip install pillow") from exc

ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "assets" / "brands"
INBOX = BRANDS / "_inbox"
MANIFEST = BRANDS / "manifest.json"

BRAND_SLUGS = {
    "hannenkam-rise-ventures",
    "dev-x-media",
    "sejenak-photobooth",
    "tinta-visuals",
    "bvrcode-apparel",
    "duits",
}

KIND_DIRS = {
    "logo": "logo",
    "photo": "photos",
    "video": "videos",
    "screenshot": "screenshots",
    "promotional": "promotional",
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "asset"


def parse_inbox_name(filename: str):
    stem = Path(filename).stem
    parts = stem.split("__")
    if len(parts) != 3:
        raise ValueError(
            f"{filename}: expected <brand>__<kind>__<slug>.<ext>"
        )
    brand, kind, slug = [p.strip() for p in parts]
    if brand not in BRAND_SLUGS:
        raise ValueError(f"{filename}: unknown brand '{brand}'")
    if kind not in KIND_DIRS:
        raise ValueError(f"{filename}: unknown kind '{kind}'")
    return brand, kind, slugify(slug)


def unique_target(target: Path) -> Path:
    if not target.exists():
        return target
    n = 2
    while True:
        candidate = target.with_name(f"{target.stem}-{n}{target.suffix}")
        if not candidate.exists():
            return candidate
        n += 1


def append_manifest(brand: str, kind: str, source_file: str, original: Path, derivatives: list[Path], intended: str):
    if not MANIFEST.exists():
        return
    data = json.loads(MANIFEST.read_text())
    brand_data = data.setdefault("brands", {}).setdefault(brand, {})
    assets = brand_data.setdefault("assets", [])
    for derivative in derivatives:
        assets.append(
            {
                "file": str(derivative.relative_to(ROOT)),
                "type": kind,
                "source": f"manual import: {source_file}",
                "sourceType": "manual import",
                "intendedSection": intended,
                "usageNotes": "Imported from the brand asset inbox. Original preserved in source/.",
            }
        )
    brand_data["lastManualImport"] = date.today().isoformat()
    data["lastUpdated"] = date.today().isoformat()
    MANIFEST.write_text(json.dumps(data, indent=2) + "\n")


def import_one(path: Path, dry_run: bool, intended: str):
    brand, kind, slug = parse_inbox_name(path.name)
    target_dir = BRANDS / brand / KIND_DIRS[kind]
    source_dir = BRANDS / brand / "source"
    target_dir.mkdir(parents=True, exist_ok=True)
    source_dir.mkdir(parents=True, exist_ok=True)

    original = unique_target(source_dir / path.name)
    derivatives: list[Path] = []

    if path.suffix.lower() in IMAGE_EXTS and kind != "video":
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im)
            has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
            if kind == "logo":
                widths = [w for w in (400, 800) if im.width >= w] or [im.width]
                for width in widths:
                    ratio = width / im.width
                    resized = im.resize((width, max(1, round(im.height * ratio))), Image.LANCZOS)
                    out_png = target_dir / f"{slug}-{width}.png"
                    out_webp = target_dir / f"{slug}-{width}.webp"
                    if not dry_run:
                        out_png = unique_target(out_png)
                        out_webp = unique_target(out_webp)
                        resized.save(out_png, optimize=True)
                        resized.save(out_webp, quality=88, method=6)
                    derivatives.extend([out_png, out_webp])
            else:
                base = im.convert("RGB")
                widths = [w for w in (700, 1400) if base.width >= w] or [base.width]
                for width in widths:
                    ratio = width / base.width
                    resized = base.resize((width, max(1, round(base.height * ratio))), Image.LANCZOS)
                    out_jpg = target_dir / f"{slug}-{width}.jpg"
                    out_webp = target_dir / f"{slug}-{width}.webp"
                    if not dry_run:
                        out_jpg = unique_target(out_jpg)
                        out_webp = unique_target(out_webp)
                        resized.save(out_jpg, quality=82, optimize=True, progressive=True)
                        resized.save(out_webp, quality=82, method=6)
                    derivatives.extend([out_jpg, out_webp])
    else:
        video_target = target_dir / path.name
        if not dry_run:
            video_target = unique_target(video_target)
            shutil.copy2(path, video_target)
        derivatives.append(video_target)

    print(f"{'[dry-run] ' if dry_run else ''}{path.name} -> {brand}/{KIND_DIRS[kind]}")
    if dry_run:
        print("  original ->", original)
        for derivative in derivatives:
            print("  derivative ->", derivative)
    else:
        shutil.copy2(path, original)
        append_manifest(brand, kind, path.name, original, derivatives, intended)
        print("  original:", original)
        for derivative in derivatives:
            print("  derivative:", derivative)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--file", help="single file to import (must follow the naming convention)")
    parser.add_argument("--brand", choices=sorted(BRAND_SLUGS))
    parser.add_argument("--kind", choices=sorted(KIND_DIRS))
    parser.add_argument("--slug", help="asset slug when using a single file")
    parser.add_argument("--intended", default="manual import / review target section", help="intended website section")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report-missing", action="store_true", help="print the missing-asset list from manifest.json")
    args = parser.parse_args()

    if args.report_missing:
        data = json.loads(MANIFEST.read_text())
        for brand, info in data.get("brands", {}).items():
            missing = info.get("missing", [])
            if missing:
                print(f"\n{info.get('officialName', brand)}")
                for item in missing:
                    print("  -", item)
        return

    if args.file:
        path = Path(args.file)
        if not path.exists():
            path = INBOX / args.file
        if not path.exists():
            raise SystemExit(f"File not found: {args.file}")
        if args.brand and args.kind and args.slug:
            # Build a conventional inbox name if the source file is not already named that way.
            staged = INBOX / f"{args.brand}__{args.kind}__{slugify(args.slug)}{path.suffix}"
            if not staged.exists():
                staged.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, staged)
            path = staged
        import_one(path, args.dry_run, args.intended)
        return

    INBOX.mkdir(parents=True, exist_ok=True)
    files = [p for p in sorted(INBOX.iterdir()) if p.is_file() and not p.name.startswith(".") and p.name != "README.md"]
    if not files:
        print(f"Inbox is empty: {INBOX}")
        print("Add files named <brand>__<kind>__<slug>.<ext>, or pass --file.")
        return
    for path in files:
        import_one(path, args.dry_run, args.intended)


if __name__ == "__main__":
    main()
