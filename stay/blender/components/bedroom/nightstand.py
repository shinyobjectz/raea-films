# bedroom/nightstand: the bedside table at the bed's head (Poly Haven's painted_wooden_nightstand, CC0), with a
# paperback, a glass of water and a torch for reading under the covers on it (hand-made). Rig: "drawer" pulls its drawer
# out 0.2 m.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root, parts, credit = comp.ph_component(_lib.PLACE, "nightstand", "painted_wooden_nightstand", res="1k", origin="floor")
lo, hi = comp.box_of(list(parts.values()))
print("nightstand", list(parts), lo, hi)
M = _lib.maker(col, root)
Z = hi.z
bk = M("nightstand_book", xf(comp.merge(comp.box((0.11, 0.175, 0.022), at=(0, 0, 0.011))), T(-0.1, -0.05, Z) @ R(15, "Z")), comp.mat("nightstand_book", (0.15, 0.4, 0.3), rough=0.5))
comp.bevel(bk, 0.0015, 1)
M("nightstand_book_pages", xf(comp.box((0.104, 0.17, 0.016), at=(0.004, 0, 0.011)), T(-0.1, -0.05, Z) @ R(15, "Z")), comp.mat("nightstand_pages", (0.9, 0.87, 0.78), rough=0.8))
gl = _lib.turn([(0.0, 0.0), (0.03, 0.0), (0.035, 0.11), (0.033, 0.11), (0.028, 0.006), (0.0, 0.006)], seg=24)
M("nightstand_glass", xf(gl, T(0.12, 0.08, Z)), comp.mat("nightstand_glass", (0.85, 0.93, 0.95), rough=0.03, alpha=0.2), smooth=True)
M("nightstand_water", xf(comp.cyl(0.028, 0.07, seg=24, r2=0.031), T(0.12, 0.08, Z + 0.007)), comp.mat("nightstand_water", (0.7, 0.85, 0.95), rough=0.02, alpha=0.3), smooth=True)
tc = _lib.turn([(0.0, 0.0), (0.014, 0.0), (0.015, 0.004), (0.015, 0.11), (0.024, 0.13), (0.024, 0.15), (0.0, 0.15)], seg=20)
M("nightstand_torch", xf(tc, T(0.1, -0.12, Z + 0.015) @ R(100, "Z") @ R(90, "X")), comp.mat("nightstand_torch", (0.85, 0.7, 0.05), rough=0.35), smooth=True)
rig = {}
dr = [o for n, o in parts.items() if "drawer" in n.lower()]
if dr:
    comp.channel("drawer", [(d, "location", 1, d.location.y, d.location.y - 0.2) for d in dr])
    rig["drawer"] = "the drawer out 0.2 m toward the front"
comp.export(col, root, _lib.PLACE, "nightstand", made="blender/components/bedroom/nightstand.py",
            source="https://polyhaven.com/a/painted_wooden_nightstand; the book, glass and torch are own geometry", license="CC0; ours", credit=credit, rig=rig)
