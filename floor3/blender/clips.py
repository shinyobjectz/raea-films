# The level's clip check, run by tools/clips.ts: each placed model's triangles (its .glb as Blender imports it, turned
# back into raea's frame: y up) and each built box go into a BVH; every pair whose boxes meet is tested for triangle
# intersections, and how far each passes into the other is measured (a vertex inside the other, by the nearest
# surface's facing). Things on a desk are also tested for a gap under them.
#   raea blender run blender/clips.py PLACED.json OUT.json
import bpy, json, sys, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

src, out = sys.argv[sys.argv.index("--") + 1:][:2]
data = json.load(open(src))
STRUCT = {"structure", "column"}


def model_tris(path, cache={}):
    """The glb's triangles in raea's frame (x, y up, z toward the viewer), as it stands at its origin."""
    if path in cache:
        return cache[path]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    verts, tris, parts = [], [], []
    for o in new:
        if o.type != "MESH":
            continue
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        me.calc_loop_triangles()
        base = len(verts)
        for v in me.vertices:
            w = o.matrix_world @ v.co
            verts.append((w.x, w.z, -w.y))
        tris += [tuple(base + i for i in t.vertices) for t in me.loop_triangles]
        parts.append((o.name, base, len(verts), [tuple(i for i in t.vertices) for t in me.loop_triangles]))
        ev.to_mesh_clear()
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    cache[path] = (verts, tris)
    PARTS[path] = [(n, [Vector(v) for v in verts[b:e]], t) for n, b, e, t in parts]
    return cache[path]


PARTS = {}


def placed_tree(p):
    verts, tris = model_tris(p["glb"])
    c, s, k = math.cos(p["yaw"]), math.sin(p["yaw"]), p["scale"]
    ax, ay, az = p["at"]
    vs = [Vector((ax + (x * c + z * s) * k, ay + y * k, az + (-x * s + z * c) * k)) for x, y, z in verts]
    return vs, tris


def box_tree(b):
    (x0, y0, z0), (x1, y1, z1) = b["min"], b["max"]
    vs = [Vector(v) for v in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1))]
    q = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (0, 4, 7, 3)]   # outward
    tris = [t for a, b2, c2, d in q for t in ((a, b2, c2), (a, c2, d))]
    return vs, tris


things = []
for p in data["placed"]:
    vs, tris = placed_tree(p)
    if not tris:
        continue
    things.append({"name": p["name"], "kind": "prop", "vs": vs, "tris": tris, "rests": p.get("rests", False)})
for b in data["boxes"]:
    vs, tris = box_tree(b)
    things.append({"name": b["name"], "kind": b["kind"], "vs": vs, "tris": tris, "rests": False})
for t in things:
    t["tree"] = BVHTree.FromPolygons(t["vs"], t["tris"], epsilon=0.0)
    t["lo"] = [min(v[i] for v in t["vs"]) for i in range(3)]
    t["hi"] = [max(v[i] for v in t["vs"]) for i in range(3)]


def meets(a, b):
    return all(a["lo"][i] < b["hi"][i] and b["lo"][i] < a["hi"][i] for i in range(3))


def depth_into(a, b, pairs, side):
    """How far a's vertices on the intersecting triangles pass inside b, and where."""
    best, at = 0.0, None
    seen = set()
    for pr in pairs:
        for vi in a["tris"][pr[side]]:
            if vi in seen:
                continue
            seen.add(vi)
            v = a["vs"][vi]
            loc, nrm, _, dist = b["tree"].find_nearest(v)
            if loc is not None and (v - loc).dot(nrm) < 0 and dist > best:
                best, at = dist, v
    return best, at


import re
MOUNTS = [(re.compile(a), re.compile(b)) for a, b, _ in data.get("mounts", [])]


def mounted(x, y):
    return any((ma.search(x) and mb.search(y)) or (ma.search(y) and mb.search(x)) for ma, mb in MOUNTS)


def tri_info(t, i):
    a, b, c = (t["vs"][k] for k in t["tris"][i])
    n = (b - a).cross(c - a)
    area = n.length / 2
    return (a + b + c) / 3, (n.normalized() if area > 0 else n), area


def coplanar(a, b, tol=0.0008):
    """The area of a's faces lying in one of b's (within 0.8 mm) and facing the same way: two surfaces in one plane,
    which the renderer draws as a flickering patchwork of both. Also how far apart they are, on average."""
    area, at, gap = 0.0, None, 0.0
    for i in range(len(a["tris"])):
        cen, n, ar = tri_info(a, i)
        if ar <= 0 or not all(b["lo"][k] - 0.001 <= cen[k] <= b["hi"][k] + 0.001 for k in range(3)):
            continue
        loc, nb, _, d = b["tree"].find_nearest(cen, tol)
        if loc is not None and n.dot(nb) > 0.995:
            area += ar
            gap += ar * d
            at = at or cen
    return area, at, (gap / area if area else 0.0)


clips, zfight, mounted_n = [], [], 0
things.sort(key=lambda t: t["lo"][0])
for i, a in enumerate(things):
    for b in things[i + 1:]:
        if b["lo"][0] >= a["hi"][0] + 0.001:
            break
        if a["kind"] in STRUCT and b["kind"] in STRUCT:
            continue
        if not all(a["lo"][k] < b["hi"][k] + 0.001 and b["lo"][k] < a["hi"][k] + 0.001 for k in range(3)):
            continue
        pairs = a["tree"].overlap(b["tree"]) if meets(a, b) else []
        if pairs:
            if mounted(a["name"], b["name"]):
                mounted_n += 1
                continue
            da, pa = depth_into(a, b, pairs, 0)
            db, pb = depth_into(b, a, [(q, p) for p, q in pairs], 0)
            mid = a["vs"][a["tris"][pairs[0][0]][0]]
            if da >= db:
                clips.append({"a": a["name"], "b": b["name"], "depth": da, "at": list(pa or mid), "tris": len(pairs)})
            else:
                clips.append({"a": b["name"], "b": a["name"], "depth": db, "at": list(pb or mid), "tris": len(pairs)})
        ar, at, _ = coplanar(a, b)
        br, bt, _ = coplanar(b, a)
        if max(ar, br) > 2e-4:
            zfight.append({"a": a["name"], "b": b["name"], "area": max(ar, br), "at": list(at or bt)})

# everything placed must touch something (rest on it, hang from it): a gap over 3 mm to all else is floating
floating = []
for a in things:
    if a["kind"] != "prop":
        continue
    near = [b for b in things if b is not a and all(b["lo"][k] - 0.004 < a["hi"][k] and a["lo"][k] - 0.004 < b["hi"][k] for k in range(3))]
    best = 1.0
    for v in a["vs"][:: max(1, len(a["vs"]) // 600)]:
        for b in near:
            loc, _, _, d = b["tree"].find_nearest(v, 0.004)
            if loc is not None and d < best:
                best = d
        if best <= 0.003:
            break
    if best > 0.003:
        floating.append({"name": a["name"], "gap": best})

# inside each model: two of its parts sharing a face (a panel and its post, a label on its can) flicker in the render
# a part laid on another (a label, a print on its sheet) stands at least 0.15 mm off it; closer, the depth test mixes them
SELF_TOL = 0.00015
self_z = []
for path, parts in PARTS.items():
    ps = []
    for n, vs, tris in parts:
        if not tris:
            continue
        t = {"name": n, "vs": vs, "tris": tris, "tree": BVHTree.FromPolygons(vs, tris, epsilon=0.0)}
        t["lo"] = [min(v[i] for v in vs) for i in range(3)]
        t["hi"] = [max(v[i] for v in vs) for i in range(3)]
        ps.append(t)
    for i, a in enumerate(ps):
        for b in ps[i + 1:]:
            if not all(a["lo"][k] < b["hi"][k] + 0.001 and b["lo"][k] < a["hi"][k] + 0.001 for k in range(3)):
                continue
            ar, at, ga = coplanar(a, b, SELF_TOL)
            br, bt, gb = coplanar(b, a, SELF_TOL)
            if max(ar, br) > 2e-4:
                self_z.append({"model": path.split("/models/")[-1], "a": a["name"], "b": b["name"], "area": max(ar, br), "gap": ga if ar >= br else gb, "at": list(at or bt)})

clips.sort(key=lambda c: -c["depth"])
zfight.sort(key=lambda z: -z["area"])
self_z.sort(key=lambda z: -z["area"])
json.dump({"self_z": self_z, "clips": clips, "zfight": zfight, "floating": floating, "mounted": mounted_n, "checked": len(things)}, open(out, "w"), indent=1)
print(f"clips: {len(clips)}, z-fights: {len(zfight)}, floating: {len(floating)}, things: {len(things)}")
