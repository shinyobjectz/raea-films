# cathedral/light-shaft: the sun through the rose window, modelled by hand: a faint warm shaft from the window down
# to the floor, twelve thin coloured shafts inside it (one a petal light, in the glass's blue, ruby and gold), and the
# pool the window throws on the flags, the rose's painting seen through its tracery (rose_pool.png, painted by
# rose_window.py: build that first). Its origin is the rose's centre (8.6 m above the floor, at the wall's back); the
# shaft falls toward -y and lands with its centre 7.5 m out from the wall. Materials: light_shaft_air,
# light_shaft_blue/ruby/gold, light_shaft_pool (all glow, all see-through).
# Rig: "swing" swings the shaft and its pool 24 degrees about the window's upright axis, from the north arcade onto
# the nave's centre line (the sun swung until the rose lights the floor).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("light_shaft")
CZ, RG, FLOOR = 8.6, 2.54, 0.02
Y0 = -0.75                               # where the shaft leaves the wall's face
RUN = 7.5                                # the pool's centre, out from the wall's back
slope = (CZ - FLOOR - 0.01) / RUN        # the fall for each metre out
sw = comp.pivot(col, root, "light_shaft_swing", (0, 0, 0))
sw.rotation_euler[2] = 0.0
M = lambda n, bm, m, smooth=True: comp.mesh(col, root, n, bm, m, parent=sw, smooth=smooth)
def land(x, z):
    """Where the ray through the window's point (x, z) (z from the rose's centre) meets the floor."""
    return Vector((x, -(CZ - FLOOR - 0.01 + z) / slope, -(CZ - FLOOR - 0.01)))
def start(x, z):
    return Vector((x, Y0, z - (-Y0) * slope))
def beam(cx, cz, r, seg=16, steps=6):
    bm = bmesh.new()
    rings = []
    for k in range(steps + 1):
        t = k / steps
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            x, z = cx + r * math.cos(a), cz + r * math.sin(a)
            ring.append(bm.verts.new(start(x, z).lerp(land(x, z), t)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
air = comp.mat("light_shaft_air", (1.0, 0.9, 0.7), rough=1.0, alpha=0.03, emit=(1.0, 0.85, 0.6), strength=4.0)
M("light_shaft_air", beam(0, 0, RG - 0.1, seg=48), air)
cols = {"blue": (0.2, 0.4, 1.0), "ruby": (1.0, 0.15, 0.12), "gold": (1.0, 0.75, 0.2)}
mats = {k: comp.mat(f"light_shaft_{k}", c, rough=1.0, alpha=0.04, emit=c, strength=9.0) for k, c in cols.items()}
groups = {k: [] for k in cols}
for i in range(12):
    a = math.radians(30 * i)
    groups[("blue", "ruby", "blue", "gold")[i % 4]].append(beam(1.05 * math.cos(a), 1.05 * math.sin(a), 0.22, seg=10))
groups["gold"].append(beam(0, 0, 0.3, seg=12))
for k, bms in groups.items():
    M(f"light_shaft_{k}", comp.merge(*bms), mats[k])
# the pool on the flags
pool_m = L.picture("light_shaft_pool", os.path.join(L.TEX, "rose_pool.png"), emit=14.0, rough=0.9, alpha=True)
p00, p10, p11, p01 = land(-RG, -RG), land(RG, -RG), land(RG, RG), land(-RG, RG)
bm = bmesh.new()
N = 12
vs = [[bm.verts.new(p00.lerp(p10, i / N).lerp(p01.lerp(p11, i / N), j / N) + Vector((0, 0, 0.03))) for j in range(N + 1)] for i in range(N + 1)]
uvl = bm.loops.layers.uv.new("UVMap")
for i in range(N):
    for j in range(N):
        f = bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
        for l, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
            l[uvl].uv = (u / N, v / N)
for f in bm.faces:
    if f.normal.z < 0:
        f.normal_flip()
M("light_shaft_pool", bm, pool_m, smooth=False)
SWING = math.radians(24)
L.channel("swing", [(sw, "rotation_euler", 2, -SWING, 0.0)])
sw.rotation_euler[2] = -SWING
comp.export(col, root, "cathedral", "light_shaft", made="blender/components/cathedral/light_shaft.py",
            source="own geometry; the pool is rose_window.py's painting through its tracery", license="ours", credit="",
            rig={"swing": "the shaft and the pool (light_shaft_swing) swing 24 degrees about the upright through the rose's centre, from the side of the nave to its centre line",
                 "glow": "in the scene: the glow of light_shaft_air, light_shaft_blue, light_shaft_ruby, light_shaft_gold and light_shaft_pool, with the rose's own"},
            notes="Place its origin at the rose's centre: 8.6 m above the rose wall's origin. The pool lies 5 cm above the wall's origin level (3 cm over the flagstones, clear of the runner).")
