# The player's hands: the pointer's shapes as solid objects (the method of projects/stay/blender/hand-cursor.py: each
# outline traced from signed-distance shapes on a 64 grid, y down; a dark rim slab, the white body drawn in by the rim's
# width and raised a little, every silhouette edge rounded so light runs along it).
#   arrow   the select arrow; its hotspot (origin) is the tip
#   link    the pointing hand; origin the fingertip
#   grab    the closed hand, holding; origin the palm
#   resize  the horizontal double arrow; origin its middle
#   busy    the hourglass; origin its middle (sand is its own slab, material cursor-sand)
# In raea's frame each faces +z, up is up; 1 m is 58.5 grid units, so scale it in the scene.
#   raea blender run blender/cursors.py
import bpy, bmesh, sys, json, os
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "models", "cursor")
SPAN = 58.5
DEPTH, RIM, RAISE, BEVEL = 0.09, 2.0, 0.012, 0.012
STEP = 0.2

def sd_capsule(X, Y, a, b, r):
    ax, ay = a; bx, by = b
    px, py = X - ax, Y - ay; dx, dy = bx - ax, by - ay
    h = np.clip((px * dx + py * dy) / (dx * dx + dy * dy), 0.0, 1.0)
    return np.hypot(px - dx * h, py - dy * h) - r

def sd_rbox(X, Y, x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx, qy = np.abs(X - cx) - hx, np.abs(Y - cy) - hy
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r

def sd_poly(X, Y, pts, round_=0.0):
    """signed distance to a closed polygon (negative inside), its corners rounded by `round_`"""
    d = np.full(X.shape, 1e9); inside = np.zeros(X.shape, dtype=bool)
    n = len(pts)
    for i in range(n):
        (ax, ay), (bx, by) = pts[i], pts[(i + 1) % n]
        px, py = X - ax, Y - ay; ex, ey = bx - ax, by - ay
        h = np.clip((px * ex + py * ey) / (ex * ex + ey * ey), 0, 1)
        d = np.minimum(d, np.hypot(px - ex * h, py - ey * h))
        cond = ((ay > Y) != (by > Y)) & (X < (bx - ax) * (Y - ay) / (by - ay + 1e-12) + ax)
        inside ^= cond
    return np.where(inside, -d, d) + round_

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)

def contour(F, xs, ys):
    segs = []
    ny, nx = F.shape
    def edge_pt(i, j, e):
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

def simplify(loop, every=0.6):
    out = [loop[0]]
    for p in loop[1:]:
        if np.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) >= every:
            out.append(p)
    return out

def slab(bm, loop, origin, y0, y1, bevel):
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

ARROW = [(5, 1), (46, 35.5), (29.5, 35.5), (37.5, 54.5), (26.5, 59.5), (18.5, 38.5), (5, 51)]

def shapes(name, X, Y):
    """the outline's parts: a list of fields whose union is the outer shape (the body is each drawn in by the rim)"""
    if name == "arrow":
        return [sd_poly(X, Y, ARROW, 0.6)], (5.0, 1.0)
    if name == "link":
        palm = sd_rbox(X, Y, 19.5, 31.0, 45.0, 58.0, 8.0)
        return [palm, sd_capsule(X, Y, (24.2, 34.0), (24.2, 5.2), 4.4), sd_capsule(X, Y, (30.8, 33.0), (31.0, 25.0), 4.3),
                sd_capsule(X, Y, (37.4, 33.5), (37.6, 26.5), 4.2), sd_capsule(X, Y, (43.0, 35.5), (43.6, 30.0), 3.8),
                sd_capsule(X, Y, (22.5, 47.0), (12.0, 37.0), 4.5)], (24.2, 0.8)
    if name == "grab":
        palm = sd_rbox(X, Y, 19.5, 30.0, 45.0, 57.0, 8.0)
        return [palm, sd_capsule(X, Y, (22.5, 33.0), (22.0, 25.0), 4.3), sd_capsule(X, Y, (29.5, 31.5), (29.3, 22.5), 4.4),
                sd_capsule(X, Y, (36.5, 31.5), (36.8, 23.5), 4.3), sd_capsule(X, Y, (42.5, 34.0), (43.5, 27.5), 3.9),
                sd_capsule(X, Y, (22.0, 47.0), (16.5, 38.5), 4.6)], (32.0, 41.0)
    if name == "resize":
        shaft = sd_rbox(X, Y, 13.0, 28.5, 51.0, 35.5, 1.0)
        return [shaft, sd_poly(X, Y, [(1.5, 32), (17.5, 17.5), (17.5, 46.5)], 0.8), sd_poly(X, Y, [(62.5, 32), (46.5, 17.5), (46.5, 46.5)], 0.8)], (32.0, 32.0)
    if name == "busy":
        top = sd_rbox(X, Y, 13.0, 3.0, 51.0, 10.5, 2.0)
        bot = sd_rbox(X, Y, 13.0, 53.5, 51.0, 61.0, 2.0)
        glass = sd_poly(X, Y, [(17.5, 9.5), (46.5, 9.5), (35.0, 32.0), (46.5, 54.5), (17.5, 54.5), (29.0, 32.0)], 1.2)
        return [top, bot, glass], (32.0, 32.0)
    raise KeyError(name)

def sand(X, Y):
    """the hourglass's sand: a band left in the top bulb, a heap in the bottom one"""
    topsand = np.maximum(sd_poly(X, Y, [(22.5, 14.0), (41.5, 14.0), (33.0, 30.0), (31.0, 30.0)], 0.0), 17.0 - Y)
    heap = sd_poly(X, Y, [(21.0, 51.5), (43.0, 51.5), (36.5, 44.0), (32.0, 40.5), (27.5, 44.0)], 0.0)
    return np.minimum(topsand, heap)

def material(name, c, r):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = c
    b.inputs["Roughness"].default_value = r
    return m

def build(name):
    xs = np.arange(-4.0, 68.0, STEP); ys = np.arange(-4.0, 68.0, STEP)
    X, Y = np.meshgrid(xs, ys)
    parts, origin = shapes(name, X, Y)
    outer = parts[0]
    for p in parts[1:]:
        outer = smin(outer, p, 1.6)
    body = np.min(np.stack([p + RIM for p in parts]), axis=0)
    if name == "busy":  # the hourglass's frame is dark; its glass reads as the white body only inside the bulbs
        body = parts[2] + RIM
    def loops(F):
        return [simplify(l) for l in contour(F, xs, ys) if len(l) > 20]
    rim = material("cursor-rim", (0.018, 0.018, 0.022, 1), 0.35)
    white = material("cursor-body", (0.92, 0.92, 0.9, 1), 0.28)
    gold = material("cursor-sand", (0.62, 0.42, 0.14, 1), 0.6)
    obs = []
    layers = [("rim", [max(loops(outer), key=len)], 0.0, DEPTH, rim, BEVEL), ("body", [max(loops(body), key=len)], -RAISE, 0.01, white, 0.006)]
    if name == "busy":
        layers.append(("sand", loops(sand(X, Y)), -RAISE - 0.006, 0.0, gold, 0.003))
    for part, ls, y0, y1, mat, bev in layers:
        bm = bmesh.new()
        for l in ls:
            slab(bm, l, origin, y0, y1, bev)
        me = bpy.data.meshes.new(f"cursor-{name}-{part}")
        bm.to_mesh(me); bm.free()
        me.materials.append(mat)
        for p in me.polygons:
            p.use_smooth = False
        ob = bpy.data.objects.new(f"cursor-{name}-{part}", me)
        bpy.context.scene.collection.objects.link(ob)
        obs.append(ob)
    return obs

try:
    os.makedirs(OUT, exist_ok=True)
    made = {}
    for name in ("arrow", "link", "grab", "resize", "busy"):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        obs = build(name)
        out = os.path.join(OUT, f"{name}.glb")
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
        lo = [min(min((o.matrix_world @ v.co)[i] for v in o.data.vertices) for o in obs) for i in range(3)]
        hi = [max(max((o.matrix_world @ v.co)[i] for v in o.data.vertices) for o in obs) for i in range(3)]
        info = {"made": "blender/cursors.py", "source": "own geometry (a pointer shape: " + name + ")", "license": "ours", "credit": "",
                "nodes": [o.name for o in obs], "box_raea": [[lo[0], lo[2], -hi[1]], [hi[0], hi[2], -lo[1]]], "steps": ["cursors.py"]}
        json.dump(info, open(out + ".json", "w"), indent=1)
        made[name] = [round(v, 3) for v in lo + hi]
        print("wrote", out, made[name])
    print("DONE")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
