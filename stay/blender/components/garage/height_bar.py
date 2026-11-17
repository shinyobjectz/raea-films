# garage/height-bar: the headroom bar over the entry lane, modelled by hand: a 3 m steel tube banded yellow and black,
# hung 0.55 m under the soffit (the eye bolts' tops at z 0, the origin) on two chains of welded links, with a yellow
# plate under it reading MAX HEIGHT 2.1 m. Rig: "swing" swings bar, plate and chains 16 degrees back about the eye
# bolts (a roof that just clears it; the reroll's shudder).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("height_bar")
M = L.maker(col, root)
yellow = comp.mat("height_bar_yellow", (0.92, 0.72, 0.04), rough=0.45)
black = comp.mat("height_bar_black", (0.02, 0.02, 0.02), rough=0.5)
galv = comp.mat("height_bar_chain", (0.6, 0.61, 0.62), rough=0.35, metal=1.0)
LEN, DROP, RAD = 3.0, 0.55, 0.04
M("height_bar_eyes", comp.merge(*[comp.cyl(0.03, 0.006, at=(s * 1.3, 0, -0.006), seg=14) for s in (-1, 1)], *[comp.cyl(0.006, 0.03, at=(s * 1.3, 0, -0.035), seg=8) for s in (-1, 1)]), galv)
sw = comp.pivot(col, root, "height_bar_swing", (0, 0, -0.03))
links = []
NL = 13
for s in (-1, 1):
    for i in range(NL):
        z = -0.045 - i * (DROP - RAD - 0.05) / (NL - 1)
        o = L.rrect(0.022, 0.046, 0.0105, 3)
        pts = [(x, 0, y) for x, y in o] if i % 2 == 0 else [(0, x, y) for x, y in o]
        lk = L.sweep(pts, L.circle(0.0032, 6), closed=True, up=(0, 1, 0) if i % 2 == 0 else (1, 0, 0))
        links.append(xf(lk, T(s * 1.3, 0, z)))
M("height_bar_chains", comp.merge(*links), galv, parent=sw, smooth=True)
ya, bl = [], []
N = 12
for i in range(N):
    seg = comp.cyl(RAD, LEN / N, at=(-LEN / 2 + i * LEN / N, 0, -DROP), seg=24, axis="X")
    (ya if i % 2 == 0 else bl).append(seg)
bl += [comp.cyl(RAD + 0.003, 0.03, at=(s * LEN / 2 - (0.03 if s > 0 else 0), 0, -DROP), seg=24, axis="X") for s in (-1, 1)]
bl += [L.sweep([(s * 1.3, (RAD + 0.004) * math.cos(a), -DROP + (RAD + 0.004) * math.sin(a)) for a in [math.radians(d) for d in range(0, 360, 20)]], L.rrect(0.02, 0.004, 0.001, 1), closed=True, up=(1, 0, 0)) for s in (-1, 1)]
L.sharp(M("height_bar_tube_yellow", comp.merge(*ya), yellow, parent=sw, smooth=True), 40)
L.sharp(M("height_bar_tube_black", comp.merge(*bl), black, parent=sw, smooth=True), 40)
pl = M("height_bar_plate", comp.merge(comp.box((1.0, 0.004, 0.24), at=(0, 0, -DROP - RAD - 0.16)), *[comp.box((0.004, 0.02, 0.05), at=(s * 0.4, 0, -DROP - RAD - 0.02)) for s in (-1, 1)]), yellow, parent=sw)
tx = lambda turn: xf(comp.merge(xf(comp.text("MAX HEIGHT", 0.085, 0.002), T(0, -0.003, -DROP - RAD - 0.105)), xf(comp.text("2.1 m", 0.12, 0.002), T(0, -0.003, -DROP - RAD - 0.215))), R(turn, "Z"))
M("height_bar_text", comp.merge(tx(0), tx(180)), black, parent=sw)
frame = L.sweep([(-0.49, -0.003, -DROP - RAD - 0.05), (0.49, -0.003, -DROP - RAD - 0.05), (0.49, -0.003, -DROP - RAD - 0.27), (-0.49, -0.003, -DROP - RAD - 0.27)], L.rrect(0.008, 0.002, 0.0005, 1), closed=True, up=(0, -1, 0))
M("height_bar_plate_border", comp.merge(frame, xf(L.sweep([(-0.49, -0.003, -DROP - RAD - 0.05), (0.49, -0.003, -DROP - RAD - 0.05), (0.49, -0.003, -DROP - RAD - 0.27), (-0.49, -0.003, -DROP - RAD - 0.27)], L.rrect(0.008, 0.002, 0.0005, 1), closed=True, up=(0, -1, 0)), R(180, "Z"))), black, parent=sw)
comp.channel("swing", [(sw, "rotation_euler", 0, 0, math.radians(-16))])
L.look(col, "height-bar", eye=(2.2, -4.2, -0.8), target=(0, 0, -0.5), lens=40, frame=None)
comp.export(col, root, "garage", "height_bar", made="blender/components/garage/height_bar.py", source="own geometry", license="ours", credit="",
            rig={"swing": "the bar, its plate and both chains swing 16 degrees back about the eye bolts under the soffit"})
