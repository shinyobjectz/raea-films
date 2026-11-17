# road/treeline: the wall of forest behind the roadside trees, 40 m of it: nine Douglas firs from 19 to 31 m in two
# staggered ranks (the same builder as road/trees, thinner in the bough since they are only ever seen past the front
# rank), sharing one bark and one set of needles. It closes the view either side of the road so no sky shows between
# the trunks. Runs along x, its front toward -y; stand one 14 m off each side of the road, turned to face it.
# Rig: "sway" leans every crown 3 degrees back, as the trees in front of it do.
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp
col, root = comp.fresh("treeline")
mats = _lib.fir_materials("treeline", "1k")
rnd = random.Random(88)
keys = []
for k in range(9):
    x = -18 + 4.5 * k + rnd.uniform(-1.2, 1.2)
    y = (0.0 if k % 2 == 0 else 4.5) + rnd.uniform(-1.0, 1.0)
    h = rnd.uniform(19, 31)
    tiers = _lib.fir(col, root, f"treeline_{k + 1}", h=h, r0=0.016 * h + 0.05, seed=100 + k, crown_from=h * rnd.uniform(0.22, 0.4), tiers=1, dense=0.2, whorl=1.5, mats=mats, at=(x, y, 0), stubs_n=3)
    keys += _lib.sway_keys(tiers, 3.0)
_lib.channel("sway", keys)
_lib.done(col, root, "treeline", source="own geometry; bark: https://polyhaven.com/a/pine_bark; sprigs: https://polyhaven.com/a/fir_tree_01", license="ours; textures CC0", credit="Poly Haven (pine_bark; fir_tree_01, Rico Cilliers)",
          rig={"sway": "every crown leans 3 degrees back about its foot on its trunk"},
          notes="40 m along x, 7 m deep. Background only: a third of the front trees' boughs.")
