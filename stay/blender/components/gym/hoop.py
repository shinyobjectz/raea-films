# gym/hoop: a wall-mounted basketball goal, modelled by hand: a steel wall frame of two arms and two braces holding the
# backboard 1.22 m off the wall, a 1.83 x 1.07 m glass backboard in an aluminium frame with the white border and
# shooter's square and an orange pad along its bottom edge, an orange breakaway rim (45.7 cm inside) on its bracket with
# twelve net hooks, and a white nylon net of twelve strands knotted in diamonds. Its back at y 0; the origin is on the
# wall at the rim's height, so it hangs at 3.05 m for regulation (the gym's wrong detail hangs three of them at three
# heights). Rig: "net" swings the net 24 degrees back about the rim (the ball going through); "rim" dips the rim and
# net 8 degrees on the breakaway hinge; "kick" flicks the net's skirt up 30% (its scale).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, torus, rod, rbox, T, R, S, xf

col, root = comp.fresh("hoop")
M = _lib.maker(col, root)
steel = comp.mat("hoop_frame", (0.22, 0.23, 0.25), rough=0.45, metal=1.0)
alu = comp.mat("hoop_board_frame", (0.75, 0.75, 0.77), rough=0.3, metal=1.0)
glass = comp.mat("hoop_glass", (0.55, 0.7, 0.72), rough=0.03, alpha=0.2)
white = comp.mat("hoop_lines", (0.92, 0.92, 0.9), rough=0.5)
orange = comp.mat("hoop_rim", (0.85, 0.2, 0.02), rough=0.4)
pad = comp.mat("hoop_pad", (0.75, 0.2, 0.03), rough=0.6)
nylon = comp.mat("hoop_net", (0.9, 0.9, 0.88), rough=0.8)
BY = -1.22                      # the backboard's face
BW, BH = 1.83, 1.07
BZ0 = -0.15                     # the board's bottom edge, 15 cm under the rim
RR, RY = 0.2286, BY - 0.15 - 0.2286

# the wall frame
fr = [rbox((0.5, 0.012, 0.9), at=(sx * 0.45, -0.006, 0.45), r=0.003, seg=1) for sx in (-1, 1)]
for sx in (-1, 1):
    fr.append(rod((sx * 0.45, 0, 0.8), (sx * 0.45, BY + 0.05, 0.8), 0.03, seg=10))
    fr.append(rod((sx * 0.45, 0, 0.15), (sx * 0.45, BY + 0.05, 0.15), 0.03, seg=10))
    fr.append(rod((sx * 0.45, 0, 0.8), (sx * 0.45, BY + 0.05, 0.15), 0.02, seg=8))
    fr.append(rod((sx * 0.45, -0.3, 1.5), (sx * 0.45, BY + 0.05, 0.8), 0.02, seg=8))
    fr.append(rod((sx * 0.45, 0, 1.5), (sx * 0.45, -0.3, 1.5), 0.02, seg=8))
fr.append(rod((-0.45, BY + 0.05, 0.15), (0.45, BY + 0.05, 0.15), 0.025, seg=10))
fr.append(rod((-0.45, BY + 0.05, 0.8), (0.45, BY + 0.05, 0.8), 0.025, seg=10))
fr.append(rod((-0.45, -0.6, 0.8), (0.45, -0.6, 0.15), 0.015, seg=8))
fr.append(rod((0.45, -0.6, 0.8), (-0.45, -0.6, 0.15), 0.015, seg=8))
M("hoop_wall_frame", comp.merge(*fr), steel)
M("hoop_bolts", comp.merge(*[comp.cyl(0.014, 0.012, at=(sx * 0.45 + dx, -0.024, z), seg=6, axis="Y") for sx in (-1, 1) for dx in (-0.2, 0.2) for z in (0.06, 0.84)]), alu, smooth=False)

# the backboard
M("hoop_glass", comp.box((BW, 0.013, BH), at=(0, BY, BZ0 + BH / 2)), glass, smooth=False)
bf = [comp.box((BW + 0.05, 0.045, 0.045), at=(0, BY + 0.01, z)) for z in (BZ0 - 0.0, BZ0 + BH)] + [comp.box((0.045, 0.045, BH), at=(sx * (BW / 2 + 0.003), BY + 0.01, BZ0 + BH / 2)) for sx in (-1, 1)]
bf += [comp.box((0.04, 0.03, BH), at=(sx * 0.45, BY + 0.03, BZ0 + BH / 2)) for sx in (-1, 1)]
M("hoop_board_frame", comp.merge(*bf), alu, smooth=False)
ln, Y1 = [], BY - 0.0075
for z in (BZ0 + 0.045, BZ0 + BH - 0.045):
    ln.append(comp.box((BW - 0.04, 0.002, 0.05), at=(0, Y1, z)))
for sx in (-1, 1):
    ln.append(comp.box((0.05, 0.002, BH - 0.04), at=(sx * (BW / 2 - 0.045), Y1, BZ0 + BH / 2)))
    ln.append(comp.box((0.05, 0.002, 0.46), at=(sx * 0.28, Y1, 0.0 + 0.23)))
ln.append(comp.box((0.61, 0.002, 0.05), at=(0, Y1, 0.435)))
ln.append(comp.box((0.61, 0.002, 0.05), at=(0, Y1, 0.025)))
M("hoop_lines", comp.merge(*ln), white, smooth=False)
M("hoop_pad", comp.merge(rbox((BW + 0.06, 0.07, 0.06), at=(0, BY, BZ0 - 0.012), r=0.02, seg=3), *[rbox((0.06, 0.07, 0.38), at=(sx * (BW / 2 + 0.003), BY, BZ0 + 0.16), r=0.02, seg=3) for sx in (-1, 1)]), pad, smooth=False)

# the rim on its breakaway hinge, and the net on the rim
hinge = comp.pivot(col, root, "hoop_rim", (0, BY - 0.02, 0.0))
M("hoop_rim_ring", torus(RR + 0.009, 0.009, seg=64, sides=10, at=(0, RY, 0)), orange, parent=hinge)
br = [rbox((0.13, 0.012, 0.13), at=(0, BY - 0.012, -0.04), r=0.003, seg=1), rbox((0.1, 0.15, 0.012), at=(0, BY - 0.085, -0.006), r=0.003, seg=1)]
br += [rod((sx * 0.05, BY - 0.02, -0.1), (sx * 0.13, RY + 0.12, -0.012), 0.008, seg=8) for sx in (-1, 1)]
M("hoop_rim_bracket", comp.merge(*br), orange, parent=hinge, smooth=False)
hooks = [torus(0.008, 0.002, seg=8, sides=4, at=((RR + 0.006) * math.cos(a), RY + (RR + 0.006) * math.sin(a), -0.014), axis="X") for a in (2 * math.pi * (i + 0.5) / 12 for i in range(12))]
M("hoop_net_hooks", comp.merge(*hooks), orange, parent=hinge)
net = comp.pivot(col, root, "hoop_net", (0, RY, -0.015), parent=hinge)
NR, NZ = [0.228, 0.205, 0.175, 0.15, 0.135, 0.13, 0.135], [0.0, -0.07, -0.15, -0.23, -0.31, -0.385, -0.44]
strands, knots = [], []
for k in range(len(NR) - 1):
    for i in range(12):
        a0 = 2 * math.pi * (i + 0.5 * (k % 2) + 0.5) / 12
        p0 = (NR[k] * math.cos(a0), RY + NR[k] * math.sin(a0), -0.02 + NZ[k])
        for da in (-0.5, 0.5):
            a1 = a0 + 2 * math.pi * da / 12
            p1 = (NR[k + 1] * math.cos(a1), RY + NR[k + 1] * math.sin(a1), -0.02 + NZ[k + 1])
            strands.append(rod(p0, p1, 0.0028, seg=5))
        knots.append(_lib.sphere(0.0055, at=p0, seg=6, rings=4))
M("hoop_net_mesh", comp.merge(*strands, *knots), nylon, parent=net)
comp.channel("net", [(net, "rotation_euler", 0, 0, math.radians(24))])
comp.channel("rim", [(hinge, "rotation_euler", 0, 0, math.radians(8))])
comp.channel("kick", [(net, "scale", 2, 1.0, 0.7)])
comp.export(col, root, "gym", "hoop", made="blender/components/gym/hoop.py",
            source="own geometry (a generic wall-mounted goal: glass board, breakaway rim, nylon net)", license="ours", credit="",
            rig={"net": "the net swings 24 degrees back toward the board about the rim's centre",
                 "rim": "the rim, its bracket and the net dip 8 degrees on the breakaway hinge at the board",
                 "kick": "the net shortens to 70% (its skirt flicking up as the ball drops through)",
                 "height": "the Model's own position: the origin is on the wall at the rim's height (3.05 m is regulation)"},
            notes="the TR circle of the gym's hooks is the rim, 45.7 cm inside, its centre 1.6 m off the wall")
