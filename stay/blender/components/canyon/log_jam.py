# canyon/log-jam: flood logs jammed across the slot overhead, the mark of how high the water runs: two dead trunks
# (Poly Haven's dead_quiver_trunk, CC0, 3.1 m and 2.5 m long) crossed and wedged wall to wall, dry branches hung on
# them (dry_branches_medium_01, CC0) and a hand-modelled rack of sticks packed between. Its origin is under its middle:
# stand it where the slot is 2.7 m wide (in this canyon 4.5 m up, 15 m in). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("log_jam")
a, credit = L.take(col, root, "dead_quiver_trunk", "1k", scale=1.55)
log = next(iter(a.values()))
L.place(log, R(82, "Y"))
L.drop(log, 0, 0, 0.0)
comp.link(col, root, log, name="log_jam_log_1")
b, _ = L.take(col, root, "dead_quiver_trunk", "1k", scale=1.25)
log2 = next(iter(b.values()))
L.place(log2, R(-18, "Z") @ R(-104, "Y"))
L.drop(log2, 0.1, 0.12, 0.3)
comp.link(col, root, log2, name="log_jam_log_2")
br, credit2 = L.take(col, root, "dry_branches_medium_01", "1k", scale=1.4)
lay = {"a": (R(90, "X") @ R(60, "Z"), (-0.5, 0.1, 0.2)), "b": (R(20, "Z") @ R(30, "X"), (0.5, -0.1, 0.35)), "c": (R(100, "Z") @ R(-20, "Y"), (0.1, 0.2, 0.5))}
for n, o in br.items():
    k = n[-1]
    L.place(o, lay[k][0])
    L.drop(o, *lay[k][1])
    comp.link(col, root, o, name=f"log_jam_branch_{k}")
wood = comp.mat("canyon_flood_twig", (0.42, 0.36, 0.3), rough=0.9)
rnd = random.Random(21)
tw = []
for k in range(80):
    p = Vector((rnd.uniform(-1.1, 1.1), rnd.uniform(-0.3, 0.35), rnd.uniform(0.15, 0.7)))
    d = Vector((rnd.uniform(-1, 1), rnd.uniform(-0.5, 0.5), rnd.uniform(-0.35, 0.2))).normalized() * rnd.uniform(0.25, 0.8)
    mid = p + d * 0.5 + Vector((0, 0, rnd.uniform(-0.04, 0.04)))
    tw.append(L.twig([p, mid, p + d], rnd.uniform(0.004, 0.013), sides=4))
comp.mesh(col, root, "log_jam_sticks", comp.merge(*tw), wood)
comp.export(col, root, L.PLACE, "log_jam", made="blender/components/canyon/log_jam.py",
            source="https://polyhaven.com/a/dead_quiver_trunk, https://polyhaven.com/a/dry_branches_medium_01; sticks own geometry", license="CC0", credit=f"{credit}; {credit2}",
            notes="its origin is under its middle, not on the floor: it hangs between the walls")
