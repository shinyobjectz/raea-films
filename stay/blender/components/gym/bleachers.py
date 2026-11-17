# gym/bleachers: a bank of telescopic bleachers folded against the wall ("folded bleachers"), 6 m wide, eight rows,
# modelled by hand: each row a steel deck and riser on its own wheeled frame with a varnished maple seat board and a
# front skirt, nested under the row above; end rails; the row numbers' plate on the bottom skirt. Folded it is 1.1 m
# deep and 2.3 m tall. Its back at y 0, standing on the floor, facing -y.
# Rig: "open" rolls the rows out, the bottom row furthest (4.2 m), each row 60 cm further than the one above it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, rod, T, R, S, xf

col, root = comp.fresh("bleachers")
M = _lib.maker(col, root)
W, N, RISE, RUN = 6.0, 8, 0.26, 0.6
wood = comp.ph_texture("bleachers_wood", "plank_flooring_02", tile=1.98, res="1k")
steel = comp.mat("bleachers_steel", (0.3, 0.31, 0.33), rough=0.45, metal=1.0)
skirt = comp.mat("bleachers_skirt", (0.03, 0.2, 0.11), rough=0.45)
rubber = comp.mat("bleachers_wheels", (0.02, 0.02, 0.02), rough=0.8)
FRONT = -1.05
rows, keys = [], []
for i in range(N):
    z = (i + 1) * RISE                     # this row's deck height
    y0 = FRONT + i * 0.035                 # each row's skirt sits a little behind the one below
    p = comp.pivot(col, root, f"bleachers_row_{i + 1}", (0, y0, 0))
    sk = M(f"bleachers_row_{i + 1}_skirt", comp.box((W, 0.02, RISE - 0.05), at=(0, y0 + 0.01, z - RISE + (RISE - 0.05) / 2 + 0.005)), skirt, parent=p, smooth=False)
    seat = M(f"bleachers_row_{i + 1}_seat", rbox((W - 0.02, 0.25, 0.04), at=(0, y0 + 0.115, z + 0.02 - 0.045), r=0.008, seg=2), wood, parent=p, smooth=False)
    comp.uv_box(seat, 1.0)
    fr = [comp.box((W, RUN + 0.3, 0.025), at=(0, y0 + 0.02 + (RUN + 0.3) / 2, z - 0.06))]     # the deck
    for x in (-W / 2 + 0.05, -W / 6, W / 6, W / 2 - 0.05):
        xx = x + (i - N / 2) * 0.012   # the frames nest side by side
        fr.append(comp.box((0.03, 0.04, z - 0.1), at=(xx, y0 + 0.08, (z - 0.1) / 2 + 0.04)))
        fr.append(comp.box((0.03, 0.9, 0.04), at=(xx, y0 + 0.45, 0.06)))
    M(f"bleachers_row_{i + 1}_frame", comp.merge(*fr), steel, parent=p, smooth=False)
    M(f"bleachers_row_{i + 1}_wheels", comp.merge(*[comp.cyl(0.04, 0.03, at=(x + (i - N / 2) * 0.012 - 0.015, y0 + yy, 0.04), seg=14, axis="X") for x in (-W / 2 + 0.05, -W / 6, W / 6, W / 2 - 0.05) for yy in (0.1, 0.8)]), rubber, parent=p)
    keys.append((p, "location", 1, p.location.y, p.location.y - (N - 1 - i) * RUN))
# what stays: the back frame against the wall and the end rails
back = [comp.box((W, 0.05, N * RISE + 0.1), at=(0, -0.025, (N * RISE + 0.1) / 2))]
back += [comp.box((0.04, 1.0, 0.04), at=(sx * (W / 2 + 0.03), -0.5, N * RISE + 0.2)) for sx in (-1, 1)]
back += [comp.box((0.04, 0.04, N * RISE + 0.2), at=(sx * (W / 2 + 0.03), y, (N * RISE + 0.2) / 2)) for sx in (-1, 1) for y in (-0.03, -0.98)]
back += [comp.box((0.04, 1.0, 0.04), at=(sx * (W / 2 + 0.03), -0.5, N * RISE * 0.55)) for sx in (-1, 1)]
M("bleachers_back", comp.merge(*back), steel, smooth=False)
plate = comp.text("ROWS 1-8", 0.07, depth=0.002)
xf(plate, T(W / 2 - 0.5, FRONT - 0.001, RISE * 0.5))
M("bleachers_plate", plate, comp.mat("bleachers_plate", (0.9, 0.88, 0.8), rough=0.5), smooth=False)
comp.channel("open", keys[:-1])
comp.export(col, root, "gym", "bleachers", made="blender/components/gym/bleachers.py",
            source="own geometry (generic telescopic bleachers); seat boards: https://polyhaven.com/a/plank_flooring_02", license="ours; texture CC0", credit="Poly Haven (plank_flooring_02)",
            rig={"open": "the rows roll out from the wall, the bottom row 4.2 m and each row above it 60 cm less (the top row stays)"})
