# pool/hose: the deck's wash-down hose coiled on its wall bracket (Poly Haven's garden_hose_wall_mounted_01, CC0), with
# a brass bib tap and its pipe that we modelled beside it. Its origin is the wall behind the coil's middle (y 0). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
col, root, parts, credit = comp.ph_component("pool", "hose", "garden_hose_wall_mounted_01", res="1k", origin="back")
brass = comp.mat("pool_brass", (0.72, 0.55, 0.2), rough=0.3, metal=1.0)
cop = comp.mat("pool_pipe", (0.75, 0.76, 0.76), rough=0.35, metal=1.0)
comp.mesh(col, root, "hose_tap", comp.merge(comp.cyl(0.012, 0.07, at=(0.36, -0.07, 0.1), seg=12, axis="Y"), comp.cyl(0.009, 0.05, at=(0.36, -0.06, 0.05), seg=10), comp.cyl(0.02, 0.025, at=(0.36, -0.045, 0.1), seg=6, axis="Y"),
                                           comp.box((0.07, 0.01, 0.012), at=(0.36, -0.045, 0.13)), comp.cyl(0.004, 0.03, at=(0.36, -0.045, 0.1), seg=6)), brass, smooth=False)
comp.mesh(col, root, "hose_pipe", comp.merge(comp.cyl(0.011, 1.0, at=(0.36, -0.011, 0.1), seg=10), *[comp.box((0.05, 0.004, 0.02), at=(0.36, -0.024, z)) for z in (0.4, 0.9)]), cop, smooth=False)
done(col, root, "hose", source="https://polyhaven.com/a/garden_hose_wall_mounted_01; tap and pipe our own geometry", license="CC0; tap ours", credit=credit)
