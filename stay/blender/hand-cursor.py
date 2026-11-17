# The cursor's hands (the director, 11-11, on assembly 23: "swap cursor to hand and gab effects when opportune"): the open hand
# it turns into as it reaches for a thing it will take hold of, and the closed hand that holds it, made as the arrow is
# (blender/cursor.py): a dark rim, a white body raised a little inside it, the edges rounded so the light runs along them,
# on the same 64 grid at the same scale, so a hand is the arrow's size. Each outline is traced from rounded shapes (a
# palm, four fingers, a thumb), and the white body is each shape drawn in by the rim's width on its own, so a dark line
# runs between the fingers, as on a hand cursor. The origin is the palm's middle, where it holds a thing.
#   raea blender run blender/hand-cursor.py media/models
#     -> media/models/cursor-open.glb, media/models/cursor-grab.glb (materials "cursor-rim" and "cursor-body", as the arrow's)
# In raea's frame each faces +z, the fingers up. raea's frame to Blender's: (x, y, z) -> (x, -z, y).
import bpy, bmesh, sys, json, os
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
outdir = argv[0]

SPAN = 58.5                                                   # grid units to a metre: the arrow's tip to its tail's foot
DEPTH, RIM, RAISE, BEVEL = 0.09, 1.9, 0.012, 0.012            # the slab's depth (m), the rim's width (grid units), the body's rise (m), its edges (m)
STEP = 0.2                                                    # the tracing grid (units)

# the shapes, on the 64 grid with y down: a palm (rounded box: x0, y0, x1, y1, corner), and capsules (from, to, radius)
HANDS = {
    "open": {
        "palm": (19.5, 30.0, 45.0, 57.0, 8.0),
        "caps": [((22.5, 33.0), (20.0, 9.5), 4.3), ((29.5, 31.0), (28.8, 5.5), 4.4), ((36.5, 31.0), (37.8, 8.0), 4.3),
                 ((42.5, 34.0), (46.5, 16.0), 3.9), ((23.0, 47.0), (9.0, 33.5), 4.6)],
        "origin": (32.0, 41.0),
    },
    "grab": {
        # the fingers closed over the palm: four short knuckles in a row across its top, the thumb laid in across it
        "palm": (19.5, 30.0, 45.0, 57.0, 8.0),
        "caps": [((22.5, 33.0), (22.0, 25.0), 4.3), ((29.5, 31.5), (29.3, 22.5), 4.4), ((36.5, 31.5), (36.8, 23.5), 4.3),
                 ((42.5, 34.0), (43.5, 27.5), 3.9), ((22.0, 47.0), (16.5, 38.5), 4.6)],
        "origin": (32.0, 41.0),
    },
}

def sd_capsule(X, Y, a, b, r):
    ax, ay = a; bx, by = b
    px, py = X - ax, Y - ay; dx, dy = bx - ax, by - ay
    h = np.clip((px * dx + py * dy) / (dx * dx + dy * dy), 0.0, 1.0)
    return np.hypot(px - dx * h, py - dy * h) - r

def sd_rbox(X, Y, x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx, qy = np.abs(X - cx) - hx, np.abs(Y - cy) - hy
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)

def contour(F, xs, ys):
    """the zero line of F (rows y, columns x) as closed loops of points, by marching squares, joined end to end"""
    segs = []
    ny, nx = F.shape
    def edge_pt(i, j, e):
        # e: 0 top (i, j)-(i, j+1), 1 right (i, j+1)-(i+1, j+1), 2 bottom (i+1, j)-(i+1, j+1), 3 left (i, j)-(i+1, j)
        (a, b) = [((i, j), (i, j + 1)), ((i, j + 1), (i + 1, j + 1)), ((i + 1, j), (i + 1, j + 1)), ((i, j), (i + 1, j))][e]
        fa, fb = F[a], F[b]; t = fa / (fa - fb)
        return (round(xs[a[1]] + (xs[b[1]] - xs[a[1]]) * t, 6), round(ys[a[0]] + (ys[b[0]] - ys[a[0]]) * t, 6))
    TABLE = {1: [(3, 2)], 2: [(2, 1)], 3: [(3, 1)], 4: [(0, 1)], 5: [(3, 0), (2, 1)], 6: [(0, 2)], 7: [(3, 0)],
             8: [(0, 3)], 9: [(0, 2)], 10: [(0, 1), (2, 3)], 11: [(0, 1)], 12: [(1, 3)], 13: [(1, 2)], 14: [(2, 3)]}
    for i in range(ny - 1):
        for j in range(nx - 1):
            c = (F[i + 1, j] < 0) * 1 + (F[i + 1, j + 1] < 0) * 2 + (F[i, j + 1] < 0) * 4 + (F[i, j] < 0) * 8
            for e0, e1 in TABLE.get(c, []):
                segs.append((edge_pt(i, j, e0), edge_pt(i, j, e1)))
    # join the segments into loops
    nxt = {}
    for a, b in segs:
        nxt.setdefault(a, []).append(b); nxt.setdefault(b, []).append(a)
    seen, loops = set(), []
    for start in list(nxt):
        if start in seen:
            continue
        loop, prev, cur = [start], None, start
        seen.add(start)
        while True:
            cand = [p for p in nxt[cur] if p != prev and p not in seen]
            if not cand:
                break
            prev, cur = cur, cand[0]
            seen.add(cur); loop.append(cur)
        loops.append(loop)
    return loops

def simplify(loop, every=0.7):
    """points at least `every` units apart along the loop"""
    out = [loop[0]]
    for p in loop[1:]:
        if np.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) >= every:
            out.append(p)
    return out

def slab(bm, loop, origin, y0, y1, bevel):
    """the loop (64-grid points, y down) extruded from Blender y0 (its front) to y1, its silhouette's edges rounded"""
    ox, oy = origin
    verts = [bm.verts.new(Vector(((x - ox) / SPAN, y0, -(y - oy) / SPAN))) for x, y in loop]
    face = bm.faces.new(verts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)]:
        v.co.y = y1
    new = [face] + [g for g in ext["geom"] if isinstance(g, bmesh.types.BMFace)]
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.normal_update()
    caps = [f for f in bm.faces if f in set(new) or len(f.verts) > 4]
    edges = list({e for f in caps if len(f.verts) > 4 for e in f.edges})
    bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)

def build(name, spec):
    xs = np.arange(-4.0, 68.0, STEP); ys = np.arange(-4.0, 68.0, STEP)
    X, Y = np.meshgrid(xs, ys)
    parts = [sd_rbox(X, Y, *spec["palm"])] + [sd_capsule(X, Y, a, b, r) for a, b, r in spec["caps"]]
    outer = parts[0]
    for p in parts[1:]:
        outer = smin(outer, p, 1.6)
    body = np.min(np.stack([p + RIM for p in parts]), axis=0)
    def main_loop(F):
        loops = [l for l in contour(F, xs, ys) if len(l) > 20]
        return simplify(max(loops, key=len))
    o, b = main_loop(outer), main_loop(body)
    rim = bpy.data.materials.new("cursor-rim"); white = bpy.data.materials.new("cursor-body")
    for m, c, r in ((rim, (0.018, 0.018, 0.022, 1), 0.35), (white, (0.92, 0.92, 0.9, 1), 0.28)):
        m.use_nodes = True
        bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        bsdf.inputs["Base Color"].default_value = c
        bsdf.inputs["Roughness"].default_value = r
    obs = []
    for part, loop, y0, y1, mat, bev in (("rim", o, 0.0, DEPTH, rim, BEVEL), ("body", b, -RAISE, 0.01, white, 0.006)):
        bm = bmesh.new()
        slab(bm, loop, spec["origin"], y0, y1, bev)
        me = bpy.data.meshes.new(f"cursor-{name}-{part}")
        bm.to_mesh(me); bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(f"cursor-{name}-{part}", me)
        bpy.context.scene.collection.objects.link(ob)
        obs.append(ob)
    return obs, len(o), len(b)

try:
    os.makedirs(outdir, exist_ok=True)
    made = {}
    for name, spec in HANDS.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        obs, no, nb = build(name, spec)
        out = os.path.join(outdir, f"cursor-{name}.glb")
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
        lo = [min(min((o.matrix_world @ v.co)[i] for v in o.data.vertices) for o in obs) for i in range(3)]
        hi = [max(max((o.matrix_world @ v.co)[i] for v in o.data.vertices) for o in obs) for i in range(3)]
        info = {"made": "blender/hand-cursor.py", "source": "own geometry (a generic hand pointer, " + name + ")", "license": "ours",
                "credit": "", "outline_points": [no, nb], "nodes": [o.name for o in obs], "box_blender": [lo, hi], "steps": ["hand-cursor.py"]}
        json.dump(info, open(out + ".json", "w"), indent=1)
        made[name] = info
    print("DONE", json.dumps(made))
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
