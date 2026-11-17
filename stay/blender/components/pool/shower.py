# pool/shower: a poolside rinse shower, modelled by hand at real size: a 90 mm stainless column 2.2 m high bolted to
# the deck, bent over to a rose that points down 42 cm in front of it, a push-button valve at 1.15 m, a foot-wash
# spout at 0.4 m, and a round tiled-in floor drain under the rose. Its front faces -y. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("shower")
st = steel("pool_steel", 0.18)
chrome = comp.mat("pool_chrome", (0.9, 0.9, 0.92), rough=0.06, metal=1.0)
dark = comp.mat("pool_slot", (0.08, 0.1, 0.11), rough=0.6)
red = comp.mat("pool_shower_button", (0.8, 0.08, 0.05), rough=0.4)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
M("shower_column", pipe(bend([(0, 0, 0), (0, 0, 2.2), (0, -0.42, 2.2), (0, -0.42, 2.1)], 0.16, 8), 0.045, sides=5), st, smooth=True)
M("shower_flange", comp.merge(turn([(0.045, 0.0), (0.11, 0.0), (0.11, 0.01), (0.06, 0.03), (0.045, 0.03)], seg=32), *[xf(comp.cyl(0.009, 0.008, seg=6), R(45 + i * 90, "Z") @ T(0.088, 0, 0.01)) for i in range(4)]), st, smooth=False)
M("shower_rose", turn([(0.02, 0.0), (0.03, -0.02), (0.085, -0.045), (0.09, -0.055), (0.0, -0.055)], seg=32, at=(0, -0.42, 2.1)), chrome, smooth=True)
M("shower_rose_holes", comp.merge(*[comp.cyl(0.004, 0.001, at=(0.03 * k * math.cos(a), -0.42 + 0.03 * k * math.sin(a), 2.044), seg=6) for k in (1, 2) for a in [i * math.pi / (3 * k) for i in range(6 * k)]]), dark)
M("shower_valve", comp.merge(turn([(0.0, 0.0), (0.04, 0.0), (0.04, 0.02), (0.03, 0.03), (0.0, 0.03)], seg=24, axis="Y", at=(0, -0.073, 1.15)), comp.cyl(0.012, 0.11, at=(0, -0.04, 0.4), seg=12, axis="Y"),
                             comp.cyl(0.012, 0.04, at=(0, -0.14, 0.36), seg=12)), chrome, smooth=True)
M("shower_button", xf(comp.cyl(0.024, 0.012, seg=20, axis="Y"), T(0, -0.085, 1.15)), red, smooth=True)
M("shower_drain", comp.merge(turn([(0.0, 0.0), (0.085, 0.0), (0.085, 0.004), (0.0, 0.004)], seg=28, at=(0, -0.42, 0)), turn([(0.085, 0.0), (0.1, 0.0), (0.1, 0.006), (0.085, 0.006)], seg=28, at=(0, -0.42, 0))), st)
M("shower_drain_holes", comp.merge(*[comp.cyl(0.007, 0.001, at=(0.025 * k * math.cos(a), -0.42 + 0.025 * k * math.sin(a), 0.004), seg=6) for k in (1, 2, 3) for a in [i * math.pi / (3 * k) for i in range(6 * k)]]), dark)
done(col, root, "shower", source="own geometry (a generic poolside rinse shower)", rig={"position": "the Model's own position on the deck"})
