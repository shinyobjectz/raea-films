# turbines/fog: the fog lying in the valleys either side of the ridge at sunrise, modelled by hand: a billowed sheet
# 760 by 620 m whose top sits 9 to 16 m above the valley floor (so the ridge stands out of it), and over it two thinner
# veils that soften its edge against the hillside. Its origin is the ridge's. The two layers are their own materials (fog_bank, fog_wisps).
# Rig: "drift" slides the bank 40 m and the wisps 70 m along the valley (+x).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm

col, root = comp.fresh("fog")
bank_m = comp.mat("fog_bank", (0.9, 0.88, 0.86), rough=1.0)
wisp_m = comp.mat("fog_wisps", (0.95, 0.93, 0.9), rough=1.0, alpha=0.3)
M = _lib.maker(col, root)
bank = comp.pivot(col, root, "fog_bank_drift", (0, 0, 0))
wisps = comp.pivot(col, root, "fog_wisps_drift", (0, 0, 0))


def top(lift, seed):
    def f(x, y):
        puff = abs(fbm(x, y, scale=24, octaves=2, seed=seed + 6.0))
        return 0, 0, 10.5 + lift + 2.6 * fbm(x, y, scale=80, octaves=3, seed=seed) + 3.0 * puff + 0.7 * fbm(x, y, scale=8, octaves=2, seed=seed + 2.0)
    return f


M("fog_bank_sheet", _lib.field(760, 620, 190, 155, top(0.0, 3.0), at=(-90, -10)), bank_m, parent=bank, smooth=True)
# the wisps: two thinner veils riding just over the bank, so its edge against the hillside is soft
M("fog_wisp_veil_1", _lib.field(760, 620, 120, 98, top(1.3, 7.0), at=(-90, -10)), wisp_m, parent=wisps, smooth=True)
M("fog_wisp_veil_2", _lib.field(760, 620, 120, 98, top(2.7, 12.0), at=(-90, -10)), wisp_m, parent=wisps, smooth=True)
comp.channel("drift", [(bank, "location", 0, 0.0, 40.0), (wisps, "location", 0, 0.0, 70.0)])
comp.export(col, root, "turbines", "fog", made="blender/components/turbines/fog.py", source="own geometry (a billowed sheet and rolls of mist)", license="ours", credit="",
            rig={"drift": "the bank slides 40 m and the wisps 70 m along the valley (+x)", "thickness": "in the scene: the materials fog_bank and fog_wisps"},
            notes="origin: the ridge's (the valley floor under the first turbine); its top is 9 to 16 m up, the ridge's crest 30 m")
