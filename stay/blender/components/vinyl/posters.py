# vinyl/posters: three gig posters for the shop's wall, drawn by hand in flat inks (no real band, venue or label): a
# framed one of rings like a record (STAY, side A), a taped paper one with a rising sun and LIVE TONIGHT, its lower
# corner curling off the wall, and a square taped flyer of bars (45 RPM NIGHT). A wall piece 1.75 m wide: its back at
# y 0, the origin at the group's centre. Rig: "flutter" lifts the taped poster's loose lower half 9 degrees off the
# wall about its top tape (the door's draught).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("posters")
INK = inks()
paper = comp.mat("poster_paper", (0.9, 0.87, 0.78), rough=0.75)
frame = comp.mat("poster_frame", (0.02, 0.02, 0.02), rough=0.4)
tape = comp.mat("poster_tape", (0.85, 0.8, 0.6), rough=0.4, alpha=0.75)
black = comp.mat("poster_ink", (0.03, 0.03, 0.035), rough=0.7)
def flat(size, x, z, y):
    return comp.box((size[0], 0.0004, size[1]), at=(x, y, z))
# 1: framed, rings
X, Wp, Hp = -0.58, 0.5, 0.7
fr = M("posters_frame", comp.merge(comp.box((Wp + 0.04, 0.02, 0.02), at=(X, -0.01, Hp / 2 + 0.01)), comp.box((Wp + 0.04, 0.02, 0.02), at=(X, -0.01, -Hp / 2 - 0.01)), comp.box((0.02, 0.02, Hp + 0.04), at=(X - Wp / 2 - 0.01, -0.01, 0)), comp.box((0.02, 0.02, Hp + 0.04), at=(X + Wp / 2 + 0.01, -0.01, 0))), frame)
comp.bevel(fr, 0.002, 2)
M("posters_rings_paper", paint(comp.box((Wp, 0.002, Hp), at=(X, -0.004, 0)), 6), INK)
rings = [paint(comp.cyl(r, 0.0006 * (k + 1), at=(X, -0.005 - 0.0006 * (k + 1), 0.08), seg=64, axis="Y"), (1, 6, 1, 6, 0, 5)[k]) for k, r in enumerate((0.22, 0.2, 0.15, 0.13, 0.075, 0.008))]
M("posters_rings", comp.merge(*rings), INK)
M("posters_rings_words", comp.merge(xf(comp.text("STAY", 0.085, depth=0.0006), T(X, -0.0058, -0.215)), xf(comp.text("SIDE A  -  ONE NIGHT ONLY", 0.019, depth=0.0006), T(X, -0.0058, -0.295))), paper)
# 2: taped, a sun, its lower half loose
X, Wp, Hp = 0.02, 0.42, 0.594
M("posters_sun_top", comp.merge(paint(comp.box((Wp, 0.0006, Hp * 0.45), at=(X, -0.0006, Hp * 0.275)), 2), paint(comp.cyl(0.13, 0.0006, at=(X, -0.0016, Hp * 0.08), seg=48, axis="Y"), 0)), INK)
M("posters_sun_tape", comp.merge(*[xf(comp.box((0.06, 0.0004, 0.022)), T(X + sx * Wp / 2, -0.0022, Hp / 2 - 0.005) @ R(sx * 40, "Y")) for sx in (-1, 1)]), tape)
fl = comp.pivot(col, root, "posters_flutter", (X, -0.001, Hp * 0.05))
low = comp.merge(paint(comp.box((Wp, 0.0006, Hp * 0.55), at=(X, -0.0006, -Hp * 0.225)), 2),
                 *[paint(comp.box((Wp, 0.0005, 0.03), at=(X, -0.0012, -0.02 - k * 0.05)), 0) for k in range(3)])
M("posters_sun_low", low, INK, parent=fl)
M("posters_sun_words", comp.merge(xf(comp.text("LIVE", 0.075, depth=0.0005), T(X, -0.0016, -0.2)), xf(comp.text("TONIGHT", 0.036, depth=0.0005), T(X, -0.0016, -0.262))), black, parent=fl)
fl.rotation_euler[0] = math.radians(-1.5)
# 3: square flyer, bars
X, Wp = 0.6, 0.36
bars = [paint(comp.box((Wp, 0.0006, Wp), at=(X, -0.0006, 0.1)), 3)]
for k in range(9):
    h = 0.05 + 0.2 * abs(math.sin(k * 1.3 + 0.6))
    bars.append(paint(comp.box((0.026, 0.0005, h), at=(X - 0.14 + k * 0.035, -0.0012, 0.02 + h / 2)), (1, 2, 9)[k % 3]))
M("posters_bars", xf(comp.merge(*bars), T(X, 0, 0.1) @ R(2.5, "Y") @ T(-X, 0, -0.1)), INK)
M("posters_bars_words", xf(xf(comp.text("45 RPM NIGHT", 0.03, depth=0.0005), T(X, -0.0016, -0.04)), T(X, 0, 0.1) @ R(2.5, "Y") @ T(-X, 0, -0.1)), paper)
M("posters_bars_tape", comp.merge(*[xf(comp.box((0.05, 0.0004, 0.02)), T(X + sx * (Wp / 2 - 0.01), -0.002, 0.1 + sz * (Wp / 2 - 0.005)) @ R(sx * sz * 35, "Y")) for sx in (-1, 1) for sz in (-1, 1)]), tape)
bpy.context.view_layer.update()
channel("flutter", [(fl, "rotation_euler", 0, math.radians(-1.5), math.radians(-9))])
done(col, root, "posters", "own geometry and designs (three generic gig posters)",
     rig={"flutter": "the taped poster's loose lower half 9 degrees off the wall about its middle fold"})
