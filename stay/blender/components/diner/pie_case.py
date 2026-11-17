# diner/pie-case: a cake stand under a glass dome on the counter: a white pedestal stand 30 cm across (by hand), a
# glass dome with a chrome knob (by hand), and on the stand Poly Haven's carrot_cake (CC0). 33 cm tall.
# Rig: "lid" lifts the dome 22 cm straight up; "turn" turns the stand's plate and the cake one whole turn.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, T, R, S, xf

col, root = comp.fresh("pie_case")
M = _lib.maker(col, root)
china = comp.mat("pie_case_stand", (0.88, 0.87, 0.83), rough=0.18)
glass = comp.mat("pie_case_glass", (0.94, 0.97, 0.98), rough=0.02, alpha=0.16)
chrome = comp.mat("pie_case_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
M("pie_case_foot", lathe([(0, 0), (0.07, 0), (0.072, 0.004), (0.06, 0.012), (0.03, 0.022), (0.02, 0.04), (0.018, 0.08), (0.03, 0.098), (0, 0.098)], seg=48), china)
PZ = 0.098
turn = comp.pivot(col, root, "pie_case_turn", (0, 0, PZ))
M("pie_case_plate", lathe([(0, PZ), (0.13, PZ), (0.15, PZ + 0.006), (0.152, PZ + 0.014), (0.149, PZ + 0.015), (0.13, PZ + 0.01), (0, PZ + 0.01)], seg=64), china, parent=turn)
cake, credit = _lib.ph_into(col, root, "carrot_cake", "pie_case_cake", at=(0, 0, PZ + 0.01), parent=turn)
lid = comp.pivot(col, root, "pie_case_lid", (0, 0, PZ + 0.012))
Z = PZ + 0.011
dome = [(0.14, Z), (0.142, Z + 0.004), (0.142, Z + 0.07), (0.134, Z + 0.115), (0.11, Z + 0.15), (0.07, Z + 0.172), (0.025, Z + 0.181), (0, Z + 0.182)]
inner = [(r - 0.003 if r > 0.01 else 0, z - (0.003 if i > 2 else 0)) for i, (r, z) in enumerate(dome)][::-1]
M("pie_case_dome", lathe(dome + inner, seg=64), glass, parent=lid)
M("pie_case_knob", lathe([(0, Z + 0.18), (0.01, Z + 0.181), (0.008, Z + 0.192), (0.017, Z + 0.202), (0.019, Z + 0.212), (0.012, Z + 0.222), (0, Z + 0.224)], seg=32), chrome, parent=lid)
comp.channel("lid", [(lid, "location", 2, lid.location.z, lid.location.z + 0.22)])
comp.channel("turn", [(turn, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "diner", "pie_case", made="blender/components/diner/pie_case.py",
            source="own geometry (stand and dome); the cake: https://polyhaven.com/a/carrot_cake", license="ours; cake CC0", credit=credit,
            rig={"lid": "the glass dome and its knob 22 cm straight up", "turn": "the plate and the cake one whole turn"})
