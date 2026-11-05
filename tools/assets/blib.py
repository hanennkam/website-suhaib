"""
blib.py — shared procedural modelling helpers for The Signal Archive assets.

Target: Blender 5.2 LTS (headless: blender -b --factory-startup -P script.py).
Everything is built from real geometry (mesh primitives, lofted surfaces,
bevels, booleans), with PBR materials, then exported to GLB.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = os.path.join(ROOT, "assets", "models")
TEX = os.path.join(ROOT, "assets", "textures")
PREVIEWS = os.path.join(ROOT, "tools", "assets", "previews")

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

TAU = math.pi * 2.0


# ---------------------------------------------------------------------------
# scene / utilities
# ---------------------------------------------------------------------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for d in (MODELS, TEX, PREVIEWS):
        os.makedirs(d, exist_ok=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    return sc


def obj_mode():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def deselect():
    for o in bpy.context.selected_objects:
        o.select_set(False)


def activate(obj):
    deselect()
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_transforms(obj):
    activate(obj)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def apply_mods(obj):
    activate(obj)
    for m in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except Exception as exc:  # pragma: no cover
            print("  ! modifier %s on %s failed: %s" % (m.name, obj.name, exc))


# ---------------------------------------------------------------------------
# materials
# ---------------------------------------------------------------------------
def _alpha_mode(mat):
    for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
        try:
            setattr(mat, attr, val)
        except Exception:
            pass


def pbr(name, base=(0.5, 0.5, 0.5), metallic=0.0, rough=0.5, alpha=1.0,
        emission=None, emission_strength=0.0, ior=1.45, coat=0.0,
        coat_rough=0.1, transmission=0.0, spec=0.5):
    """Principled BSDF material. Colours are linear-ish sRGB tuples 0..1."""
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    b.inputs["IOR"].default_value = ior
    b.inputs["Alpha"].default_value = alpha
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = spec
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = coat_rough
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if emission is not None:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        _alpha_mode(mat)
    return mat


def tex_mat(name, image_path, metallic=0.0, rough=0.55, emission_strength=0.0,
            normal_path=None, rough_path=None, alpha=False):
    """Image-textured PBR material (base colour + optional normal/roughness)."""
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough

    img = bpy.data.images.load(image_path, check_existing=True)
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    t.interpolation = "Linear"
    t.location = (-620, 260)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if alpha:
        nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        _alpha_mode(mat)
    if emission_strength:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emission_strength
    if rough_path and os.path.exists(rough_path):
        ri = bpy.data.images.load(rough_path, check_existing=True)
        ri.colorspace_settings.name = "Non-Color"
        rt = nt.nodes.new("ShaderNodeTexImage")
        rt.image = ri
        rt.location = (-620, -20)
        nt.links.new(rt.outputs["Color"], b.inputs["Roughness"])
    if normal_path and os.path.exists(normal_path):
        ni = bpy.data.images.load(normal_path, check_existing=True)
        ni.colorspace_settings.name = "Non-Color"
        nt_node = nt.nodes.new("ShaderNodeTexImage")
        nt_node.image = ni
        nt_node.location = (-620, -300)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.location = (-330, -300)
        nt.links.new(nt_node.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return mat


def assign(obj, mat):
    if mat is None:
        return obj
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------------------
# shading
# ---------------------------------------------------------------------------
def shade(obj, smooth=True, angle_deg=38.0):
    obj_mode()
    activate(obj)
    if not smooth:
        bpy.ops.object.shade_flat()
        return obj
    bpy.ops.object.shade_smooth()
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angle_deg))
    except Exception:
        pass
    return obj


def bevel(obj, width=0.004, segments=3, angle_deg=30.0):
    m = obj.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle_deg)
    try:
        m.miter_outer = "MITER_ARC"
    except Exception:
        pass
    apply_mods(obj)
    return obj


# ---------------------------------------------------------------------------
# primitives
# ---------------------------------------------------------------------------
def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None,
        bev=0.004, seg=3, smooth=False):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0], size[1], size[2])
    apply_transforms(o)
    if bev:
        bevel(o, bev, seg)
    assign(o, mat)
    shade(o, smooth)
    return o


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=64, mat=None,
        bev=0.0, smooth=True, r2=None):
    if r2 is None or abs(r2 - r) < 1e-9:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth,
                                            end_fill_type="NGON",
                                            location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2,
                                        depth=depth, end_fill_type="NGON",
                                        location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    apply_transforms(o)
    if bev:
        bevel(o, bev, 2)
    assign(o, mat)
    shade(o, smooth)
    return o


def sphere(name, r, loc=(0, 0, 0), mat=None, segs=32, rings=16, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings,
                                         radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    apply_transforms(o)
    assign(o, mat)
    shade(o, True)
    return o


def torus(name, R, r, loc=(0, 0, 0), rot=(0, 0, 0), major=64, minor=16, mat=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                     major_segments=major, minor_segments=minor,
                                     location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    apply_transforms(o)
    assign(o, mat)
    shade(o, True, 60)
    return o


def ring(name, r_out, r_in, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=64, mat=None,
         bev=0.0006):
    """Annulus prism — cheaper and cleaner than a boolean.""" 
    bm = bmesh.new()
    top_o, top_i, bot_o, bot_i = [], [], [], []
    h = depth / 2.0
    for i in range(verts):
        a = TAU * i / verts
        c, s = math.cos(a), math.sin(a)
        top_o.append(bm.verts.new((r_out * c, r_out * s, h)))
        top_i.append(bm.verts.new((r_in * c, r_in * s, h)))
        bot_o.append(bm.verts.new((r_out * c, r_out * s, -h)))
        bot_i.append(bm.verts.new((r_in * c, r_in * s, -h)))
    bm.verts.ensure_lookup_table()
    for i in range(verts):
        j = (i + 1) % verts
        bm.faces.new((top_o[i], top_o[j], top_i[j], top_i[i]))
        bm.faces.new((bot_o[j], bot_o[i], bot_i[i], bot_i[j]))
        bm.faces.new((top_o[j], top_o[i], bot_o[i], bot_o[j]))
        bm.faces.new((top_i[i], top_i[j], bot_i[j], bot_i[i]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    apply_transforms(o)
    if bev:
        bevel(o, bev, 2)
    assign(o, mat)
    shade(o, True, 40)
    return o


def flute(obj, ridges=48, depth=0.0009, axis_len=None):
    """Radially displace a cylinder's side verts to fake knurling / grip flutes."""
    me = obj.data
    for v in me.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if r < 1e-6:
            continue
        a = math.atan2(v.co.y, v.co.x)
        k = 1.0 + (depth / r) * (0.5 + 0.5 * math.cos(ridges * a))
        v.co.x *= k
        v.co.y *= k
    me.update()
    return obj


def text3d(name, body, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None,
           ext=0.0004, bold=True, align_x="CENTER", align_y="CENTER", space=1.0,
           rot_mode="XYZ"):
    cu = bpy.data.curves.new(name, type="FONT")
    cu.body = body
    cu.size = size
    cu.extrude = ext
    cu.align_x = align_x
    cu.align_y = align_y
    cu.space_character = space
    for path in ((FONT_BOLD if bold else FONT_REG), FONT_REG):
        if os.path.exists(path):
            try:
                cu.font = bpy.data.fonts.load(path, check_existing=True)
                break
            except Exception:
                continue
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_mode = rot_mode
    o.rotation_euler = rot
    activate(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    apply_transforms(o)
    assign(o, mat)
    return o


def boolean_cut(target, cutter):
    m = target.modifiers.new("cut", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.object = cutter
    try:
        m.solver = "EXACT"
    except Exception:
        pass
    apply_mods(target)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return target


def join(objs, name):
    objs = [o for o in objs if o and o.name in bpy.data.objects]
    obj_mode()
    deselect()
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    apply_transforms(o)
    return o


def uv_smart(obj, angle=66.0, margin=0.02):
    activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle),
                             island_margin=margin, correct_aspect=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


def stats(obj):
    me = obj.data
    tris = sum(max(0, len(p.vertices) - 2) for p in me.polygons)
    return {"verts": len(me.vertices), "polys": len(me.polygons), "tris": tris}


def decimate_to(obj, target_tris):
    s = stats(obj)
    if s["tris"] <= target_tris:
        return obj
    ratio = max(0.05, target_tris / float(s["tris"]))
    m = obj.modifiers.new("dec", "DECIMATE")
    m.ratio = ratio
    apply_mods(obj)
    return obj


# ---------------------------------------------------------------------------
# export + preview render
# ---------------------------------------------------------------------------
def export_glb(path, objs, draco=False):
    obj_mode()
    deselect()
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=False,
    )
    if draco:
        kwargs.update(export_draco_mesh_compression_enable=True,
                      export_draco_mesh_compression_level=6)
    bpy.ops.export_scene.gltf(**kwargs)
    size = os.path.getsize(path)
    print("EXPORTED %s  %.2f MB" % (path, size / 1048576.0))
    return size


def _engine():
    sc = bpy.context.scene
    for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
        try:
            sc.render.engine = e
            return e
        except Exception:
            continue
    return sc.render.engine


def studio_light(accent=(1.0, 0.36, 0.16)):
    """Neutral studio: cool key, warm rim, soft fill, dark backdrop."""
    sc = bpy.context.scene
    world = bpy.data.worlds.new("preview_world")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.02, 0.022, 0.026, 1)
    bg.inputs[1].default_value = 1.0

    def lamp(name, loc, energy, color, size=1.0):
        d = bpy.data.lights.new(name, type="AREA")
        d.energy = energy
        d.color = color
        d.size = size
        o = bpy.data.objects.new(name, d)
        bpy.context.collection.objects.link(o)
        o.location = loc
        dirv = Vector((0, 0, 0)) - Vector(loc)
        o.rotation_euler = dirv.to_track_quat("-Z", "Y").to_euler()
        return o

    lamp("key", (-1.4, -1.9, 1.9), 320, (1.0, 0.97, 0.92), 1.6)
    lamp("fill", (2.1, -1.2, 0.7), 90, (0.78, 0.88, 1.0), 2.0)
    lamp("rim", (1.4, 2.0, 1.5), 260, accent, 1.2)
    lamp("top", (0.0, 0.4, 2.4), 120, (1.0, 1.0, 1.0), 1.4)


def render_preview(path, radius=0.9, height=0.45, res=(900, 900), samples=64,
                   target=(0, 0, 0), lens=85, az=38.0):
    sc = bpy.context.scene
    cam = bpy.data.objects.get("preview_cam")
    if cam is None:
        cam_data = bpy.data.cameras.new("preview_cam")
        cam = bpy.data.objects.new("preview_cam", cam_data)
        bpy.context.collection.objects.link(cam)
    cam.data.lens = lens
    ang = math.radians(az)
    cam.location = (radius * math.sin(ang), -radius * math.cos(ang), height)
    look = Vector(target) - cam.location
    cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    eng = _engine()
    if eng == "CYCLES":
        sc.cycles.samples = samples
        sc.cycles.use_denoising = True
        try:
            sc.cycles.device = "CPU"
        except Exception:
            pass
    else:
        try:
            sc.eevee.taa_render_samples = samples
        except Exception:
            pass
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDER", path)
