# observatory/ladder: the observer's rolling steps, modelled by hand: a five-tread oak stair on two stringers up to a
# 60 x 55 cm platform 1.25 m high, turned posts and a handrail on both sides and round the platform's back, diagonal
# braces, a brass kick strip on each tread, and four iron casters in forks. The origin is the middle of its foot; you
# climb toward +y (it faces the telescope's eyepiece).
# Rig: "roll" rolls it 1.2 m along x, its casters turning; "brake" drops the two brake feet 4 cm to the floor.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rod, rbox, pipe, fillet, T, R, S, xf

col, root = comp.fresh("ladder")
M = _lib.maker(col, root)
oak = comp.ph_texture("ladder_oak", "oak_veneer_01", tile=1.2, res="1k", tint=(0.72, 0.6, 0.48))
brass = comp.mat("ladder_brass", (0.72, 0.55, 0.22), rough=0.3, metal=1.0)
iron = comp.mat("ladder_iron", (0.06, 0.06, 0.065), rough=0.45, metal=0.8)
rubber = comp.mat("ladder_tyre", (0.03, 0.03, 0.03), rough=0.8)
roll = comp.pivot(col, root, "ladder_roll", (0, 0, 0))
W, PH, N = 0.6, 1.25, 5                         # width, the platform's height, treads below it
RISE, GO = PH / (N + 1), 0.24
Y0 = -0.75                                      # the first tread's nose
YP = Y0 + N * GO                                # the platform's front edge
PD = 0.55
wood = []
for sx in (-1, 1):                              # stringers, the platform's legs, braces
    x = sx * (W / 2 + 0.02)
    wood.append(comp.taper((x, Y0 - 0.1, 0.12 + 0.2), (x, YP + 0.02, PH + 0.06), 0.035, 0.035, 0.2, 0.2))
    wood += [comp.box((0.05, 0.05, PH - 0.1), at=(x, y, 0.1 + (PH - 0.1) / 2)) for y in (YP + 0.04, YP + PD - 0.03)]
    wood.append(comp.box((0.035, PD + 0.3, 0.06), at=(x, YP + PD / 2 - 0.15, 0.2)))
    wood.append(comp.box((0.035, (YP - Y0) + PD, 0.07), at=(x, (Y0 + YP + PD) / 2 - 0.02, 0.135)))
    wood.append(comp.taper((x, YP + 0.06, 0.24 + 0.05), (x, YP + PD - 0.04, PH - 0.1), 0.025, 0.025, 0.05, 0.05))
wood.append(comp.box((W + 0.04, 0.035, 0.07), at=(0, YP + PD - 0.03, 0.2)))
wood.append(comp.box((W + 0.04, 0.035, 0.07), at=(0, Y0 - 0.06, 0.135)))
for i in range(N):
    wood.append(rbox((W + 0.005, GO + 0.03, 0.032), at=(0, Y0 + i * GO + GO / 2, (i + 1) * RISE - 0.016), r=0.006, seg=2))
wood.append(rbox((W + 0.08, PD, 0.035), at=(0, YP + PD / 2, PH - 0.0175), r=0.006, seg=2))
posts = [(sx * (W / 2 + 0.02), Y0 + 0.02, RISE * 0.6) for sx in (-1, 1)] + [(sx * (W / 2 + 0.02), y, PH) for sx in (-1, 1) for y in (YP + 0.04, YP + PD - 0.03)]
for x, y, z in posts:
    top = z + 0.92
    wood.append(_lib.lathe([(0.022, z), (0.022, z + 0.2), (0.028, z + 0.23), (0.018, z + 0.28), (0.02, top - 0.12), (0.028, top - 0.08), (0.02, top - 0.04), (0.024, top)], seg=12, at=(x, y, 0)))
w = M("ladder_frame", comp.merge(*wood), oak, parent=roll, smooth=False)
comp.uv_box(w, 1.0)
rails = []
for sx in (-1, 1):
    x = sx * (W / 2 + 0.02)
    rails.append(pipe(fillet([(x, Y0 + 0.02, RISE * 0.6 + 0.93), (x, YP + 0.04, PH + 0.93), (x, YP + PD - 0.03, PH + 0.93)], 0.1, n=5), 0.022, sides=3))
    rails.append(pipe([(x, YP + 0.04, PH + 0.48), (x, YP + PD - 0.03, PH + 0.48)], 0.014, sides=2))
rails.append(pipe([(-W / 2 - 0.02, YP + PD - 0.03, PH + 0.93), (W / 2 + 0.02, YP + PD - 0.03, PH + 0.93)], 0.022, sides=3))
rails.append(pipe([(-W / 2 - 0.02, YP + PD - 0.03, PH + 0.48), (W / 2 + 0.02, YP + PD - 0.03, PH + 0.48)], 0.014, sides=2))
r = M("ladder_rails", comp.merge(*rails), oak, parent=roll)
comp.uv_box(r, 1.0)
M("ladder_kick_strips", comp.merge(*[comp.box((W, 0.02, 0.003), at=(0, Y0 + i * GO + 0.012, (i + 1) * RISE + 0.001)) for i in range(N)], comp.box((W + 0.07, 0.02, 0.003), at=(0, YP + 0.012, PH + 0.001))), brass, parent=roll, smooth=False)
keys = [(roll, "location", 0, 0.0, 1.2)]
WR = 0.05
for i, (sx, y) in enumerate((sx, y) for sx in (-1, 1) for y in (Y0 - 0.03, YP + PD - 0.06)):
    x = sx * (W / 2 + 0.02)
    M(f"ladder_fork_{i + 1}", comp.merge(comp.box((0.006, 0.05, 0.085), at=(x - 0.022, y, 0.062)), comp.box((0.006, 0.05, 0.085), at=(x + 0.022, y, 0.062)), comp.box((0.05, 0.05, 0.006), at=(x, y, 0.103)), comp.cyl(0.005, 0.056, at=(x, y - 0.028, WR), seg=6, axis="Y")), iron, parent=roll, smooth=False)
    ax = comp.pivot(col, root, f"ladder_caster_{i + 1}", (x, y, WR), parent=roll)
    wheel = comp.merge(comp.cyl(WR, 0.03, at=(x, y - 0.015, WR), seg=24, axis="Y"))
    M(f"ladder_wheel_{i + 1}", wheel, rubber, parent=ax)
    M(f"ladder_hub_{i + 1}", comp.merge(comp.cyl(0.028, 0.034, at=(x, y - 0.017, WR), seg=6, axis="Y"), *[xf(comp.box((0.008, 0.035, 0.085)), T(x, y, WR) @ R(a, "Y")) for a in (0, 60, 120)]), iron, parent=ax, smooth=False)
    keys.append((ax, "rotation_euler", 1, 0, 1.2 / WR))
brake = comp.pivot(col, root, "ladder_brake", (0, YP + PD / 2, 0.1), parent=roll)
M("ladder_brake_feet", comp.merge(*[comp.merge(comp.cyl(0.012, 0.12, at=(sx * (W / 2 - 0.02), YP + PD / 2, 0.06), seg=8), comp.cyl(0.03, 0.02, at=(sx * (W / 2 - 0.02), YP + PD / 2, 0.04), seg=14)) for sx in (-1, 1)]), iron, parent=brake)
_lib.channel("roll", keys)
_lib.channel("brake", [(brake, "location", 2, brake.location.z, brake.location.z - 0.04)])
comp.export(col, root, "observatory", "ladder", made="blender/components/observatory/ladder.py", source="own geometry; Poly Haven texture oak_veneer_01", license="ours (texture CC0)", credit="Poly Haven (texture)",
            rig={"roll": "the steps roll 1.2 m along x, their casters turning with them", "brake": "the two brake feet drop 4 cm to the floor"})
