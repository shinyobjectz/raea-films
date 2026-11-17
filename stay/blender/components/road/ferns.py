# road/ferns: a clump of sword ferns for the verge and the ditch's bank, 1.6 m across (Poly Haven's fern_02, CC0: its
# four plants gathered into one clump, two of them twice). Rig: "sway" leans every plant about its own crown, each a
# different way and amount (rain on the fronds, the car's wash).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root, parts, credit = comp.ph_component("road", "ferns", "fern_02", res="2k")
rnd = random.Random(3)
SPOTS = {"a": (-0.45, -0.3, 1.5, 40), "b": (0.0, 0.1, 1.45, 0), "c": (0.5, -0.1, 1.2, 150), "d": (0.15, -0.55, 1.6, 250)}
keys = []
plants = list(parts.items())
for nm, o in list(plants):
    if nm in ("b", "c"):
        d = o.copy(); d.data = o.data
        comp.link(col, root, d, name=f"ferns_{nm}2")
        plants.append((nm + "2", d))
SPOTS.update({"b2": (-0.25, 0.5, 1.0, 200), "c2": (0.62, 0.45, 0.85, 300)})
for nm, o in plants:
    lo, hi = comp.box_of(o)
    c = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0))
    x, y, s, yaw = SPOTS[nm]
    o.matrix_world = comp.T(x, y, 0) @ comp.R(yaw, "Z") @ comp.S(s) @ comp.T(-c.x, -c.y, 0) @ o.matrix_world
    bpy.context.view_layer.update()
    p = comp.hang(col, root, o, f"ferns_sway_{nm}", at=(x, y, 0.02))
    a = rnd.uniform(0, 2 * math.pi)
    amt = math.radians(rnd.uniform(5, 9))
    keys += [(p, "rotation_euler", 0, 0, amt * math.cos(a)), (p, "rotation_euler", 1, 0, amt * math.sin(a))]
_lib.channel("sway", keys)
_lib.done(col, root, "ferns", source="https://polyhaven.com/a/fern_02", license="CC0", credit=credit,
          rig={"sway": "each of the six plants leans 5 to 9 degrees about its own crown, each its own way"})
