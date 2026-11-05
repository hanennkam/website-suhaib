"""
validate_glb.py — structural validation of exported GLB files (stdlib only).

Checks the container header, parses the JSON chunk and reports geometry,
materials, textures and triangle counts so the viewer contract is verified
before anything is wired into the site.

Run: python3 tools/assets/validate_glb.py
"""

import json
import os
import struct
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = os.path.join(ROOT, "assets", "models")

TRI_MODES = {4: "TRIANGLES", 5: "TRIANGLE_STRIP", 6: "TRIANGLE_FAN"}


def parse(path):
    with open(path, "rb") as fh:
        data = fh.read()
    magic, version, length = struct.unpack("<4sII", data[:12])
    if magic != b"glTF":
        raise ValueError("not a GLB (bad magic)")
    if version != 2:
        raise ValueError("unexpected glTF version %d" % version)
    if length != len(data):
        raise ValueError("declared length %d != file size %d" % (length, len(data)))

    offset = 12
    gltf = None
    bin_len = 0
    while offset < len(data):
        chunk_len, chunk_type = struct.unpack("<II", data[offset:offset + 8])
        payload = data[offset + 8: offset + 8 + chunk_len]
        if chunk_type == 0x4E4F534A:      # JSON
            gltf = json.loads(payload.decode("utf-8"))
        elif chunk_type == 0x004E4942:    # BIN
            bin_len = chunk_len
        offset += 8 + chunk_len + ((4 - chunk_len % 4) % 4 if chunk_len % 4 else 0)
    if gltf is None:
        raise ValueError("no JSON chunk")
    return gltf, len(data), bin_len


def summarise(path):
    gltf, size, bin_len = parse(path)
    accessors = gltf.get("accessors", [])
    tris = 0
    prims = 0
    modes = set()
    for mesh in gltf.get("meshes", []):
        for prim in mesh.get("primitives", []):
            prims += 1
            mode = prim.get("mode", 4)
            modes.add(TRI_MODES.get(mode, str(mode)))
            if "indices" in prim:
                count = accessors[prim["indices"]]["count"]
            else:
                count = accessors[prim["attributes"]["POSITION"]]["count"]
            if mode == 4:
                tris += count // 3
            elif mode in (5, 6):
                tris += max(0, count - 2)
    images = gltf.get("images", [])
    materials = gltf.get("materials", [])
    meshes = gltf.get("meshes", [])
    return {
        "file": os.path.basename(path),
        "size_mb": round(size / 1048576.0, 2),
        "bin_mb": round(bin_len / 1048576.0, 2),
        "meshes": len(meshes),
        "primitives": prims,
        "triangles": tris,
        "modes": sorted(modes),
        "materials": len(materials),
        "images": len(images),
        "nodes": len(gltf.get("nodes", [])),
        "extensions": gltf.get("extensionsUsed", []),
        "material_names": [m.get("name", "?") for m in materials],
        "image_names": [i.get("name") or i.get("mimeType", "?") for i in images],
    }


def main():
    files = sorted(f for f in os.listdir(MODELS) if f.endswith(".glb"))
    if not files:
        print("no GLB files found in", MODELS)
        return 1
    ok = True
    for f in files:
        path = os.path.join(MODELS, f)
        try:
            s = summarise(path)
        except Exception as exc:
            print("FAIL %s: %s" % (f, exc))
            ok = False
            continue
        problems = []
        if not s["triangles"]:
            problems.append("no triangles")
        if s["size_mb"] > 4.0:
            problems.append("oversize (%.2f MB)" % s["size_mb"])
        if not s["materials"]:
            problems.append("no materials")
        print("%-16s %5.2f MB  %6d tris  %2d mats  %2d imgs  %d nodes  %s"
              % (s["file"], s["size_mb"], s["triangles"], s["materials"],
                 s["images"], s["nodes"], ",".join(s["modes"])))
        if s["extensions"]:
            print("                 extensions: %s" % ", ".join(s["extensions"]))
        if problems:
            print("                 PROBLEMS: %s" % "; ".join(problems))
            ok = False
    print("\n%s" % ("ALL MODELS VALID" if ok else "VALIDATION ISSUES FOUND"))
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
