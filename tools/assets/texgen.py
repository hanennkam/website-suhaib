"""
texgen.py — procedural texture generation for the 3D artefacts (PIL + numpy).

Everything here is authored, not sampled: knit weave, printed jersey cloth,
photobooth touchscreen UI and the paper photo strip. Outputs to assets/textures.

Run: python3 tools/assets/texgen.py
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "textures")
os.makedirs(OUT, exist_ok=True)

F_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
F_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
F_MONO = "/System/Library/Fonts/Supplemental/Andale Mono.ttf"

INK = (8, 9, 11)
BONE = (233, 228, 216)
ORANGE = (255, 90, 42)
CYAN = (110, 216, 255)


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def save(img, name):
    p = os.path.join(OUT, name)
    img.save(p, optimize=True)
    print("TEX", name, img.size, "%.0f KB" % (os.path.getsize(p) / 1024))
    return p


# ---------------------------------------------------------------------------
# knit jersey fabric (seamless)
# ---------------------------------------------------------------------------
def knit(size=1024):
    rng = np.random.default_rng(7)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    u = xx / size
    v = yy / size

    # vertical rib columns + fine knit loops
    ribs = 0.5 + 0.5 * np.cos(2 * np.pi * u * 46)
    loops = 0.5 + 0.5 * np.sin(2 * np.pi * (v * 150 + np.sin(u * 2 * np.pi * 46) * 0.25))
    weave = 0.55 * ribs + 0.45 * loops

    base = np.array(BONE, dtype=np.float32) / 255.0
    shade = 0.955 + 0.075 * (weave - 0.5)
    colour = base[None, None, :] * shade[:, :, None]

    # subtle fibre noise + faint dye unevenness
    noise = rng.normal(0, 0.012, (size, size, 1))
    mottle = 0.018 * np.sin(u * 2 * np.pi * 3.1) * np.cos(v * 2 * np.pi * 2.3)
    colour = np.clip(colour + noise + mottle[..., None], 0, 1)
    img = Image.fromarray((colour * 255).astype(np.uint8), "RGB")
    save(img, "jersey_knit_base.jpg")

    # roughness: fabric is matte, slight variation
    rough = np.clip(0.80 + 0.10 * (weave - 0.5) + rng.normal(0, 0.012, (size, size)), 0.5, 1.0)
    Image.fromarray((rough * 255).astype(np.uint8), "L").save(
        os.path.join(OUT, "jersey_knit_rough.jpg"), quality=88)
    print("TEX jersey_knit_rough.jpg")

    # height -> tangent-space normal map (tileable via np.roll)
    h = weave.astype(np.float32)
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 1.6
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 1.6
    nz = np.ones_like(h)
    ln = np.sqrt(dx * dx + dy * dy + nz * nz)
    nx, ny, nz = dx / ln, dy / ln, nz / ln
    nrm = np.stack([(nx * 0.5 + 0.5), (ny * 0.5 + 0.5), (nz * 0.5 + 0.5)], axis=-1)
    Image.fromarray((np.clip(nrm, 0, 1) * 255).astype(np.uint8), "RGB").save(
        os.path.join(OUT, "jersey_knit_normal.jpg"), quality=92)
    print("TEX jersey_knit_normal.jpg")


# ---------------------------------------------------------------------------
# photobooth touchscreen UI
# ---------------------------------------------------------------------------
def booth_screen(w=1024, h=768):
    img = Image.new("RGB", (w, h), INK)
    d = ImageDraw.Draw(img)

    # ambient gradient glow
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(60):
        r = 520 - i * 8
        a = int(2 + i * 0.55)
        gd.ellipse([w * 0.52 - r, h * 0.55 - r, w * 0.52 + r, h * 0.55 + r],
                   fill=(a // 3, a, int(a * 1.25)))
    img = Image.blend(img, glow, 0.55)
    d = ImageDraw.Draw(img)

    # header
    d.text((44, 34), "SEJENAK", font=font(F_BOLD, 40), fill=BONE)
    d.text((w - 44, 44), "TERABOOTH / 03", font=font(F_MONO, 22), fill=(140, 145, 150),
           anchor="ra")
    d.line([44, 96, w - 44, 96], fill=(40, 44, 48), width=2)

    # live preview window
    px0, py0, px1, py1 = 44, 128, w - 300, h - 120
    d.rounded_rectangle([px0, py0, px1, py1], 6, outline=(110, 216, 255), width=2)
    # corner ticks
    t = 26
    for cx, cy, dx, dy in ((px0, py0, 1, 1), (px1, py0, -1, 1), (px0, py1, 1, -1), (px1, py1, -1, -1)):
        d.line([cx, cy, cx + t * dx, cy], fill=CYAN, width=3)
        d.line([cx, cy, cx, cy + t * dy], fill=CYAN, width=3)
    d.text(((px0 + px1) / 2, py0 + 26), "LIVE PREVIEW", font=font(F_MONO, 20),
           fill=(120, 130, 138), anchor="ma")

    # soft studio silhouette inside preview
    sil = Image.new("RGBA", (px1 - px0, py1 - py0), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sil)
    cw, ch = sil.size
    sd.ellipse([cw * 0.36, ch * 0.30, cw * 0.64, ch * 0.66], fill=(58, 66, 72, 190))
    sd.ellipse([cw * 0.30, ch * 0.62, cw * 0.70, ch * 1.05], fill=(50, 58, 64, 190))
    sil = sil.filter(ImageFilter.GaussianBlur(10))
    img.paste(sil, (px0, py0), sil)
    d = ImageDraw.Draw(img)

    # crosshair
    ccx, ccy = (px0 + px1) / 2, (py0 + py1) / 2
    d.line([ccx - 18, ccy, ccx + 18, ccy], fill=(150, 160, 168), width=1)
    d.line([ccx, ccy - 18, ccx, ccy + 18], fill=(150, 160, 168), width=1)

    # right control column
    rx = w - 240
    d.text((rx, 140), "FILTER", font=font(F_MONO, 18), fill=(120, 128, 136))
    for i, name in enumerate(("BONE", "MONO", "FLUX")):
        y = 172 + i * 62
        active = i == 0
        d.rounded_rectangle([rx, y, w - 44, y + 50], 4,
                            fill=(24, 26, 29) if active else (14, 15, 17),
                            outline=ORANGE if active else (34, 37, 41), width=2)
        d.text((rx + 18, y + 15), name, font=font(F_BOLD, 22),
               fill=BONE if active else (110, 116, 122))
        if active:
            d.ellipse([w - 74, y + 19, w - 62, y + 31], fill=ORANGE)

    # shutter button
    bx, by, br = w - 142, 470, 74
    d.ellipse([bx - br, by - br, bx + br, by + br], outline=ORANGE, width=6)
    d.ellipse([bx - br + 18, by - br + 18, bx + br - 18, by + br - 18], fill=(255, 90, 42))
    d.text((bx, by), "SNAP", font=font(F_BOLD, 26), fill=INK, anchor="mm")

    # strip counter
    d.text((rx, 596), "STRIP  2 / 4", font=font(F_MONO, 20), fill=(150, 158, 164))
    for i in range(4):
        x0 = rx + i * 46
        d.rounded_rectangle([x0, 630, x0 + 34, 640], 3,
                            fill=ORANGE if i < 2 else (38, 41, 45))

    # footer
    d.line([44, h - 74, w - 44, h - 74], fill=(38, 42, 46), width=2)
    d.text((44, h - 52), "TOUCH TO START  /  SELECT A FILTER",
           font=font(F_MONO, 20), fill=(132, 140, 146))
    save(img, "booth_screen.jpg")


# ---------------------------------------------------------------------------
# printed photo strip (paper texture)
# ---------------------------------------------------------------------------
def photo_strip(w=384, h=1024):
    img = Image.new("RGB", (w, h), (246, 243, 236))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(11)
    frames = 3
    top = 26
    fh = (h - top * 2 - 18 * (frames - 1)) // frames
    for i in range(frames):
        y0 = top + i * (fh + 18)
        box = [26, y0, w - 26, y0 + fh]
        d.rectangle(box, fill=(18, 20, 24))
        # abstract monochrome subject per frame
        fw, fhh = box[2] - box[0], box[3] - box[1]
        cx = box[0] + fw * (0.42 + 0.16 * rng.random())
        d.ellipse([cx - fw * 0.16, box[1] + fhh * 0.26, cx + fw * 0.16, box[1] + fhh * 0.62],
                  fill=(196, 190, 180))
        d.ellipse([cx - fw * 0.30, box[1] + fhh * 0.60, cx + fw * 0.30, box[1] + fhh * 1.02],
                  fill=(172, 166, 156))
        d.rectangle([box[0], box[3] - 26, box[2], box[3]], fill=(10, 11, 13))
        d.text((box[0] + 10, box[3] - 22), "SEJENAK  %02d" % (i + 1),
               font=font(F_MONO, 15), fill=(230, 226, 216))
    d.text((w / 2, h - 40), "SEJENAK / TERABOOTH", font=font(F_BOLD, 20),
           fill=(30, 32, 36), anchor="ma")
    d.text((w / 2, h - 18), "IPOH · 2026", font=font(F_MONO, 14),
           fill=(90, 92, 88), anchor="ma")
    save(img, "booth_strip.jpg")


# ---------------------------------------------------------------------------
# jersey print overlay (transparent decals)
# ---------------------------------------------------------------------------
def jersey_crest(w=512, h=512):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = w / 2
    d.ellipse([c - 158, c - 158, c + 158, c + 158], outline=(18, 20, 24, 255), width=18)
    d.ellipse([c - 136, c - 136, c + 136, c + 136], outline=ORANGE, width=6)
    d.ellipse([c - 118, c - 118, c + 118, c + 118], outline=(20, 22, 26, 220), width=4)
    d.text((c, c - 30), "BVR", font=font(F_BOLD, 118), fill=(18, 20, 24, 255), anchor="mm")
    d.text((c, c + 52), "CODE", font=font(F_BOLD, 52), fill=ORANGE, anchor="mm")
    d.text((c, c + 104), "APPAREL  /  EST 2024", font=font(F_MONO, 18),
           fill=(40, 42, 46, 230), anchor="mm")
    save(img, "jersey_crest.png")


def jersey_number(w=512, h=640):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((w / 2, h / 2), "09", font=font(F_BOLD, 460), fill=(255, 90, 42, 255), anchor="mm")
    save(img, "jersey_number.png")


if __name__ == "__main__":
    knit()
    booth_screen()
    photo_strip()
    jersey_crest()
    jersey_number()
