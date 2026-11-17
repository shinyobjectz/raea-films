# The hand's glb as plain arrays (positions, normals, uvs, indices) for a <BufferMesh>: a Mesh3d's material follows
# the frame (its emissive carries the film's clock to the shader), which a Model's re-covered material does not.
# Usage: python3 -I tools/handmesh.py   (reads media/hand/glb/hand.glb, writes media/hand/glb/hand.mesh.json)
import json, struct, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media", "hand", "glb")
b = open(os.path.join(root, "hand.glb"), "rb").read()
n = struct.unpack("<I", b[12:16])[0]
j = json.loads(b[20:20 + n])
bin0 = 20 + n + 8
prim = j["meshes"][0]["primitives"][0]
def read(idx):
    a = j["accessors"][idx]; bv = j["bufferViews"][a["bufferView"]]
    comps = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[a["type"]]
    fmt = {5126: "f", 5125: "I", 5123: "H"}[a["componentType"]]
    off = bin0 + bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    return list(struct.unpack_from("<%d%s" % (a["count"] * comps, fmt), b, off))
r = lambda xs, d: [round(x, d) for x in xs]
out = {"positions": r(read(prim["attributes"]["POSITION"]), 5), "normals": r(read(prim["attributes"]["NORMAL"]), 4), "uvs": r(read(prim["attributes"]["TEXCOORD_0"]), 5), "indices": read(prim["indices"])}
json.dump(out, open(os.path.join(root, "hand.mesh.json"), "w"), separators=(",", ":"))
print(len(out["positions"]) // 3, "vertices", len(out["indices"]) // 3, "triangles")
