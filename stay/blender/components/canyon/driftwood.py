# canyon/driftwood: flood wood left in the slot: a bleached 3 m trunk (Poly Haven's dead_tree_trunk, CC0, at a third
# of its triangles) with three dry branches piled across and under its upstream end (dry_branches_medium_01, CC0) and
# a rack of small sticks packed against them, those modelled by hand. Lies on the sand, caught against a boulder.
# No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("driftwood")
tr, credit = L.take(col, root, "dead_tree_trunk", "1k")
trunk = next(iter(tr.values()))
L.decimate(trunk, 0.3)
L.tint(trunk.data.materials[0], (1.0, 0.95, 0.88))
L.place(trunk, R(-7, "Y"))          # its upstream end propped up on the pile
L.drop(trunk, 0, 0, 0.0)
comp.link(col, root, trunk, name="driftwood_trunk")
br, credit2 = L.take(col, root, "dry_branches_medium_01", "1k", scale=1.25)
lay = {"a": (R(80, "Z"), (-1.1, 0.1, 0.0)), "b": (R(35, "Z") @ R(18, "X"), (-0.75, -0.3, 0.08)), "c": (R(-50, "Z") @ R(-12, "Y"), (-1.3, 0.25, 0.1))}
for n, o in br.items():
    k = n[-1]
    L.place(o, lay[k][0])
    L.drop(o, *lay[k][1])
    comp.link(col, root, o, name=f"driftwood_branch_{k}")
wood = comp.mat("canyon_flood_twig", (0.42, 0.36, 0.3), rough=0.9)
rnd = random.Random(9)
tw = []
for k in range(70):
    a = Vector((rnd.uniform(-1.6, -0.4), rnd.uniform(-0.45, 0.45), rnd.uniform(0.01, 0.2)))
    d = Vector((rnd.uniform(-0.5, 0.5), rnd.uniform(-1, 1), rnd.uniform(-0.1, 0.16))).normalized() * rnd.uniform(0.2, 0.75)
    b = a + d
    b.z = max(0.01, b.z)
    mid = (a + b) / 2 + Vector((rnd.uniform(-0.03, 0.03), 0, rnd.uniform(-0.01, 0.05)))
    tw.append(L.twig([a, mid, b], rnd.uniform(0.004, 0.014), sides=4))
comp.mesh(col, root, "driftwood_sticks", comp.merge(*tw), wood)
comp.export(col, root, L.PLACE, "driftwood", made="blender/components/canyon/driftwood.py",
            source="https://polyhaven.com/a/dead_tree_trunk, https://polyhaven.com/a/dry_branches_medium_01; sticks own geometry", license="CC0", credit=f"{credit}; {credit2}")
