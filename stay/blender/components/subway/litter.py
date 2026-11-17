# subway/litter: what the night leaves on a platform, modelled by hand, lying within a metre of the origin: an open
# newspaper sheet, creased down its middle, with a headline and columns printed on it (LATE EDITION: our own), a
# paper cup on its side, a crushed drink can, a green bottle, a crumpled paper bag and six cigarette ends.
# Rig: "blow" is the train's wind: the newspaper lifts 0.3 m, tumbles 70 degrees and slides 1.4 m along the platform
# toward the front (-y); the cup rolls 0.6 m the same way.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, slab, sphere

col, root = comp.fresh("litter")
paper = comp.mat("litter_newsprint", (0.72, 0.7, 0.62), rough=0.9)
ink = comp.mat("litter_ink", (0.06, 0.06, 0.06), rough=0.9)
cup_m = comp.mat("litter_cup", (0.9, 0.88, 0.82), rough=0.6)
band = comp.mat("litter_cup_band", (0.1, 0.25, 0.55), rough=0.6)
can = comp.mat("litter_can", (0.7, 0.71, 0.73), rough=0.3, metal=1.0)
canp = comp.mat("litter_can_paint", (0.65, 0.08, 0.06), rough=0.4, metal=0.5)
glass = comp.mat("litter_bottle", (0.04, 0.22, 0.08), rough=0.08, alpha=0.75)
bag = comp.mat("litter_bag", (0.5, 0.36, 0.2), rough=0.9)
butt = comp.mat("litter_butt", (0.8, 0.55, 0.25), rough=0.8)
ash = comp.mat("litter_butt_paper", (0.88, 0.87, 0.83), rough=0.8)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
rnd = random.Random(31)
# the newspaper: a 0.58 x 0.4 m sheet lying open, a ridge along its fold, corners lifting
news = comp.pivot(col, root, "litter_newspaper", (0.1, -0.1, 0.01))
g = bmesh.new()
bmesh.ops.create_grid(g, x_segments=24, y_segments=16, size=0.5)
xf(g, S(0.58, 0.4, 1))
def lift(x, y):
    return 0.004 + 0.018 * math.exp(-(x / 0.03) ** 2) + 0.05 * max(0, abs(x) - 0.2) * max(0, y + 0.05) * 6 + 0.004 * math.sin(x * 40) * math.cos(y * 31)
for v in g.verts:
    v.co.z = lift(v.co.x, v.co.y)
xf(g, comp.Matrix.Translation((0.1, -0.1, 0.0)) @ R(24, "Z"))
M("litter_newspaper_sheet", g, paper, parent=news, smooth=True)
pr = []
def line(x0, x1, y, h):
    n = max(2, int((x1 - x0) / 0.03))
    for i in range(n):
        xa, xb = x0 + (x1 - x0) * i / n, x0 + (x1 - x0) * (i + 1) / n
        xm = (xa + xb) / 2
        pr.append(comp.box((xb - xa, h, 0.0008), at=(xm, y, lift(xm, y) + 0.0012)))
for side in (-1, 1):
    x0 = -0.27 if side < 0 else 0.03
    line(x0, x0 + 0.24, 0.165, 0.028)
    line(x0, x0 + 0.24, 0.13, 0.006)
    for c in range(3):
        for r in range(22):
            if rnd.random() < 0.9:
                line(x0 + c * 0.083, x0 + c * 0.083 + 0.07 * rnd.uniform(0.6, 1), 0.105 - r * 0.0125, 0.005)
ph = comp.merge(*pr)
xf(ph, comp.Matrix.Translation((0.1, -0.1, 0.0)) @ R(24, "Z"))
M("litter_newspaper_print", ph, ink, parent=news)
# the cup, on its side
cup = comp.pivot(col, root, "litter_cup", (-0.45, 0.25, 0.04))
c = lathe([(0.027, 0.0), (0.04, 0.11), (0.042, 0.112), (0.042, 0.108), (0.038, 0.108), (0.0255, 0.004), (0.0, 0.004)], seg=24)
b = lathe([(0.0325, 0.04), (0.0372, 0.08)], seg=24)
for m_ in (c, b):
    xf(m_, comp.Matrix.Translation((-0.45, 0.25, 0.042)) @ R(40, "Z") @ R(88, "X") @ T(0, 0, -0.055))
M("litter_cup_body", c, cup_m, parent=cup, smooth=True)
M("litter_cup_band", xf(b, S(1.0, 1.0, 1.0)), band, parent=cup, smooth=True)
# the can, crushed in the middle
k = lathe([(0.0, 0.0), (0.026, 0.0), (0.033, 0.008), (0.033, 0.112), (0.027, 0.122), (0.0, 0.122)], seg=20)
for v in k.verts:
    sq = math.exp(-((v.co.z - 0.06) / 0.03) ** 2)
    v.co.x *= 1 - 0.55 * sq
    v.co.z = v.co.z * 0.8 + 0.01 * sq * math.sin(v.co.y * 90)
top = [f for f in k.faces if all(abs(v.co.z - 0.0976) < 0.012 or v.co.z < 0.01 for v in f.verts)]
xf(k, comp.Matrix.Translation((0.55, 0.42, 0.03)) @ R(-60, "Z") @ R(90, "X"))
M("litter_can", k, canp, smooth=True)
# the bottle, lying
bt = lathe([(0.0, 0.0), (0.03, 0.0), (0.032, 0.01), (0.032, 0.13), (0.026, 0.165), (0.0135, 0.2), (0.0135, 0.235), (0.016, 0.238), (0.016, 0.248), (0.011, 0.25)], seg=24)
xf(bt, comp.Matrix.Translation((0.5, -0.5, 0.033)) @ R(115, "Z") @ R(90, "X"))
M("litter_bottle", bt, glass, smooth=True)
# the bag
bg = bmesh.new()
bmesh.ops.create_icosphere(bg, subdivisions=3, radius=0.1)
for v in bg.verts:
    v.co *= 1 + rnd.uniform(-0.2, 0.14)
xf(bg, S(1.3, 0.9, 0.55)); xf(bg, T(-0.3, -0.55, 0.05))
M("litter_bag", bg, bag)
bs, tips = [], []
for i in range(6):
    x, y, a = rnd.uniform(-0.8, 0.8), rnd.uniform(-0.7, 0.7), rnd.uniform(0, 180)
    m4 = comp.Matrix.Translation((x, y, 0.0045)) @ R(a, "Z")
    bs.append(xf(comp.cyl(0.004, 0.022, seg=8, axis="X"), m4))
    tips.append(xf(comp.cyl(0.004, 0.016, at=(0.022, 0, 0), seg=8, axis="X"), m4))
M("litter_butts", comp.merge(*bs), butt, smooth=True)
M("litter_butt_papers", comp.merge(*tips), ash, smooth=True)
comp.channel("blow", [(news, "location", 1, news.location.y, news.location.y - 1.4), (news, "location", 2, news.location.z, news.location.z + 0.3), (news, "rotation_euler", 0, 0, math.radians(70)), (news, "rotation_euler", 2, 0, math.radians(-50)),
                      (cup, "location", 1, cup.location.y, cup.location.y - 0.6), (cup, "rotation_euler", 2, 0, math.radians(120))])
comp.export(col, root, "subway", "litter", made="blender/components/subway/litter.py", source="own geometry (platform litter)", license="ours", credit="",
            rig={"blow": "the newspaper lifts 0.3 m, tumbles 70 degrees and slides 1.4 m toward the front; the cup rolls 0.6 m the same way"})
