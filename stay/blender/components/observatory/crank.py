# observatory/crank: the dome's hand gear on the wall, modelled by hand: a cast-iron bracket and gearbox, a 56 cm
# six-spoke handwheel with a turned wooden grip, a pinion and bevel gear behind it, and a steel shaft rising in two
# bearings to the dome's rack (1.75 m of it above the wheel). Its back at y 0; the origin is the wheel's hub (set it
# 1.05 m up the wall). Rig: "turn" turns the handwheel one whole turn clockwise, the shaft three turns with it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import lathe, torus, rod, rbox, T, R, S, xf

col, root = comp.fresh("crank")
M = _lib.maker(col, root)
iron = comp.mat("crank_iron", (0.07, 0.11, 0.1), rough=0.4, metal=0.7)
steel = comp.mat("crank_steel", (0.6, 0.61, 0.63), rough=0.28, metal=1.0)
wood = comp.mat("crank_grip", (0.3, 0.17, 0.08), rough=0.45)
brass = comp.mat("crank_brass", (0.78, 0.58, 0.22), rough=0.25, metal=1.0)
M("crank_bracket", comp.merge(rbox((0.3, 0.02, 0.44), at=(0, -0.01, 0.02), r=0.006, seg=2), rbox((0.2, 0.16, 0.2), at=(0, -0.1, 0.0), r=0.02, seg=3), comp.cyl(0.06, 0.05, at=(0, -0.18, 0), seg=24, axis="Y"),
                              *[comp.cyl(0.013, 0.012, at=(sx * 0.12, -0.02, 0.02 + sz * 0.18), seg=6, axis="Y") for sx in (-1, 1) for sz in (-1, 1)], comp.cyl(0.05, 0.06, at=(0, -0.1, 0.1), seg=20)), iron, smooth=False)
wheel = comp.pivot(col, root, "crank_wheel", (0, -0.26, 0))
WR = 0.28
wh = [torus(WR, 0.016, seg=56, sides=8, at=(0, -0.26, 0), axis="Y"), comp.cyl(0.045, 0.07, at=(0, -0.23, 0), seg=20, axis="Y")]
wh += [rod((0.03 * math.cos(a), -0.265, 0.03 * math.sin(a)), (WR * math.cos(a), -0.26, WR * math.sin(a)), 0.011, seg=8) for a in (2 * math.pi * i / 6 for i in range(6))]
wh.append(comp.cyl(0.02, 0.1, at=(0, -0.26, 0), seg=12, axis="Y"))
M("crank_wheel_rim", comp.merge(*wh), iron, parent=wheel)
M("crank_grip", xf(lathe([(0.012, 0.0), (0.02, 0.01), (0.023, 0.05), (0.019, 0.1), (0.022, 0.125), (0.014, 0.135), (0.0, 0.135)], seg=16), T(0, -0.275, WR) @ R(90, "X")), wood, parent=wheel)
M("crank_hub_cap", comp.cyl(0.03, 0.012, at=(0, -0.342, 0), seg=20, axis="Y"), brass, parent=wheel)
shaft = comp.pivot(col, root, "crank_shaft", (0, -0.1, 0.16))
teeth = [xf(comp.box((0.012, 0.01, 0.04)), R(a, "Z") @ T(0.045, 0, 1.77)) for a in range(0, 360, 30)]
M("crank_shaft_rod", xf(comp.merge(comp.cyl(0.018, 1.8, at=(0, 0, 0.0), seg=12), comp.cyl(0.04, 0.05, at=(0, 0, 1.75), seg=12), *teeth, comp.cyl(0.035, 0.03, at=(0, 0, 0.0), seg=12, r2=0.02)), T(0, -0.1, 0.16)), steel, parent=shaft, smooth=False)
M("crank_bearings", comp.merge(*[comp.merge(rbox((0.1, 0.1, 0.05), at=(0, -0.05, z), r=0.006, seg=2), comp.cyl(0.03, 0.06, at=(0, -0.1, z - 0.03), seg=14)) for z in (0.75, 1.55)]), iron, smooth=False)
_lib.channel("turn", [(wheel, "rotation_euler", 1, 0, 2 * math.pi), (shaft, "rotation_euler", 2, 0, 6 * math.pi)])
comp.export(col, root, "observatory", "crank", made="blender/components/observatory/crank.py", source="own geometry (a generic dome hand gear)", license="ours", credit="",
            rig={"turn": "the handwheel one whole turn clockwise, its shaft three turns"}, notes="origin: the wheel's hub, its back at y 0; set it 1.05 m up the wall so the shaft's pinion meets the dome's rack")
