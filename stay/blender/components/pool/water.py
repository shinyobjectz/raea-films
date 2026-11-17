# pool/water: the pool's water, an 8 x 20 m surface with a slow chop modelled into it, standing 15 cm under the coping
# (its origin is the pool's centre at deck level, the same as pool/pool). The match cut lands on its line against the
# far wall. Rig: "level" drops the surface 40 cm (the upside-down cooler's glug, the same line going down); "slosh"
# tilts it 1 degree about the pool's length (the cooler's slosh); "ripple" spreads six rings from a point in the
# near right lane out to 2.4 m, flattening as they go (the cursor's touch).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("water")
water_m = comp.mat("pool_water", (0.2, 0.55, 0.66), rough=0.04, alpha=0.6)
ring_m = comp.mat("pool_water_ripple", (0.42, 0.74, 0.82), rough=0.02, alpha=0.4)
level = comp.pivot(col, root, "water_level", (0, 0, WATER))
slosh = comp.pivot(col, root, "water_slosh", (0, 0, WATER), parent=level)
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=64, y_segments=160, size=0.5)
xf(bm, S(POOL_W - 0.01, POOL_L - 0.01, 1))
for v in bm.verts:
    x, y = v.co.x, v.co.y
    edge = min(1.0, (POOL_W / 2 - abs(x)) / 0.4, (POOL_L / 2 - abs(y)) / 0.4)
    v.co.z = WATER + edge * (0.009 * math.sin(1.7 * x + 0.9 * y) + 0.007 * math.sin(-0.8 * x + 2.3 * y + 1.0) + 0.004 * math.sin(3.1 * x - 2.9 * y + 2.0) + 0.003 * math.sin(5.3 * x + 4.1 * y))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
if sum(f.normal.z for f in bm.faces) < 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
comp.mesh(col, root, "water_surface", bm, water_m, parent=slosh, smooth=True)
# the ripple: six rings about a point, each a low smooth swell
RX, RY = 1.6, -5.5
rp = comp.pivot(col, root, "water_ripple", (RX, RY, WATER + 0.004), parent=slosh)
rings = []
for i, r in enumerate((0.4, 0.8, 1.2, 1.6, 2.0, 2.4)):
    h, w = 0.03 - i * 0.003, 0.15
    prof = [(r - w / 2 + w * k / 8, h * math.sin(math.pi * k / 8) ** 2) for k in range(9)]
    rings.append(turn(prof, seg=72, at=(RX, RY, WATER + 0.004)))
comp.mesh(col, root, "water_ripple_rings", comp.merge(*rings), ring_m, parent=rp, smooth=True)
rp.scale = (0.02, 0.02, 1.0)
comp.channel("level", [(level, "location", 2, level.location.z, level.location.z - 0.4)])
comp.channel("slosh", [(slosh, "rotation_euler", 1, 0, math.radians(1.0))])
comp.channel("ripple", [(rp, "scale", 0, 0.02, 1.0), (rp, "scale", 1, 0.02, 1.0), (rp, "scale", 2, 1.0, 0.25)])
done(col, root, "water", source="own geometry (a pool's water surface)",
     rig={"level": "the surface drops 40 cm down the basin's walls", "slosh": "the surface tilts 1 degree about the pool's length (7 cm at each side)",
          "ripple": "six rings spread from a point in the near right lane to 2.4 m and flatten",
          "colour": "in the scene: the material pool_water"},
     notes="origin: the pool's centre at deck level, as pool/pool; the surface is at -0.15 m.")
