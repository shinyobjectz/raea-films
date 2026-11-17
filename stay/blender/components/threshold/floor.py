# threshold/floor: the flags in front of the ruined wall, 6.4 m across and 6 m out from its face, and a sill stone in
# the doorway. Each flag is its own slab (8 cm, worn, a little proud or sunk) with a real joint round it; toward the
# patch's edges more and more of them are missing, so the floor breaks up into the dark instead of ending on a line.
# The wall's front face is at y -0.15 (threshold/wall.py); the flags run from it toward -y. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
from comp import T, R, xf

rnd = random.Random(5)
col, root = comp.fresh("floor")
FLAG = L.stone("threshold_flags", tint=(0.6, 0.57, 0.52), tile=1.2)
GAP, THICK = 0.014, 0.08
Y_WALL, DEPTH, HALF = L.WALL_Y[0], 6.0, 3.2

slabs = []
y = Y_WALL
row = 0
while y > Y_WALL - DEPTH:
    d = rnd.uniform(0.42, 0.72)
    x = -HALF - rnd.uniform(0, 0.4)
    while x < HALF:
        w = rnd.uniform(0.4, 0.92)
        x0, x1, y0, y1 = x, x + w, y - d, y
        x += w
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        # (missing toward the edges: past 2.3 m to either side, and in the last two metres out from the wall)
        edge = max(0.0, (abs(cx) - 2.3) / 0.9, (Y_WALL - 4.0 - cy) / 2.0)
        if rnd.random() < edge * 0.9 + 0.03:
            continue
        bm = comp.box((x1 - x0 - GAP, y1 - y0 - GAP, THICK))
        L.rough(bm, 0.004, seed=len(slabs), scale=5.0)
        tilt = rnd.uniform(-1.2, 1.2) * (1 + edge)
        xf(bm, R(tilt, "X") @ R(rnd.uniform(-1.0, 1.0) * (1 + edge), "Y") @ R(rnd.uniform(-1.5, 1.5) * edge, "Z"))
        xf(bm, T(cx, cy, -THICK / 2 + rnd.uniform(-0.008, 0.006) - 0.02 * edge))
        slabs.append(bm)
    y -= d
    row += 1

# the sill: one long worn stone across the doorway, under the door, through the wall's thickness
sill = comp.box((2.0, L.WALL_Y[1] - L.WALL_Y[0] - 0.02, THICK))
L.rough(sill, 0.003, seed=999, scale=4.0)
xf(sill, T(0, (L.WALL_Y[0] + L.WALL_Y[1]) / 2, -THICK / 2 + 0.004))
slabs.append(sill)

print("flags", len(slabs))
o = comp.mesh(col, root, "floor_flags", comp.merge(*slabs), FLAG)
comp.bevel(o, width=0.01, segments=2, angle=35)
L.finish(o, 1.0)
comp.export(col, root, "threshold", "floor", made="blender/components/threshold/floor.py",
            source="own geometry; stone: https://polyhaven.com/a/worn_rock_natural_01", license="CC0", credit="Poly Haven (texture)",
            notes="the flags' tops at z 0; they run from the wall's face (y -0.15) 6 m toward -y, and break up toward the edges")
