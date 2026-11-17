# ferris/balloons: a seller's bunch of nine balloons left tied to a sandbag, 2.3 m to the top one, modelled by hand:
# each a balloon of its own (a pear-shaped skin with a knot and neck) on its own ribbon, in six glossy colours, the
# ribbons gathered into a ring knot on the sandbag's strap. Origin: the sandbag, on the ground.
# Rig: "sway" leans the whole bunch 16 degrees about the knot and each balloon a little more about its own
# ribbon's foot; "bob" lifts the bunch 12 cm, the ribbons drawing tight.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(9)
col, root = comp.fresh("balloons")
COLS = [comp.mat(f"balloon_{n}", c, rough=0.12) for n, c in (("red", (0.7, 0.04, 0.05)), ("yellow", (0.9, 0.7, 0.05)), ("blue", (0.05, 0.2, 0.65)), ("green", (0.05, 0.5, 0.2)), ("pink", (0.9, 0.3, 0.5)), ("white", (0.9, 0.9, 0.88)))]
ribbon = comp.mat("balloon_ribbon", (0.92, 0.9, 0.85), rough=0.5)
sack = comp.ph_texture("balloon_sandbag", "hessian_380", tile=0.3, res="1k")
sb = comp.mesh(col, root, "balloons_sandbag", xf(L.sphere(1.0, u=18, v=10), comp.Matrix.Translation((0, 0, 0.07)) @ S(0.2, 0.13, 0.075)), sack, smooth=True)
comp.uv_box(sb, 1.0)
comp.mesh(col, root, "balloons_strap", comp.merge(L.torus(0.05, 0.006, seg_=14, sides=5, axis="Y", at=(0, 0, 0.17)), comp.box((0.03, 0.27, 0.004), at=(0, 0, 0.146))), ribbon, smooth=True)
KNOT = Vector((0, 0, 0.2))
bunch = comp.pivot(col, root, "balloons_bunch", tuple(KNOT))
chans = [(bunch, "rotation_euler", 1, 0, math.radians(16))]
for i in range(9):
    a = 2 * math.pi * i / 9 + random.uniform(-0.2, 0.2)
    rr = 0.16 + 0.3 * (i % 3) / 2
    top = Vector((rr * math.cos(a), rr * math.sin(a) * 0.8, 1.55 + 0.42 * ((i * 4) % 9) / 8))
    bp = comp.pivot(col, root, f"balloons_balloon_{i + 1}", tuple(KNOT), parent=bunch)
    bm = L.sphere(1.0, u=18, v=14)
    for v in bm.verts:
        k = 1.0 - 0.28 * max(0.0, -v.co.z) ** 1.5
        v.co.x *= k
        v.co.y *= k
        v.co.z *= 1.22
    xf(bm, S(0.14))
    d = (top - KNOT).normalized()
    q = Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4()
    xf(bm, comp.Matrix.Translation(top) @ q)
    comp.mesh(col, root, f"balloons_balloon_{i + 1}_skin", bm, COLS[i % 6], parent=bp, smooth=True)
    neck = top - d * 0.175
    comp.mesh(col, root, f"balloons_balloon_{i + 1}_knot", comp.merge(L.seg(neck - d * 0.012, neck + d * 0.012, 0.012, 8, r2=0.004)), COLS[i % 6], parent=bp, smooth=True)
    mid = KNOT.lerp(neck, 0.5) + Vector((0.02 * math.cos(a * 3), 0.02 * math.sin(a * 2), -0.03))
    comp.mesh(col, root, f"balloons_balloon_{i + 1}_ribbon", comp.tube([tuple(KNOT), tuple(mid), tuple(neck)], 0.0015, res=6, sides=2), ribbon, parent=bp, smooth=True)
    chans.append((bp, "rotation_euler", 1, 0, math.radians(3 + (i * 5) % 7)))
comp.channel("sway", chans)
comp.channel("bob", [(bunch, "location", 2, bunch.location.z, bunch.location.z + 0.12)])
comp.export(col, root, "ferris", "balloons", made="blender/components/ferris/balloons.py", source="own geometry; texture: https://polyhaven.com/a/hessian_380", license="ours; texture CC0", credit="Poly Haven (hessian_380)",
            rig={"sway": "the bunch leans 16 degrees about its knot, each balloon 3 to 9 degrees more about its ribbon's foot", "bob": "the bunch lifts 12 cm"})
