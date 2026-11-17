#!/usr/bin/env python3
"""Derive the files the set uses from each fetched Poly Haven glTF (same .bin and textures, new .gltf beside it):
  ID.cut.gltf      blended cut-outs made alpha masks (ray tracing follows masks, not blends)
  ID.wood.gltf / ID.leaves.gltf   a tree split by material, so its leaves can come in on their own
  ID.N.gltf        one variant of a model that lays several out side by side, standing on its own origin
Writes assets/models/index.json: each file's size, lowest point and triangles."""
import copy, glob, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "models")
index = {}
def bounds(g, meshes):
    mn, mx, tris = [1e9] * 3, [-1e9] * 3, 0
    for mi in meshes:
        for pr in g["meshes"][mi]["primitives"]:
            pa = g["accessors"][pr["attributes"]["POSITION"]]
            tris += (g["accessors"][pr["indices"]]["count"] if "indices" in pr else pa["count"]) // 3
            for i in range(3):
                mn[i] = min(mn[i], pa["min"][i]); mx[i] = max(mx[i], pa["max"][i])
    return {"min": [round(v, 3) for v in mn], "max": [round(v, 3) for v in mx], "tris": tris}
def write(d, name, g, meshes):
    json.dump(g, open(os.path.join(d, name), "w"))
    index[name] = bounds(g, meshes)
for path in sorted(glob.glob(os.path.join(ROOT, "*", "*.gltf"))):
    d, base = os.path.dirname(path), os.path.basename(path)[:-5]
    if "." in base: continue  # a derived file
    g = json.load(open(path))
    for m in g.get("materials", []):
        if m.get("alphaMode") == "BLEND":
            m["alphaMode"] = "MASK"; m["alphaCutoff"] = 0.35
    all_meshes = list(range(len(g["meshes"])))
    write(d, base + ".cut.gltf", g, all_meshes)
    names = [m["name"] for m in g.get("materials", [])]
    if any("leaves" in n for n in names):
        for part, keep in (("wood", lambda n: "leaves" not in n), ("leaves", lambda n: "leaves" in n)):
            h = copy.deepcopy(g)
            for m in h["meshes"]:
                m["primitives"] = [p for p in m["primitives"] if keep(names[p["material"]])]
            write(d, f"{base}.{part}.gltf", h, all_meshes)
    roots = g["scenes"][g.get("scene", 0)]["nodes"]
    if len(roots) > 1:
        for k, n in enumerate(roots):
            h = copy.deepcopy(g)
            h["scenes"] = [{"nodes": [n]}]; h["scene"] = 0
            node = h["nodes"][n]
            t = node.get("translation", [0, 0, 0]); node["translation"] = [0, t[1], 0]
            write(d, f"{base}.{k}.gltf", h, [node["mesh"]] if "mesh" in node else all_meshes)
json.dump(index, open(os.path.join(ROOT, "index.json"), "w"), indent=1)
print(len(index), "files")
