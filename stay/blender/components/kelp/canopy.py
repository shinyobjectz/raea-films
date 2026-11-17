# kelp/canopy: the kelp's canopy lying on the surface, modelled by hand: a raft 7 m across of six stipe ends snaking
# level under the surface, each with blades and bladders along it streaming one way, seen from below as dark gold
# against the light. A ceiling piece: its top is at the origin (the surface), nothing hangs more than 0.6 m below.
# Rig: "drift" carries the raft 0.9 m along +x and turns it 7 degrees (the swell moving it over the sun).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Matrix, Vector

col, root = comp.fresh("canopy")
blade_m, stipe_m, bulb_m = L.kelp_mats()
raft = comp.pivot(col, root, "canopy_raft", (0, 0, 0))
rnd = random.Random(5)
stipes, blades, bulbs = [], [], []
for s in range(6):
    y0 = -2.6 + s * 1.05 + rnd.uniform(-0.3, 0.3)
    x0 = rnd.uniform(-3.4, -2.2)
    ln = rnd.uniform(4.2, 6.0)
    pts = []
    for k in range(9):
        t = k / 8
        pts.append((x0 + ln * t, y0 + 0.35 * math.sin(t * 5 + s), -0.12 - 0.3 * (1 - t) ** 2 - 0.03 * math.sin(t * 9 + s)))
    stipes.append(L.with_uv(comp.tube(pts, 0.011, res=4, sides=1)))
    for k in range(1, 9):
        for side in (-1, 1):
            at = Vector(pts[k]) + Vector((rnd.uniform(-0.15, 0.15), 0, 0))
            az = rnd.uniform(-35, 35) - 90 + side * rnd.uniform(5, 40)          # they stream toward +x
            m = Matrix.Translation(at) @ Matrix.Rotation(math.radians(az), 4, "Z") @ Matrix.Rotation(math.radians(rnd.uniform(-6, 10)), 4, "X")
            b = L.blade(rnd.uniform(0.55, 0.95), 0.1 * rnd.uniform(0.8, 1.3), rnd, droop=rnd.uniform(0.0, 0.12))
            xf(b, T(0, 0.085, 0))
            blades.append(xf(b, m))
            bulbs.append(xf(L.with_uv(L.ball(0.016, (0, 0.05, 0), sub=1, squash=(1, 2.4, 1))), m))
comp.mesh(col, root, "canopy_stipes", comp.merge(*stipes), stipe_m, parent=raft, smooth=True)
comp.mesh(col, root, "canopy_blades", comp.merge(*blades), blade_m, parent=raft, smooth=True)
comp.mesh(col, root, "canopy_bladders", comp.merge(*bulbs), bulb_m, parent=raft, smooth=True)
L.channel("drift", [(raft, "location", 0, 0.0, 0.9), (raft, "rotation_euler", 2, 0.0, math.radians(7))])
comp.export(col, root, "kelp", "canopy", made="blender/components/kelp/canopy.py", source="own geometry and painting (the canopy of giant kelp)", license="ours", credit="",
            rig={"drift": "the raft (canopy_raft) moves 0.9 m along +x and turns 7 degrees", "glow": "in the scene: the materials kelp_blade and kelp_bladder"})
