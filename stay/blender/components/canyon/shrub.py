# canyon/shrub: two dry desert shrubs rooted together, the larger 0.85 m across and half a metre high (Poly Haven's
# wild_rooibos_bush, CC0, its a and d plants), for a crack low on a wall or the foot of one. Rig: "sway" leans each
# about its root, the big one 6 degrees and the small one 9 (the wind in the slot).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("shrub")
got, credit = L.take(col, root, "wild_rooibos_bush", "1k", keep=lambda n: n.split(".")[0][-1] in "ad")
keys = []
for n, o in got.items():
    k = n[-1]
    L.drop(o, 0 if k == "a" else 0.42, 0 if k == "a" else -0.22, 0.0)
    comp.link(col, root, o, name=f"shrub_plant_{k}")
    lo, hi = comp.box_of(o)
    p = comp.hang(col, root, o, f"shrub_root_{k}", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0))
    keys.append((p, "rotation_euler", 0, 0, math.radians(6 if k == "a" else 9)))
    keys.append((p, "rotation_euler", 1, 0, math.radians(2 if k == "a" else -3)))
comp.channel("sway", keys)
comp.export(col, root, L.PLACE, "shrub", made="blender/components/canyon/shrub.py", source="https://polyhaven.com/a/wild_rooibos_bush", license="CC0", credit=credit,
            rig={"sway": "each plant leans down the slot about its root, the big one 6 degrees and the small one 9"})
