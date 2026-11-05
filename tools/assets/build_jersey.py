"""
build_jersey.py — premium sublimated sports jersey with real cloth geometry.

Approach
  * torso lofted from superellipse cross-sections (chest/waist/hem shaping)
  * shoulder yoke bridged to a neck opening, sleeves as lofted tubes
  * procedural knit textures (base colour / roughness / normal) + smart UVs
  * displaced wrinkle detail, subdivision, solidify for cloth thickness
  * chest crest and back number conformed to the curved surface

Exports assets/models/jersey.glb
"""

import bpy, bmesh, math, os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blib as B

PI = math.pi
EXPO = 2.7  # superellipse exponent (higher = boxier torso)

# z -> (half width, half depth)
PROFILE = [
    (0.000, 0.246, 0.118),
    (0.060, 0.243, 0.116),
    (0.140, 0.241, 0.115),
    (0.240, 0.245, 0.118),
    (0.340, 0.252, 0.124),
    (0.430, 0.258, 0.130),
    (0.500, 0.258, 0.132),
    (0.550, 0.250, 0.130),
    (0.585, 0.238, 0.124),
    (0.610, 0.224, 0.117),
    (0.622, 0.214, 0.112),
]
NECK_Z = 0.638
NECK_A, NECK_B = 0.086, 0.070

M = {}


def mats():
    M["fabric"] = B.tex_mat(
        "JS_fabric", os.path.join(B.TEX, "jersey_knit_base.jpg"), rough=0.78,
        normal_path=os.path.join(B.TEX, "jersey_knit_normal.jpg"),
        rough_path=os.path.join(B.TEX, "jersey_knit_rough.jpg"))
    M["rib"] = B.pbr("JS_rib", (0.82, 0.80, 0.745), metallic=0.0, rough=0.86)
    M["print_orange"] = B.pbr("JS_print_orange", (0.93, 0.24, 0.07), metallic=0.0,
                              rough=0.62)
    M["rib_dark"] = B.pbr("JS_rib_dark", (0.030, 0.032, 0.038), metallic=0.0, rough=0.80)
    M["crest"] = B.tex_mat("JS_crest", os.path.join(B.TEX, "jersey_crest.png"),
                           rough=0.62, alpha=True)


def profile(z):
    pts = PROFILE
    if z <= pts[0][0]:
        return pts[0][1], pts[0][2]
    if z >= pts[-1][0]:
        return pts[-1][1], pts[-1][2]
    for i in range(len(pts) - 1):
        z0, a0, b0 = pts[i]
        z1, a1, b1 = pts[i + 1]
        if z0 <= z <= z1:
            t = (z - z0) / (z1 - z0)
            t = t * t * (3 - 2 * t)  # smoothstep for a soft silhouette
            return a0 + (a1 - a0) * t, b0 + (b1 - b0) * t
    return pts[-1][1], pts[-1][2]


def se_point(t, a, b, expo=EXPO):
    c, s = math.cos(t), math.sin(t)
    x = math.copysign(abs(c) ** (2.0 / expo), c) * a
    y = math.copysign(abs(s) ** (2.0 / expo), s) * b
    return x, y


def surf_y(x, z, back=False):
    """y on the torso surface for a given x at height z (front = negative)."""
    a, b = profile(z)
    r = min(abs(x) / a, 1.0)
    y = b * (1.0 - r ** EXPO) ** (1.0 / EXPO)
    return y if back else -y


def torso(rings=13, segs=64):
    bm = bmesh.new()
    grid = []
    for j in range(rings + 1):
        z = PROFILE[0][0] + (PROFILE[-1][0] - PROFILE[0][0]) * (j / rings)
        a, b = profile(z)
        row = []
        for i in range(segs):
            t = math.tau * i / segs
            x, y = se_point(t, a, b)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(rings):
        for i in range(segs):
            k = (i + 1) % segs
            bm.faces.new((grid[j][i], grid[j][k], grid[j + 1][k], grid[j + 1][i]))

    # shoulder yoke: bridge top ring inward to the neck opening
    neck = []
    for i in range(segs):
        t = math.tau * i / segs
        x, y = se_point(t, NECK_A, NECK_B, 2.3)
        # lift the neckline at the back, dip slightly at the front
        lift = 0.010 * max(0.0, math.sin(t)) - 0.004 * max(0.0, -math.sin(t))
        neck.append(bm.verts.new((x, y, NECK_Z + lift)))
    top = grid[-1]
    for i in range(segs):
        k = (i + 1) % segs
        bm.faces.new((top[i], top[k], neck[k], neck[i]))

    me = bpy.data.meshes.new("torso")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("torso", me)
    bpy.context.collection.objects.link(o)
    return o


def sleeve(side):
    """Lofted sleeve tube, axis angled outward and down from the shoulder."""
    bm = bmesh.new()
    d = (0.80 * side, -0.04, -0.60)
    ln = math.sqrt(sum(v * v for v in d))
    d = tuple(v / ln for v in d)
    origin = (0.112 * side, -0.004, 0.524)
    # orthonormal frame
    ref = (0.0, 0.0, 1.0)
    u = (d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2],
         d[0] * ref[1] - d[1] * ref[0])
    lu = math.sqrt(sum(v * v for v in u))
    u = tuple(v / lu for v in u)
    v = (d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0])

    segs, steps = 32, 6
    grid = []
    for s in range(steps + 1):
        t = s / steps
        dist = t * 0.215
        ra = 0.101 + 0.014 * math.sin(t * PI) - 0.030 * t      # around the arm
        rb = 0.105 + 0.012 * math.sin(t * PI) - 0.032 * t      # front-back
        row = []
        for i in range(segs):
            ang = math.tau * i / segs
            ox = math.cos(ang) * ra
            oy = math.sin(ang) * rb
            px = origin[0] + d[0] * dist + u[0] * ox + v[0] * oy
            py = origin[1] + d[1] * dist + u[1] * ox + v[1] * oy
            pz = origin[2] + d[2] * dist + u[2] * ox + v[2] * oy
            row.append(bm.verts.new((px, py, pz)))
        grid.append(row)
    for s in range(steps):
        for i in range(segs):
            k = (i + 1) % segs
            bm.faces.new((grid[s][i], grid[s][k], grid[s + 1][k], grid[s + 1][i]))
    me = bpy.data.meshes.new("sleeve_%d" % side)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("sleeve_%d" % side, me)
    bpy.context.collection.objects.link(o)

    # contrast cuff binding at the sleeve opening
    bm2 = bmesh.new()
    rows = []
    for (tt, grow) in ((0.985, 0.0022), (1.012, 0.0016)):
        dist = tt * 0.215
        ra = 0.108 + 0.014 * math.sin(tt * PI) - 0.030 * tt + grow
        rb = 0.105 + 0.012 * math.sin(tt * PI) - 0.032 * tt + grow
        row = []
        for i in range(segs):
            ang = math.tau * i / segs
            ox, oy = math.cos(ang) * ra, math.sin(ang) * rb
            px = origin[0] + d[0] * dist + u[0] * ox + v[0] * oy
            py = origin[1] + d[1] * dist + u[1] * ox + v[1] * oy
            pz = origin[2] + d[2] * dist + u[2] * ox + v[2] * oy
            row.append(bm2.verts.new((px, py, pz)))
        rows.append(row)
    for i in range(segs):
        k = (i + 1) % segs
        bm2.faces.new((rows[0][i], rows[0][k], rows[1][k], rows[1][i]))
    me2 = bpy.data.meshes.new("cuff_%d" % side)
    bm2.to_mesh(me2)
    bm2.free()
    cuff = bpy.data.objects.new("cuff_%d" % side, me2)
    bpy.context.collection.objects.link(cuff)
    sol = cuff.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.0018
    B.apply_mods(cuff)
    B.assign(cuff, M["print_orange"])
    B.shade(cuff, True, 50)
    return o, cuff


def neck_lift(t):
    return 0.010 * max(0.0, math.sin(t)) - 0.004 * max(0.0, -math.sin(t))


def collar():
    """Standing ribbed collar band lofted around the neck opening."""
    bm = bmesh.new()
    segs = 56
    rows = []
    specs = [(0.004, -0.004), (0.006, 0.010), (0.004, 0.030)]
    for grow, dz in specs:
        row = []
        for i in range(segs):
            t = math.tau * i / segs
            x, y = se_point(t, NECK_A + grow, NECK_B + grow, 2.3)
            row.append(bm.verts.new((x, y, NECK_Z + dz + neck_lift(t))))
        rows.append(row)
    for r in range(len(rows) - 1):
        for i in range(segs):
            k = (i + 1) % segs
            bm.faces.new((rows[r][i], rows[r][k], rows[r + 1][k], rows[r + 1][i]))
    me = bpy.data.meshes.new("collar")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("collar", me)
    bpy.context.collection.objects.link(o)
    sol = o.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.0024
    sol.offset = 1.0
    B.apply_mods(o)
    B.assign(o, M["rib"])
    B.shade(o, True, 50)

    # orange binding at the collar edge
    bm2 = bmesh.new()
    rows = []
    for dz, grow in ((0.0295, 0.0042), (0.0365, 0.0036)):
        row = []
        for i in range(segs):
            t = math.tau * i / segs
            x, y = se_point(t, NECK_A + grow, NECK_B + grow, 2.3)
            row.append(bm2.verts.new((x, y, NECK_Z + dz + neck_lift(t))))
        rows.append(row)
    for i in range(segs):
        k = (i + 1) % segs
        bm2.faces.new((rows[0][i], rows[0][k], rows[1][k], rows[1][i]))
    me2 = bpy.data.meshes.new("collar_bind")
    bm2.to_mesh(me2)
    bm2.free()
    band = bpy.data.objects.new("collar_bind", me2)
    bpy.context.collection.objects.link(band)
    sol2 = band.modifiers.new("thick", "SOLIDIFY")
    sol2.thickness = 0.0016
    B.apply_mods(band)
    B.assign(band, M["print_orange"])
    B.shade(band, True, 50)
    return o, band


def fabric_pass(objs):
    obj = B.join(objs, "Jersey_Body")
    B.assign(obj, M["fabric"])
    # cloth: wrinkles -> smoothing -> thickness
    tex = bpy.data.textures.new("wrinkle", type="CLOUDS")
    tex.noise_scale = 0.30
    tex.noise_depth = 2
    d = obj.modifiers.new("wrinkle", "DISPLACE")
    d.texture = tex
    d.strength = 0.0075
    d.mid_level = 0.5
    d.texture_coords = "LOCAL"
    sub = obj.modifiers.new("smooth", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    sol = obj.modifiers.new("cloth", "SOLIDIFY")
    sol.thickness = 0.0016
    sol.offset = 0.0
    B.apply_mods(obj)
    B.shade(obj, True, 55)
    uv_box_planar(obj, scale=0.065)
    return obj


def uv_box_planar(obj, scale=0.065):
    """World-scale triplanar UVs so the knit weave repeats at ~2 mm, like real cloth."""
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers[0]
    for poly in me.polygons:
        n = poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            if ax == 0:
                u, v = co.y, co.z
            elif ax == 1:
                u, v = co.x, co.z
            else:
                u, v = co.x, co.y
            uv.data[li].uv = (u / scale, v / scale)


def patch(cx, cz, w, h, mat, nx=16, nz=16, back=False):
    """Curved decal patch that follows the torso surface."""
    bm = bmesh.new()
    grid = []
    for j in range(nz + 1):
        row = []
        z = cz - h / 2 + h * (j / nz)
        for i in range(nx + 1):
            x = cx - w / 2 + w * (i / nx)
            y = surf_y(x, z, back=back)
            y += 0.0018 if back else -0.0018
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(nz):
        for i in range(nx):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    me = bpy.data.meshes.new("patch")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("patch", me)
    bpy.context.collection.objects.link(o)
    me.uv_layers.new(name="UVMap")
    uv = me.uv_layers["UVMap"]
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            u = (co.x - (cx - w / 2)) / w
            v = (co.z - (cz - h / 2)) / h
            uv.data[li].uv = (u, v)
    B.assign(o, mat)
    B.shade(o, True, 60)
    return o


def back_number(text="09", size=0.190, cz=0.420):
    """3D number conformed onto the curved back panel."""
    o = B.text3d("number", text, size, (0, 0.35, cz), (-PI / 2, 0, PI),
                 mat=M["print_orange"], ext=0.0006, space=0.94, rot_mode="ZYX")
    me = o.data
    for v in me.vertices:
        x = v.co.x
        z = v.co.z
        base = surf_y(x, z, back=True) + 0.0020
        v.co.y = base + (v.co.y - 0.35)  # keep extrusion depth around the surface
    me.update()
    return o


def build():
    B.reset()
    mats()
    sl_l, cuff_l = sleeve(-1)
    sl_r, cuff_r = sleeve(1)
    body = fabric_pass([torso(), sl_l, sl_r])
    col, col_bind = collar()
    parts = [body, col, col_bind, cuff_l, cuff_r]
    parts.append(patch(-0.088, 0.462, 0.140, 0.140, M["crest"], nx=20, nz=20))
    parts.append(back_number())
    obj = B.join(parts, "SportsJersey")
    print("STATS", B.stats(obj))
    return obj


if __name__ == "__main__":
    o = build()
    B.export_glb(os.path.join(B.MODELS, "jersey.glb"), [o])
    B.studio_light(accent=(0.85, 0.90, 1.0))
    B.render_preview(os.path.join(B.PREVIEWS, "jersey_front.png"), radius=1.75,
                     height=0.55, target=(0, 0, 0.33), lens=62, samples=96, az=18)
    B.render_preview(os.path.join(B.PREVIEWS, "jersey_back.png"), radius=1.75,
                     height=0.55, target=(0, 0, 0.33), lens=62, samples=96, az=166)
