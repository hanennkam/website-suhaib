"""
build_photobooth.py — Sejenak / Terabooth event kiosk.

Dimensionally plausible (1.72 m tall). Front faces -Y.
Real geometry: shell, recessed front panel, bezel, ring flash, printer slot with
a curled photo strip, glow strips, card reader, feet. Exports photobooth.glb.
"""

import bpy, bmesh, math, os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blib as B

PI = math.pi
X90 = (PI / 2, 0, 0)

M = {}


def mats():
    M["shell"] = B.pbr("PB_shell", (0.72, 0.70, 0.655), metallic=0.10, rough=0.52)
    M["ink"] = B.pbr("PB_ink", (0.012, 0.013, 0.016), metallic=0.45, rough=0.42)
    M["ink_matte"] = B.pbr("PB_ink_matte", (0.020, 0.021, 0.025), metallic=0.0, rough=0.78)
    M["metal"] = B.pbr("PB_metal", (0.28, 0.29, 0.31), metallic=1.0, rough=0.34)
    M["chrome"] = B.pbr("PB_chrome", (0.55, 0.56, 0.58), metallic=1.0, rough=0.24)
    M["glass"] = B.pbr("PB_glass", (0.010, 0.016, 0.024), metallic=0.30, rough=0.05,
                       coat=1.0, coat_rough=0.02)
    M["glow"] = B.pbr("PB_glow", (0.30, 0.75, 1.0), emission=(0.42, 0.85, 1.0),
                      emission_strength=3.2, rough=0.4)
    M["flash"] = B.pbr("PB_flash", (0.95, 0.95, 0.93), emission=(1.0, 0.98, 0.94),
                       emission_strength=2.2, rough=0.40)
    M["paper"] = B.tex_mat("PB_paper", os.path.join(B.TEX, "booth_strip.jpg"),
                           rough=0.72)
    M["screen"] = B.tex_mat("PB_screen", os.path.join(B.TEX, "booth_screen.jpg"),
                            rough=0.20, emission_strength=1.8)
    M["grey"] = B.pbr("PB_grey", (0.42, 0.42, 0.40), metallic=0.2, rough=0.55)
    M["accent"] = B.pbr("PB_accent", (0.95, 0.26, 0.09), metallic=0.15, rough=0.40)


def shell():
    p = []
    # plinth + shell
    p.append(B.box("plinth", (0.72, 0.56, 0.07), (0, 0, 0.035), mat=M["ink"],
                   bev=0.010, seg=3))
    p.append(B.box("cabinet", (0.70, 0.54, 1.34), (0, 0, 0.74), mat=M["shell"],
                   bev=0.030, seg=5, smooth=True))
    p.append(B.box("cap", (0.715, 0.555, 0.034), (0, 0, 1.425), mat=M["ink"],
                   bev=0.014, seg=4, smooth=True))
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.append(B.cyl("foot_%d%d" % (sx, sy), 0.021, 0.026,
                           (sx * 0.30, sy * 0.22, 0.012), verts=24, mat=M["metal"],
                           bev=0.003))

    # recessed ink front panel (front face at y = -0.279)
    p.append(B.box("front_panel", (0.655, 0.022, 1.245), (0, -0.268, 0.735),
                   mat=M["ink"], bev=0.008, seg=3))
    for sx in (-1, 1):
        p.append(B.box("seam_%d" % sx, (0.0016, 0.006, 1.24), (sx * 0.315, -0.2765, 0.735),
                       mat=M["ink_matte"], bev=0.0))

    # ---- touchscreen: bezel -> inner bezel -> proud screen glass ----
    p.append(B.box("bezel", (0.478, 0.038, 0.352), (0, -0.272, 1.100), mat=M["ink"],
                   bev=0.010, seg=3))
    p.append(B.box("bezel_in", (0.470, 0.020, 0.344), (0, -0.288, 1.100), mat=M["ink_matte"],
                   bev=0.005, seg=2))
    p.append(screen())

    # ---- ring flash + camera ----
    p.append(B.cyl("flash_back", 0.130, 0.022, (0, -0.280, 0.800), X90, verts=96,
                   mat=M["ink_matte"], bev=0.004))
    p.append(B.torus("flash_ring", 0.110, 0.0165, (0, -0.297, 0.800), X90,
                     major=96, minor=20, mat=M["flash"]))
    p.append(B.torus("flash_trim", 0.130, 0.0045, (0, -0.296, 0.800), X90,
                     major=96, minor=12, mat=M["chrome"]))
    p.append(B.cyl("cam_lens", 0.0335, 0.026, (0, -0.296, 0.800), X90, verts=64,
                   mat=M["ink"], bev=0.002))
    p.append(B.ring("cam_trim", 0.0338, 0.0292, 0.004, (0, -0.3085, 0.800), X90,
                    verts=64, mat=M["chrome"], bev=0.0004))
    p.append(B.sphere("cam_glass", 0.0255, (0, -0.3055, 0.800), mat=M["glass"],
                      segs=48, rings=24, scale=(1, 0.30, 1)))
    for i in range(6):
        a = i * math.tau / 6
        p.append(B.cyl("ir_%d" % i, 0.0022, 0.002, (0.045 * math.cos(a), -0.297,
                       0.800 + 0.045 * math.sin(a)), X90, verts=12, mat=M["flash"]))

    # ---- printer slot + emerging strip ----
    p.append(B.box("slot", (0.300, 0.032, 0.017), (0, -0.284, 0.596), mat=M["ink_matte"],
                   bev=0.002, seg=2))
    p.append(B.box("slot_lip", (0.320, 0.020, 0.006), (0, -0.292, 0.586), mat=M["metal"],
                   bev=0.002, seg=2))
    p.append(strip())

    # ---- branding (clear of bezel: bezel top = 1.272) ----
    p.append(B.text3d("wordmark", "SEJENAK", 0.034, (0, -0.2805, 1.322), X90,
                      mat=M["shell"], ext=0.0007, space=1.06))
    p.append(B.text3d("submark", "PHOTOBOOTH  /  TERABOOTH", 0.0092,
                      (0, -0.2805, 1.288), X90, mat=M["grey"], ext=0.00025, space=1.12))

    p.append(B.box("accent_line", (0.120, 0.004, 0.0025), (0, -0.2805, 1.298),
                   mat=M["accent"], bev=0.0004, seg=2))

    # ---- side glow strips (proud of the channel) ----
    for sx in (-1, 1):
        p.append(B.box("glow_ch_%d" % sx, (0.012, 0.036, 1.06), (sx * 0.3505, -0.16, 0.74),
                       mat=M["ink"], bev=0.002, seg=2))
        p.append(B.box("glow_%d" % sx, (0.004, 0.024, 1.03), (sx * 0.3555, -0.16, 0.74),
                       mat=M["glow"], bev=0.0010, seg=2))

    # ---- card reader (below bezel, right of flash) ----
    p.append(B.box("reader", (0.078, 0.026, 0.116), (0.262, -0.282, 0.700),
                   mat=M["ink_matte"], bev=0.004, seg=3))
    p.append(B.box("reader_screen", (0.058, 0.004, 0.036), (0.262, -0.2965, 0.729),
                   mat=M["glow"], bev=0.001, seg=2))
    p.append(B.box("reader_slot", (0.050, 0.010, 0.006), (0.262, -0.2965, 0.687),
                   mat=M["chrome"], bev=0.001, seg=2))
    return p


def screen():
    """Touchscreen glass as a quad with explicit 0-1 UVs (crisp UI texture)."""
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.2985, 1.100),
                                     rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object
    o.name = "screen"
    o.scale = (0.452, 0.326, 1.0)
    B.apply_transforms(o)
    me = o.data
    me.uv_layers.new(name="UVMap")
    uv = me.uv_layers["UVMap"]
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            u = (v.x / 0.452) + 0.5
            vv = (v.z - 1.100) / 0.326 + 0.5
            uv.data[li].uv = (min(max(u, 0.0), 1.0), min(max(vv, 0.0), 1.0))
    B.assign(o, M["screen"])
    B.shade(o, False)
    return o


def strip():
    """Curled photo strip emerging from the printer slot, with authored UVs."""
    bm = bmesh.new()
    W, H = 0.112, 0.255
    SLOT_Z = 0.592
    cols, rows = 4, 14
    grid, uvs = [], []
    for j in range(rows + 1):
        row = []
        t = j / rows
        for i in range(cols + 1):
            x = (i / cols - 0.5) * W
            y = 0.030 * (t ** 2.0)
            row.append(bm.verts.new((x, y, -t * H)))
        grid.append(row)
    for j in range(rows):
        for i in range(cols):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            f.smooth = True
    me = bpy.data.meshes.new("strip")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("strip", me)
    bpy.context.collection.objects.link(o)
    o.location = (0.0, -0.297, 0.592)
    B.apply_transforms(o)
    # authored UVs recorded while building (v=1 at the slot, v=0 at the tip)
    me.uv_layers.new(name="UVMap")
    uv = me.uv_layers["UVMap"]
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            co = me.vertices[vi].co
            u = (co.x / W) + 0.5
            vv = (SLOT_Z - co.z) / H
            uv.data[li].uv = (min(max(u, 0.0), 1.0), min(max(1.0 - vv, 0.0), 1.0))
    B.assign(o, M["paper"])
    B.shade(o, True, 70)
    m = o.modifiers.new("sol", "SOLIDIFY")
    m.thickness = 0.0007
    B.apply_mods(o)
    return o


def build():
    B.reset()
    mats()
    obj = B.join(shell(), "SejenakPhotobooth")
    B.activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.00008)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("STATS", B.stats(obj))
    return obj


if __name__ == "__main__":
    o = build()
    B.export_glb(os.path.join(B.MODELS, "photobooth.glb"), [o])
    B.studio_light(accent=(0.55, 0.85, 1.0))
    B.render_preview(os.path.join(B.PREVIEWS, "photobooth.png"), radius=2.55, height=1.30,
                     target=(0, 0, 0.80), lens=55, samples=80, az=26)
    B.render_preview(os.path.join(B.PREVIEWS, "photobooth_front.png"), radius=2.4,
                     height=0.95, target=(0, 0, 0.85), lens=55, samples=80, az=4)
