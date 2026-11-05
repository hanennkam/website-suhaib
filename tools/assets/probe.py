import bpy, sys, inspect
print("VERSION", bpy.app.version_string)
m = bpy.data.materials.new("probe")
m.use_nodes = True
bsdf = m.node_tree.nodes.get("Principled BSDF")
print("INPUTS", [i.name for i in bsdf.inputs])
print("HAS shade_auto_smooth", hasattr(bpy.ops.object, "shade_auto_smooth"))
op = bpy.ops.export_scene.gltf
props = op.get_rna_type().properties
keys = sorted([p.identifier for p in props])
want = [k for k in keys if any(s in k for s in ("draco", "selection", "apply", "yup", "image", "format", "animat", "normals", "texcoord", "extras", "cameras", "lights"))]
print("GLTF_PARAMS", want)
import bmesh
print("OK")
