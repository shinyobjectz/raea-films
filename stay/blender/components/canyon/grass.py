# canyon/grass: a clump of dry bunchgrass, 0.75 m high to its seed heads and a metre across its arching blades, modelled by hand: 190 bent, tapering blades in
# three straw colours fanning from a crown, and fourteen taller seed stalks with heads. Grows at the foot of a wall
# where the flood leaves silt. Rig: "sway" leans the clump 8 degrees about its crown (the slot's wind).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector, Matrix

col, root = comp.fresh("grass")
mats = [comp.mat("grass_straw", (0.62, 0.52, 0.28), rough=0.8), comp.mat("grass_dry", (0.50, 0.42, 0.22), rough=0.85), comp.mat("grass_green", (0.38, 0.40, 0.20), rough=0.8)]
seed_m = comp.mat("grass_seed", (0.70, 0.60, 0.40), rough=0.9)
rnd = random.Random(12)
bms = [bmesh.new() for _ in mats]


def blade(bm, base, az, lean, length, width, droop):
    side = Vector((-math.sin(az), math.cos(az), 0))
    out = Vector((math.cos(az), math.sin(az), 0))
    n, prev = 5, None
    for i in range(n + 1):
        t = i / n
        ang = lean + droop * t * t
        p = base + out * (math.sin(ang) * length * t) + Vector((0, 0, math.cos(ang) * length * t)) if i else base
        # integrate the bend so the blade arcs over rather than kinks
        w = width * (1 - t) ** 0.7 + 0.0004
        a, b = bm.verts.new(p - side * w / 2), bm.verts.new(p + side * w / 2)
        if prev:
            bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)


for k in range(190):
    r = rnd.uniform(0, 0.09) ** 1.0
    az0 = rnd.uniform(0, 2 * math.pi)
    base = Vector((r * math.cos(az0), r * math.sin(az0), 0))
    az = az0 + rnd.uniform(-0.6, 0.6)
    blade(bms[rnd.choice((0, 0, 1, 1, 2))], base, az, rnd.uniform(0.05, 0.55) + r * 4, rnd.uniform(0.22, 0.52), rnd.uniform(0.004, 0.008), rnd.uniform(0.2, 1.1))
crown = comp.pivot(col, root, "grass_crown", (0, 0, 0))
for i, (bm, m) in enumerate(zip(bms, mats)):
    comp.mesh(col, root, f"grass_blades_{i + 1}", bm, m, parent=crown)
stalks = []
for k in range(14):
    az = rnd.uniform(0, 2 * math.pi)
    lean = rnd.uniform(0.05, 0.3)
    ln = rnd.uniform(0.42, 0.58)
    d = Vector((math.sin(lean) * math.cos(az), math.sin(lean) * math.sin(az), math.cos(lean)))
    a = Vector((0.03 * math.cos(az), 0.03 * math.sin(az), 0))
    tip = a + d * ln + Vector((d.x, d.y, 0)) * 0.05
    stalks.append(L.twig([a, a + d * ln * 0.5, tip], 0.0016, sides=3))
    head = L.rock((0.012, 0.012, 0.06), seed=200 + k, sub=1, rough=0.3)
    xf(head, Matrix.Translation(tip - Vector((0, 0, 0.012))) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4())
    stalks.append(head)
comp.mesh(col, root, "grass_stalks", comp.merge(*stalks), seed_m, parent=crown)
comp.channel("sway", [(crown, "rotation_euler", 0, 0, math.radians(8)), (crown, "rotation_euler", 1, 0, math.radians(3))])
comp.export(col, root, L.PLACE, "grass", made="blender/components/canyon/grass.py", source="own geometry (dry bunchgrass)", license="ours", credit="",
            rig={"sway": "the clump leans 8 degrees down the slot about its crown"})
