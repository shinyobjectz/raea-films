# pool/drain: a main drain for the pool's floor, modelled by hand: a domed anti-vortex cover 48 cm across with sixteen
# radial slots and eight screws, on a square stainless frame set in the tiles, the sump dark under it. Its origin is
# the basin's floor under its middle. Two of them stand a metre apart at the deep end. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("drain")
cover_m = comp.mat("pool_drain_cover", (0.88, 0.89, 0.86), rough=0.5)
dark = comp.mat("pool_slot", (0.08, 0.1, 0.11), rough=0.6)
st = steel("pool_steel", 0.25)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
fr = M("drain_frame", comp.merge(comp.box((0.6, 0.05, 0.008), at=(0, 0.275, 0.004)), comp.box((0.6, 0.05, 0.008), at=(0, -0.275, 0.004)), comp.box((0.05, 0.5, 0.008), at=(0.275, 0, 0.004)), comp.box((0.05, 0.5, 0.008), at=(-0.275, 0, 0.004))), st)
comp.bevel(fr, 0.002, 1)
M("drain_sump", comp.box((0.5, 0.5, 0.002), at=(0, 0, 0.002)), dark)
M("drain_cover", turn([(0.0, 0.042), (0.07, 0.04), (0.15, 0.03), (0.21, 0.014), (0.24, 0.006), (0.24, 0.0)], seg=48), cover_m, smooth=True)
slots = []
for i in range(16):
    a = i * 360 / 16
    slots.append(xf(comp.box((0.085, 0.014, 0.004)), R(a, "Z") @ T(0.165, 0, 0.0285) @ R(11, "Y")))
M("drain_slots", comp.merge(*slots), dark)
M("drain_screws", comp.merge(*[xf(comp.cyl(0.008, 0.004, seg=8), R(22.5 + i * 45, "Z") @ T(0.226, 0, 0.008)) for i in range(8)], comp.cyl(0.014, 0.004, at=(0, 0, 0.041), seg=10),
                             *[comp.cyl(0.007, 0.003, at=(sx * 0.275, sy * 0.275, 0.008), seg=6) for sx in (-1, 1) for sy in (-1, 1)]), st)
done(col, root, "drain", source="own geometry (a generic anti-vortex main drain)", notes="origin: on the basin's floor (3.0 m under the deck at the deep end)")
