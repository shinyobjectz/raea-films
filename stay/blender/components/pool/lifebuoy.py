# pool/lifebuoy: a ring buoy on the wall (Poly Haven's lifebuoy, CC0), hung on a steel peg before a white backboard
# with a red border that we modelled, with its throw line. Its origin is the board's middle against the wall (y 0).
# Rig: "swing" swings the ring 14 degrees on its peg (knocked, or the generator's shudder).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component("pool", "lifebuoy", "lifebuoy", res="1k", origin="back")
ring = list(parts.values())
for o in ring:
    o.location.y -= 0.045
bpy.context.view_layer.update()
lo, hi = comp.box_of(ring)
cz = hi.z - 0.39                 # the ring is 0.78 m across; its rope hangs below it
peg_z = cz + 0.2
board = comp.mesh(col, root, "lifebuoy_board", comp.box((0.95, 0.018, 0.95), at=(0, -0.009, cz)), comp.mat("pool_buoy_board", (0.92, 0.92, 0.9), rough=0.5))
comp.bevel(board, 0.004, 2)
red = comp.mat("pool_buoy_border", (0.8, 0.07, 0.05), rough=0.5)
comp.mesh(col, root, "lifebuoy_border", comp.merge(comp.box((0.95, 0.002, 0.04), at=(0, -0.019, cz + 0.455)), comp.box((0.95, 0.002, 0.04), at=(0, -0.019, cz - 0.455)),
                                                    comp.box((0.04, 0.002, 0.95), at=(0.455, -0.019, cz)), comp.box((0.04, 0.002, 0.95), at=(-0.455, -0.019, cz))), red)
comp.mesh(col, root, "lifebuoy_peg", comp.merge(comp.cyl(0.012, 0.2, at=(0, -0.2, peg_z + 0.012), seg=12, axis="Y"), comp.cyl(0.02, 0.008, at=(0, -0.208, peg_z + 0.012), seg=12, axis="Y"),
                                                 comp.cyl(0.03, 0.006, at=(0, -0.024, peg_z + 0.012), seg=16, axis="Y")), steel("pool_steel", 0.25), smooth=True)
sw = comp.hang(col, root, ring, "lifebuoy_swing", at=(0, (lo.y + hi.y) / 2, peg_z))
comp.channel("swing", [(sw, "rotation_euler", 1, 0, math.radians(14))])
done(col, root, "lifebuoy", source="https://polyhaven.com/a/lifebuoy; backboard and peg our own geometry", license="CC0; board ours", credit=credit,
     rig={"swing": "the ring swings 14 degrees about its peg"}, notes="origin: the backboard's middle against the wall")
