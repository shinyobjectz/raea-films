# pool/lane-rope: one 20 m lane rope, modelled by hand at real size: 160 ribbed floats 11 cm across on a steel cable,
# red for the 4 m at each end and blue and white in fours between, in ten 2 m runs, with a hook and a cup anchor at
# each end wall. Its origin is the pool's centre at deck level (as pool/pool); it runs the pool's length along y with
# its floats half in the water. Three of them (x -2, 0, 2) make four lanes.
# Rig: "spin" rolls every float one whole turn about the cable; "bob" lifts and drops alternate runs 3.5 cm (a wave
# passing down the rope).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("lane_rope")
red = comp.mat("pool_float_red", (0.8, 0.07, 0.05), rough=0.4)
blue = comp.mat("pool_float_blue", (0.04, 0.2, 0.7), rough=0.4)
white = comp.mat("pool_float_white", (0.9, 0.9, 0.88), rough=0.4)
st = steel("pool_steel", 0.25)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
Z = WATER + 0.012
RUNS, PER = 10, 16
RUN = 19.5 / RUNS
PITCH = RUN / PER
FW = PITCH - 0.01
PROF = [(0.011, 0.0), (0.03, 0.002), (0.052, 0.01), (0.056, 0.018), (0.056, 0.03), (0.044, 0.036), (0.044, FW - 0.036), (0.056, FW - 0.03), (0.056, FW - 0.018), (0.052, FW - 0.01), (0.03, FW - 0.002), (0.011, FW)]
runs = []
for r in range(RUNS):
    y0 = -9.75 + r * RUN
    p = comp.pivot(col, root, f"lane_rope_run_{r + 1:02d}", (0, y0 + RUN / 2, Z))
    groups = {}
    for i in range(PER):
        k = r * PER + i
        m = "red" if (r < 2 or r >= RUNS - 2) else ("blue" if (k // 4) % 2 == 0 else "white")
        f = turn(PROF, seg=14, axis="Y", at=(0, y0 + i * PITCH + 0.005, Z))
        # six fins round the float's waist
        fins = [xf(comp.box((0.004, FW - 0.075, 0.012)), T(0, y0 + i * PITCH + 0.005 + FW / 2, Z) @ R(a, "Y") @ T(0, 0, 0.049)) for a in range(0, 360, 60)]
        groups.setdefault(m, []).extend([f] + fins)
    for m, bms in groups.items():
        M(f"lane_rope_run_{r + 1:02d}_{m}", comp.merge(*bms), {"red": red, "blue": blue, "white": white}[m], parent=p, smooth=False)
    runs.append(p)
M("lane_rope_cable", comp.cyl(0.003, 19.94, at=(0, -9.97, Z), seg=8, axis="Y"), st)
ends = []
for s in (-1, 1):
    ends.append(turn([(0.0, 0.0), (0.04, 0.0), (0.04, 0.008), (0.022, 0.012), (0.02, 0.03), (0.0, 0.03)], seg=20, axis="Y", at=(0, s * 10.0 - (0.03 if s > 0 else 0.0), Z)))
    ends.append(pipe(bend([(0, s * 9.97, Z), (0, s * 9.93, Z + 0.02), (0, s * 9.89, Z), (0, s * 9.93, Z - 0.02), (0, s * 9.965, Z - 0.008)], 0.015, 3), 0.004))
    ends.append(comp.cyl(0.009, 0.07, at=(0, s * 9.86 - 0.035, Z), seg=10, axis="Y"))
M("lane_rope_ends", comp.merge(*ends), st, smooth=True)
comp.channel("spin", [(p, "rotation_euler", 1, 0, 2 * math.pi) for p in runs])
comp.channel("bob", [(p, "location", 2, p.location.z, p.location.z + (0.035 if i % 2 == 0 else -0.035)) for i, p in enumerate(runs)])
done(col, root, "lane_rope", source="own geometry (a generic racing lane rope)",
     rig={"spin": "every float rolls one whole turn about the cable", "bob": "alternate 2 m runs rise and drop 3.5 cm"},
     notes="origin: the pool's centre at deck level, as pool/pool; the floats ride at the water line (-0.14 m)")
