# canyon/snag: a dead juniper snag for the rim, 2.5 m of bare grey limbs against the sky (Poly Haven's
# dry_branches_medium_01, CC0: its three branches stood up from one root at nearly twice their size), with
# stones heaped round its foot, modelled by hand. Rig: "sway" leans the limbs 3 degrees about the root (wind on the
# rim).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("snag")
got, credit = L.take(col, root, "dry_branches_medium_01", "1k", scale=1.9)
stand = {"a": R(78, "X"), "b": R(25, "Z") @ R(64, "Y") @ R(90, "Z"), "c": R(140, "Z") @ R(70, "X")}
at = {"a": (0, 0.1), "b": (0.25, -0.1), "c": (-0.2, -0.15)}
limbs = []
for n, o in got.items():
    k = n[-1]
    L.place(o, stand[k])
    L.drop(o, at[k][0], at[k][1], -0.08)
    limbs.append(comp.link(col, root, o, name=f"snag_limb_{k}"))
top = comp.hang(col, root, limbs, "snag_root", at=(0, 0, 0))
stone = comp.ph_texture("canyon_caprock_s", "dry_riverbed_rock", tile=1.2, res="1k", tint=(0.95, 0.58, 0.42))
for i, (size, p, turn) in enumerate((((0.5, 0.4, 0.26), (0.3, 0.2, -0.04), 20), ((0.4, 0.34, 0.22), (-0.32, 0.1, -0.03), 75), ((0.3, 0.26, 0.2), (0.0, -0.36, -0.03), 130), ((0.22, 0.2, 0.14), (0.42, -0.22, -0.02), 10))):
    b = L.rock(size, seed=90 + i, sub=3, rough=0.22, flat=0.5)
    xf(b, R(turn, "Z"))
    xf(b, T(*p))
    o = comp.mesh(col, root, f"snag_stone_{i + 1}", b, stone)
    bpy.context.view_layer.update()
    comp.uv_box(o)
comp.channel("sway", [(top, "rotation_euler", 0, 0, math.radians(3)), (top, "rotation_euler", 1, 0, math.radians(1.5))])
comp.export(col, root, L.PLACE, "snag", made="blender/components/canyon/snag.py",
            source="https://polyhaven.com/a/dry_branches_medium_01; stones own geometry, rock https://polyhaven.com/a/dry_riverbed_rock", license="CC0", credit=credit,
            rig={"sway": "the limbs lean 3 degrees about the root"})
