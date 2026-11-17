# sea/clouds: a broken line of low evening cloud for over the horizon, 210 m long, modelled by hand: five banks of
# cumulus, each a heap of ninety lumped puffs with a flat base, their undersides lit orange by the sun under them
# and their tops gone mauve (two glowing materials, clouds_belly and clouds_top, split by which way a face looks).
# Its origin is the middle of the line at the clouds' base; stand it 200 to 300 m out and 40 to 80 m up. Rig: "drift"
# carries the line 30 m to the right (+x); the glow is the scene's.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
random.seed(31)
col, root = comp.fresh("clouds")
belly = comp.mat("clouds_belly", (0.9, 0.5, 0.3), rough=1.0, emit=(1.0, 0.5, 0.36), strength=1100.0)
top = comp.mat("clouds_top", (0.5, 0.4, 0.5), rough=1.0, emit=(0.45, 0.33, 0.46), strength=600.0)
drift = comp.pivot(col, root, "clouds_drift", (0, 0, 0))
BANKS = [(-78, 0, 8, 74, 8), (-30, 22, 20, 52, 5), (8, -6, 0, 90, 9), (58, 14, 13, 60, 6), (88, -4, 3, 44, 5)]
for i, (cx, cy, cz, length, height) in enumerate(BANKS):
    puffs = []
    for k in range(90):
        t = random.uniform(-1, 1)
        x = t * length / 2
        prof = (1 - t * t) ** 0.6
        r = random.uniform(0.16, 0.5) * height * (0.4 + 0.6 * prof)
        z = random.uniform(0.15, 0.75) * height * prof
        puffs.append(_lib.ico(r, at=(x, random.uniform(-0.25, 0.25) * height, max(z, r * 0.35)), sub=2, scale=(random.uniform(2.0, 4.5), 1.2, random.uniform(0.45, 0.7))))
    bm = comp.merge(*puffs)
    _lib.lump(bm, height * 0.16, height * 0.35, 4, seed=i * 3.1)
    for v in bm.verts:                      # a flat base
        if v.co.z < 0:
            v.co.z *= 0.12
    bm.normal_update()
    for f in bm.faces:
        f.material_index = 0 if f.normal.z < -0.05 - 0.25 * random.random() or f.calc_center_median().z < height * 0.16 else 1
    xf(bm, T(cx, cy, cz))
    comp.mesh(col, root, f"clouds_bank_{i + 1}", bm, [belly, top], parent=drift, smooth=True)
_lib.channel("drift", [(drift, "location", 0, 0.0, 30.0)])
comp.export(col, root, "sea", "clouds", made="blender/components/sea/clouds.py", source="own geometry", license="ours", credit="",
            rig={"drift": "the line of cloud moves 30 m to the right", "glow": "in the scene: the materials clouds_belly (1,100) and clouds_top (600), in the traced light's units"})
