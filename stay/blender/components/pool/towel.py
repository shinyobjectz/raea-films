# pool/towel: towels for the bench, modelled by hand: a blue terry bath towel with white end stripes draped across the
# bench's seat, hanging 38 cm down its front and 30 cm down its back with the cloth's waves in it, and two folded
# towels stacked beside it. Its origin is the seat's top under the draped towel's middle (the bench is 38 cm deep). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("towel")
terry_b = comp.ph_texture("pool_towel_blue", "terry_cloth", tile=0.35, res="1k", grey=True, tint=(0.25, 0.45, 0.85))
terry_w = comp.ph_texture("pool_towel_white", "terry_cloth", tile=0.35, res="1k", grey=True, tint=(1.0, 1.0, 0.97))
terry_y = comp.ph_texture("pool_towel_yellow", "terry_cloth", tile=0.35, res="1k", grey=True, tint=(1.0, 0.85, 0.3))
for m in (terry_b, terry_w, terry_y):
    relevel(m, 0.45, 1.0, "pool_terry")
D, TW = 0.38, 0.58
path = bend([(-D / 2 - 0.012, -0.38), (-D / 2 - 0.012, 0.012), (D / 2 + 0.012, 0.012), (D / 2 + 0.012, -0.3)], 0.035, 5)
path = [Vector((0, p[0], p[1])) for p in [(q.x, q.y) for q in [Vector((a[0], a[1], 0)) if not isinstance(a, Vector) else a for a in path]]]
# resample the hanging runs so the cloth has rows to wave in
rows = []
for a, b in zip(path, path[1:]):
    n = max(1, int((b - a).length / 0.04))
    rows += [a + (b - a) * (i / n) for i in range(n)]
rows.append(path[-1])
NX = 18
bm = bmesh.new()
grid = []
for j, p in enumerate(rows):
    row = []
    for i in range(NX + 1):
        x = -TW / 2 + TW * i / NX
        hang = max(0.0, -p.z) / 0.38
        out = (-1 if p.y < 0 else 1) * hang * (0.014 * math.sin(11 * x + 1.0) + 0.008 * math.sin(23 * x))
        lift = 0.004 * math.sin(14 * x + j * 0.3) if p.z > 0 else 0.0
        row.append(bm.verts.new((x + 0.006 * math.sin(j * 0.5), p.y + out, p.z + lift)))
    grid.append(row)
for j in range(len(rows) - 1):
    for i in range(NX):
        bm.faces.new([grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
t = comp.mesh(col, root, "towel_draped", bm, [terry_b, terry_w], smooth=True)
paint(t, lambda c, n: 1 if (c.z < -0.2 and (int((c.z + 0.4) / 0.022) % 2 == 0) and c.z > -0.36) else 0)
comp.uv_box(t, 1.0)
comp.solidify(t, 0.007, 0)
comp.subsurf(t, 1)
for k, (m, name) in enumerate(((terry_w, "white"), (terry_y, "yellow"))):
    b = comp.box((0.46, 0.3, 0.055), at=(0.62 + k * 0.012, 0.0 + k * 0.01, 0.03 + k * 0.058))
    bmesh.ops.subdivide_edges(b, edges=b.edges, cuts=3, use_grid_fill=True)
    random.seed(k)
    for v in b.verts:
        v.co.z += 0.004 * math.sin(17 * v.co.x + k) * (1 if v.co.z > 0.03 + k * 0.058 else 0)
    o = comp.mesh(col, root, f"towel_folded_{name}", b, m, smooth=True)
    comp.uv_box(o, 1.0)
    comp.bevel(o, 0.02, 3, angle=50)
    # the fold's lip along the front
    lip = comp.mesh(col, root, f"towel_folded_{name}_lip", comp.box((0.46, 0.012, 0.022), at=(0.62 + k * 0.012, -0.151 + k * 0.01, 0.03 + k * 0.058)), m, smooth=True)
    comp.uv_box(lip, 1.0)
    comp.bevel(lip, 0.005, 2)
done(col, root, "towel", source="own geometry; cloth: https://polyhaven.com/a/terry_cloth (levels stretched and tinted)", license="ours; texture CC0", credit="Poly Haven (terry_cloth)",
     notes="origin: the bench seat's top (0.45 m up), the draped towel across a 38 cm seat; the folded stack 0.62 m to its right")
