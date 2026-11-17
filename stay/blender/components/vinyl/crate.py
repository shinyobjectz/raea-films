# vinyl/crate: a plastic crate of LPs for the floor under the racks (Poly Haven's plastic_crate_02, CC0), sixty-odd
# sleeves standing in it on edge in twelve inks, a few pulled up, the front one's design showing. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "crate", "plastic_crate_02", res="1k")
rng = random.Random(3)
INK = inks()
stack = []
x = -0.215
first = True
while x < 0.215:
    s = sleeve(rng, art=first or rng.random() < 0.15)
    xf(s, T(x, rng.uniform(-0.012, 0.012), 0.022 + rng.choice((0, 0, 0, 0.01, 0.03))) @ R(rng.uniform(-5, 2), "Y") @ R(-90, "Z"))
    stack.append(s)
    first = False
    x += rng.choice((0.0058, 0.0064, 0.0075))
comp.mesh(col, root, "crate_sleeves", comp.merge(*stack), INK)
done(col, root, "crate", "https://polyhaven.com/a/plastic_crate_02 (the crate); own geometry (the records)", license="CC0", credit=credit)
