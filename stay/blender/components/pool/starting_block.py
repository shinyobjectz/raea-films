# pool/starting-block: a racing starting block, modelled by hand at real size: a stainless pedestal on a bolted base
# plate, a white platform 50 x 62 cm tipped 9 degrees toward the water with a blue grit top, 70 cm over the water, a
# backstroke grip bar under its front lip, a rear step, and a blank lane plate each side. Its origin is the deck
# under the pedestal; the water is toward -y and the pool's edge belongs 0.45 m in front. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("starting_block")
st = steel("pool_steel", 0.2)
white = comp.mat("pool_block_body", (0.9, 0.9, 0.88), rough=0.45)
grit = comp.mat("pool_block_grit", (0.05, 0.22, 0.6), rough=0.95)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
b = M("starting_block_base", comp.merge(comp.box((0.42, 0.42, 0.014), at=(0, 0, 0.007)), comp.box((0.16, 0.22, 0.47), at=(0, 0, 0.014 + 0.235)), comp.box((0.3, 0.34, 0.012), at=(0, 0, 0.49))), st)
comp.bevel(b, 0.006, 2)
M("starting_block_bolts", comp.merge(*[comp.cyl(0.012, 0.012, at=(sx * 0.16, sy * 0.16, 0.014), seg=6) for sx in (-1, 1) for sy in (-1, 1)]), st)
TILT = T(0, -0.08, 0.545) @ R(9, "X")
p = M("starting_block_platform", xf(comp.box((0.5, 0.62, 0.075)), TILT), white)
comp.bevel(p, 0.014, 3)
M("starting_block_grit", xf(comp.merge(comp.box((0.45, 0.57, 0.005), at=(0, 0, 0.04)), *[comp.box((0.45, 0.012, 0.004), at=(0, -0.26 + i * 0.065, 0.044)) for i in range(9)]), TILT), grit)
grip = pipe(bend([(-0.2, -0.33, 0.47), (-0.2, -0.43, 0.36), (0.2, -0.43, 0.36), (0.2, -0.33, 0.47)], 0.05, 5), 0.014)
step = [rod((sx * 0.12, 0.1, 0.27), (sx * 0.12, 0.36, 0.27), 0.012) for sx in (-1, 1)]
M("starting_block_grip", comp.merge(grip, *step), st, smooth=True)
s = M("starting_block_step", comp.merge(comp.box((0.4, 0.14, 0.025), at=(0, 0.36, 0.285)), *[comp.box((0.36, 0.01, 0.004), at=(0, 0.32 + i * 0.04, 0.2995)) for i in range(3)]), white)
comp.bevel(s, 0.004, 2)
pl = M("starting_block_plates", comp.merge(*[comp.box((0.004, 0.16, 0.16), at=(sx * 0.083, 0, 0.3)) for sx in (-1, 1)]), white)
M("starting_block_plate_bands", comp.merge(*[comp.box((0.002, 0.16, 0.03), at=(sx * 0.0855, 0, 0.36)) for sx in (-1, 1)]), grit)
done(col, root, "starting_block", source="own geometry (a generic racing starting block)", rig={"lane number": "in the scene: the side plates are blank"},
     notes="origin: the deck under the pedestal; the platform's front lip overhangs 0.38 m toward -y")
