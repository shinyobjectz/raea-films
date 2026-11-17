# cathedral/pew: an oak pew 1.8 m long (three sittings), modelled by hand: two shaped ends with a carved trefoil and a rounded top, a seat
# board on bearers, a raked boarded back with a capping rail, a book ledge behind with four hymn books on it, a red
# velvet runner cushion, and a kneeler hinged under the ledge for the row behind. The sitter faces -y.
# Rig: "kneeler" swings the kneeler down from folded against the pew's back to level, 15 cm off the floor.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("pew")
oak = L.oak()
velvet = L.velvet()
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W = 1.8
K = W / 3.0
# the ends: a profile in depth (x here, turned to y) and height
prof = [(-0.3, 0.0), (0.3, 0.0), (0.3, 0.9), (0.27, 1.0), (0.2, 1.07), (0.1, 1.085), (0.0, 1.03), (-0.05, 0.9), (-0.12, 0.74), (-0.24, 0.7), (-0.3, 0.64)]
for s in (-1, 1):
    e = L.plate([prof], 0.055)
    xf(e, R(90, "Z"))
    xf(e, T(s * W / 2 - (0.0275 if s > 0 else -0.0275) - 0.0275, 0, 0))
    eo = M(f"pew_end_{'lr'[s > 0]}", e, oak)
    comp.bevel(eo, 0.008, 2)
    L.finish(eo, 1.0)
    t = comp.merge(*[xf(xf(comp.cyl(r, 0.006, seg=16, axis="X"), T(0, 0.05 + d * math.cos(math.radians(a)), 0.5 + d * math.sin(math.radians(a)))), T(s * (W / 2 + 0.001) - (0.006 if s > 0 else 0), 0, 0)) for a, r, d in ((90, 0.05, 0.055), (210, 0.05, 0.055), (330, 0.05, 0.055))])
    M(f"pew_trefoil_{'lr'[s > 0]}", t, comp.mat("cathedral_oak_dark", (0.03, 0.02, 0.012), rough=0.7))
IN = W - 0.11
seat = M("pew_seat", comp.merge(comp.box((IN, 0.4, 0.035), at=(0, -0.06, 0.445)), comp.box((IN, 0.035, 0.09), at=(0, -0.24, 0.39)), comp.box((0.05, 0.36, 0.4), at=(0, -0.05, 0.2))), oak)
comp.bevel(seat, 0.006, 2)
L.finish(seat, 1.0)
back = comp.merge(*[comp.box((IN / 12 - 0.004, 0.022, 0.56), at=(-IN / 2 + IN / 24 + i * IN / 12, 0, 0.28)) for i in range(12)])
back = comp.merge(back, comp.box((IN, 0.05, 0.05), at=(0, 0, 0.585)), comp.box((IN, 0.04, 0.06), at=(0, 0, 0.03)))
xf(back, R(-9, "X"))
xf(back, T(0, 0.13, 0.45))
bo = M("pew_back", back, oak)
comp.bevel(bo, 0.004, 1)
L.finish(bo, 1.0)
led = M("pew_book_ledge", comp.merge(comp.box((IN, 0.14, 0.022), at=(0, 0.29, 0.74)), comp.box((IN, 0.018, 0.05), at=(0, 0.355, 0.765)), comp.box((IN, 0.03, 0.5), at=(0, 0.285, 0.26))), oak)
L.finish(led, 1.0)
random.seed(4)
books = []
for i, x in enumerate((-1.15, -0.4, 0.45, 1.2)):
    c = random.choice(((0.3, 0.03, 0.04), (0.04, 0.08, 0.25), (0.05, 0.18, 0.08), (0.08, 0.06, 0.05)))
    turn = random.uniform(-12, 12)
    place = lambda bm: xf(xf(bm, R(turn, "Z")), T(x * K, 0.285, 0.751))
    o = M(f"pew_hymn_book_{i + 1}", place(comp.box((0.12, 0.17, 0.03), at=(0, 0, 0.015))), comp.mat(f"pew_book_{i % 4}", c, rough=0.6))
    comp.bevel(o, 0.004, 2)
    M(f"pew_hymn_book_{i + 1}_pages", place(comp.box((0.11, 0.172, 0.022), at=(0.007, 0, 0.015))), comp.mat("pew_pages", (0.85, 0.8, 0.68), rough=0.8))
cu = M("pew_cushion", comp.box((IN - 0.04, 0.36, 0.04), at=(0, -0.06, 0.482)), velvet, smooth=True)
comp.bevel(cu, 0.015, 3)
L.finish(cu, 1.0)
# the kneeler: hinged 15 cm up behind the pew, folded up at rest
HY, HZ = 0.31, 0.15
kn = comp.pivot(col, root, "pew_kneeler", (0, HY, HZ))
kb = M("pew_kneeler_board", comp.merge(comp.box((IN - 0.3, 0.03, 0.2), at=(0, HY + 0.015, HZ + 0.1)), comp.box((0.04, 0.03, 0.15), at=(-1.2 * K, HY + 0.045, HZ + 0.19)), comp.box((0.04, 0.03, 0.15), at=(1.2 * K, HY + 0.045, HZ + 0.19))), oak, parent=kn)
L.finish(kb, 1.0)
kp = M("pew_kneeler_pad", comp.box((IN - 0.34, 0.04, 0.17), at=(0, HY - 0.02, HZ + 0.105)), velvet, parent=kn, smooth=True)
comp.bevel(kp, 0.014, 3)
L.finish(kp, 1.0)
M("pew_kneeler_hinges", comp.merge(*[comp.cyl(0.012, 0.08, at=(x, HY, HZ), seg=10, axis="X") for x in (-1.25 * K, -0.04, 1.17 * K)]), L.iron_mat())
L.channel("kneeler", [(kn, "rotation_euler", 0, 0, math.radians(-90))])
comp.export(col, root, "cathedral", "pew", made="blender/components/cathedral/pew.py",
            source="own geometry (a Victorian oak pew); oak: https://polyhaven.com/a/dark_wood; velvet: https://polyhaven.com/a/velour_velvet", license="ours; textures CC0", credit="Poly Haven (dark_wood, velour_velvet)",
            rig={"kneeler": "the kneeler behind the pew (pew_kneeler) folds down 90 degrees about its hinge, from upright to level"})
