"""
build_camera.py — photorealistic mirrorless camera with prime lens.

Proportions in metres (body ~132 mm wide). Front faces -Y.
Run: blender -b --factory-startup -P tools/assets/build_camera.py
"""

import bpy, math, os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blib as B

PI = math.pi
X90 = (PI / 2, 0, 0)
Y90 = (0, PI / 2, 0)

M = {}


def mats():
    M["anod"] = B.pbr("CAM_anodised", (0.014, 0.015, 0.018), metallic=0.62, rough=0.46)
    M["top"] = B.pbr("CAM_topplate", (0.019, 0.020, 0.023), metallic=0.76, rough=0.40)
    M["rubber"] = B.pbr("CAM_rubber", (0.007, 0.007, 0.008), metallic=0.0, rough=0.90)
    M["rubber2"] = B.pbr("CAM_rubber_ring", (0.016, 0.016, 0.018), metallic=0.0, rough=0.72)
    M["chrome"] = B.pbr("CAM_chrome", (0.52, 0.53, 0.55), metallic=1.0, rough=0.30)
    M["chrome_d"] = B.pbr("CAM_chrome_dark", (0.20, 0.21, 0.23), metallic=1.0, rough=0.40)
    M["glass"] = B.pbr("CAM_glass", (0.007, 0.016, 0.028), metallic=0.20, rough=0.028,
                       coat=1.0, coat_rough=0.02, ior=1.52)
    M["screen"] = B.pbr("CAM_screen", (0.004, 0.005, 0.007), metallic=0.15, rough=0.07)
    M["accent"] = B.pbr("CAM_accent", (0.95, 0.26, 0.09), metallic=0.20, rough=0.34)
    M["engrave"] = B.pbr("CAM_engrave", (0.78, 0.78, 0.76), metallic=0.0, rough=0.45)
    M["glass2"] = B.pbr("CAM_glass_coated", (0.010, 0.045, 0.040), metallic=0.55,
                        rough=0.05, coat=1.0, coat_rough=0.02, ior=1.6)
    M["inner"] = B.pbr("CAM_inner", (0.002, 0.002, 0.002), metallic=0.0, rough=0.95)


def body():
    p = []
    # ---- shell ----
    p.append(B.box("body", (0.132, 0.072, 0.082), (0, 0, 0), mat=M["anod"], bev=0.005, seg=4))
    p.append(B.box("topplate", (0.124, 0.065, 0.0085), (0, 0, 0.0430), mat=M["top"],
                   bev=0.0024, seg=3))
    p.append(B.box("evf", (0.044, 0.038, 0.019), (0, 0.009, 0.0555), mat=M["top"],
                   bev=0.004, seg=4))
    # rubber eyecup hood with a real cut aperture
    hood = B.box("eyecup", (0.036, 0.014, 0.021), (0, 0.0355, 0.054), mat=M["rubber"],
                 bev=0.0045, seg=4, smooth=True)
    cutter = B.cyl("eyecut", 0.0105, 0.03, (0, 0.0355, 0.054), X90, verts=40, mat=None)
    B.boolean_cut(hood, cutter)
    p.append(hood)
    p.append(B.cyl("eyepiece", 0.0098, 0.004, (0, 0.0392, 0.054), X90, verts=40,
                   mat=M["glass"]))
    # dioptre wheel
    p.append(B.cyl("dioptre", 0.0052, 0.004, (-0.0235, 0.0325, 0.0468), X90, verts=24,
                   mat=M["chrome_d"], bev=0.0005))
    # hotshoe + rails + contacts
    p.append(B.box("shoe", (0.020, 0.028, 0.003), (0, 0.005, 0.0665), mat=M["chrome_d"],
                   bev=0.0008, seg=2))
    for sx in (-1, 1):
        p.append(B.box("shoe_rail_%d" % sx, (0.0022, 0.028, 0.0044),
                       (sx * 0.0106, 0.005, 0.0676), mat=M["chrome_d"], bev=0.0006, seg=2))
    for i in range(3):
        p.append(B.cyl("contact_%d" % i, 0.0014, 0.0012, (-0.004 + i * 0.004, 0.005, 0.0682),
                       mat=M["chrome"], verts=16))

    # ---- grip: merges into the shell, sloped shoulder, milled grooves ----
    grip = B.box("grip", (0.030, 0.056, 0.070), (0.050, -0.036, -0.004),
                 mat=M["rubber"], bev=0.010, seg=5, smooth=True)
    cuts = []
    cuts.append(B.box("gslope", (0.05, 0.062, 0.030), (0.050, -0.070, 0.042),
                      rot=(-0.55, 0, 0), mat=None, bev=0.0))
    for i in range(6):
        cuts.append(B.box("gcut_%d" % i, (0.040, 0.012, 0.0016),
                          (0.050, -0.0625, -0.034 + i * 0.0085), mat=None, bev=0.0))
    B.boolean_cut(grip, B.join(cuts, "gcut"))
    p.append(grip)

    # ---- top controls ----
    dial = B.cyl("mode_dial", 0.0125, 0.0085, (0.048, 0.014, 0.0465), mat=M["chrome_d"],
                 verts=72, bev=0.001)
    B.flute(dial, 36, 0.0013)
    p.append(dial)
    p.append(B.cyl("mode_dial_top", 0.0118, 0.0012, (0.048, 0.014, 0.0512), mat=M["anod"],
                   verts=72, bev=0.0004))
    p.append(B.box("dial_mark", (0.0012, 0.007, 0.0006), (0.048, 0.0255, 0.0516),
                   mat=M["engrave"], bev=0.0))

    exp = B.cyl("exp_dial", 0.0110, 0.0080, (-0.040, 0.012, 0.0465), mat=M["chrome_d"],
                verts=72, bev=0.001)
    B.flute(exp, 30, 0.0010)
    p.append(exp)
    p.append(B.cyl("exp_dial_top", 0.0103, 0.0012, (-0.040, 0.012, 0.0507), mat=M["anod"],
                   verts=72, bev=0.0004))

    # shutter release
    p.append(B.cyl("shutter_collar", 0.0112, 0.004, (0.048, -0.014, 0.0445),
                   mat=M["chrome_d"], verts=48, bev=0.0008))
    p.append(B.ring("power_ring", 0.0108, 0.0088, 0.0032, (0.048, -0.014, 0.0452),
                    verts=48, mat=M["accent"], bev=0.0004))
    p.append(B.cyl("shutter_btn", 0.0070, 0.0040, (0.048, -0.014, 0.0472),
                   mat=M["chrome"], verts=48, bev=0.0012))
    p.append(B.sphere("shutter_dome", 0.0068, (0.048, -0.014, 0.0491),
                      mat=M["chrome"], segs=32, rings=16, scale=(1, 1, 0.32)))

    # ---- lens mount ----
    p.append(B.cyl("mount_plate", 0.0330, 0.005, (0, -0.0385, 0.0), X90, verts=80,
                   mat=M["chrome"], bev=0.0006))
    p.append(B.ring("mount_ring", 0.0326, 0.0290, 0.0030, (0, -0.0415, 0.0), X90,
                    verts=80, mat=M["chrome"], bev=0.0004))
    p.append(B.cyl("mount_throat", 0.0288, 0.004, (0, -0.0400, 0.0), X90, verts=64,
                   mat=M["inner"]))
    p.append(B.cyl("mount_dot", 0.0018, 0.0012, (0, -0.0412, 0.0345), X90, verts=16,
                   mat=M["accent"]))
    # lens release button
    p.append(B.cyl("lens_release", 0.0036, 0.0040, (0.0385, -0.0405, -0.014), X90,
                   verts=24, mat=M["chrome_d"], bev=0.0005))

    # ---- front face ----
    p.append(B.text3d("badge", "SIGNAL", 0.0068, (-0.042, -0.0363, 0.0165), X90,
                      mat=M["engrave"], ext=0.00022))
    p.append(B.text3d("badge_model", "M 1", 0.0040, (-0.042, -0.0363, 0.0090), X90,
                      mat=M["engrave"], ext=0.0002))
    p.append(B.sphere("af_lamp", 0.0032, (0.038, -0.0364, 0.0230), mat=M["accent"],
                      segs=24, rings=12, scale=(1, 0.40, 1)))
    for sx in (-1, 1):
        p.append(B.cyl("lug_%d" % sx, 0.0040, 0.0032, (sx * 0.0662, 0.004, 0.030),
                       Y90, verts=24, mat=M["chrome_d"], bev=0.0006))

    # ---- rear ----
    p.append(B.box("screen_frame", (0.075, 0.0035, 0.054), (0.002, 0.0348, 0.001),
                   mat=M["anod"], bev=0.0012, seg=3))
    p.append(B.box("screen", (0.0705, 0.0040, 0.0495), (0.002, 0.0362, 0.001),
                   mat=M["screen"], bev=0.0010, seg=3))
    for i, (bx, bz) in enumerate(((0.056, 0.022), (0.056, 0.006), (0.056, -0.010),
                                  (0.042, -0.028))):
        p.append(B.cyl("btn_%d" % i, 0.0050, 0.0026, (bx, 0.0366, bz), X90,
                       verts=32, mat=M["chrome_d"], bev=0.0005))
    p.append(B.cyl("joystick", 0.0042, 0.0032, (0.022, 0.0372, -0.029), X90,
                   verts=24, mat=M["rubber2"], bev=0.0005))
    p.append(B.box("thumb_rest", (0.016, 0.012, 0.015), (0.053, 0.040, -0.032),
                   mat=M["rubber"], bev=0.005, seg=4, smooth=True))
    p.append(B.ring("tripod", 0.0072, 0.0056, 0.0016, (0, 0.002, -0.0415),
                    (PI, 0, 0), verts=32, mat=M["chrome_d"], bev=0.0003))
    return p


def lens():
    p = []

    def seg(name, r, d, y, mat, verts=80, bev=0.0006, r2=None):
        return B.cyl(name, r, d, (0, y, 0.0), X90, verts=verts, mat=mat, bev=bev, r2=r2)

    p.append(seg("lens_base", 0.0312, 0.009, -0.0470, M["anod"]))
    p.append(B.ring("lens_accent", 0.0320, 0.0306, 0.0020, (0, -0.0516, 0), X90,
                    verts=80, mat=M["accent"], bev=0.0003))
    focus = seg("focus_ring", 0.0342, 0.024, -0.0645, M["rubber2"], verts=200, bev=0.0012)
    B.flute(focus, 54, 0.0022)
    p.append(focus)
    p.append(seg("lens_mid", 0.0308, 0.016, -0.0845, M["anod"]))
    p.append(B.ring("mid_trim", 0.0312, 0.0300, 0.0018, (0, -0.0920, 0), X90,
                    verts=80, mat=M["chrome"], bev=0.0002))
    ap = seg("aperture_ring", 0.0320, 0.009, -0.0970, M["chrome_d"], verts=200, bev=0.0006)
    B.flute(ap, 62, 0.0012)
    p.append(ap)
    p.append(seg("front_barrel", 0.0328, 0.014, -0.1085, M["anod"], r2=0.0334))
    p.append(B.ring("filter_thread", 0.0332, 0.0286, 0.0034, (0, -0.1152, 0), X90,
                    verts=80, mat=M["chrome"], bev=0.0004))
    # recessed front element + retaining ring
    p.append(B.cyl("inner_barrel", 0.0282, 0.018, (0, -0.1060, 0), X90, verts=64,
                   mat=M["inner"]))
    p.append(B.ring("retainer", 0.0272, 0.0248, 0.0018, (0, -0.1130, 0), X90,
                    verts=64, mat=M["chrome_d"], bev=0.0002))
    p.append(B.ring("blade_ring", 0.0240, 0.0165, 0.0016, (0, -0.1068, 0), X90,
                    verts=64, mat=M["inner"], bev=0.0002))
    p.append(B.sphere("inner_element", 0.0168, (0, -0.1052, 0), mat=M["glass2"],
                      segs=48, rings=24, scale=(1, 0.22, 1)))
    p.append(B.sphere("front_element", 0.0243, (0, -0.1132, 0), mat=M["glass"],
                      segs=64, rings=32, scale=(1, 0.26, 1)))
    # bayonet tabs inside the filter ring
    for i in range(3):
        a = i * math.tau / 3 + 0.4
        p.append(B.box("bayonet_%d" % i, (0.005, 0.0022, 0.0016),
                       (0.0302 * math.cos(a), -0.1138, 0.0302 * math.sin(a)),
                       (0, -a, 0), mat=M["chrome_d"], bev=0.0003, seg=2))
    return p


def build():
    B.reset()
    mats()
    obj = B.join(body() + lens(), "MirrorlessCamera")
    B.activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.00008)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("STATS", B.stats(obj))
    return obj


if __name__ == "__main__":
    o = build()
    B.export_glb(os.path.join(B.MODELS, "camera.glb"), [o])
    B.studio_light(accent=(0.70, 0.82, 1.0))
    B.render_preview(os.path.join(B.PREVIEWS, "camera.png"), radius=0.46, height=0.13,
                     target=(0, -0.03, 0.0), lens=85, samples=96, az=36)
    B.render_preview(os.path.join(B.PREVIEWS, "camera_rear.png"), radius=0.46,
                     height=0.12, target=(0, 0.0, 0.0), lens=85, samples=96, az=145)
