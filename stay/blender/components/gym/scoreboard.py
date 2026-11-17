# gym/scoreboard: a wall scoreboard, 2.4 x 1.3 m, modelled by hand: a black steel cabinet with a cream pinstripe, the
# game clock in amber seven-segment digits over HOME and GUEST scores in red, a period digit and two bonus lamps, a
# horn on top. Every segment is its own face: the lit ones are scoreboard_lit (red) and scoreboard_lit_clock (amber),
# the dark ones scoreboard_unlit. It reads 0:00 and 00 to 00, after hours. Its back at y 0, its middle the origin.
# Rig: the digits' glow is the scene's ("the lights come up").
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("scoreboard")
M = _lib.maker(col, root)
W, H, D = 2.4, 1.3, 0.14
case = comp.mat("scoreboard_case", (0.02, 0.02, 0.024), rough=0.45)
trim = comp.mat("scoreboard_trim", (0.85, 0.8, 0.6), rough=0.5)
red = comp.mat("scoreboard_lit", (1.0, 0.12, 0.05), rough=0.4, emit=(1.0, 0.1, 0.04), strength=8.0)
amber = comp.mat("scoreboard_lit_clock", (1.0, 0.6, 0.1), rough=0.4, emit=(1.0, 0.55, 0.08), strength=8.0)
off = comp.mat("scoreboard_unlit", (0.09, 0.03, 0.025), rough=0.6)
c = M("scoreboard_case", rbox((W, D, H), at=(0, -D / 2, 0), r=0.015, seg=2), case, smooth=False)
Y = -D - 0.001
tr = [comp.box((W - 0.1, 0.002, 0.012), at=(0, Y, sz * (H / 2 - 0.05))) for sz in (-1, 1)] + [comp.box((0.012, 0.002, H - 0.1), at=(sx * (W / 2 - 0.05), Y, 0)) for sx in (-1, 1)]
tr.append(comp.box((W - 0.2, 0.002, 0.008), at=(0, Y, 0.07)))
SEG = {"0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg"}
lit = {"red": [], "amber": [], "off": []}


def digit(ch, x, z, h, colour):
    w, t = h * 0.5, h * 0.11
    segs = {"a": (0, h / 2, w - t, t), "g": (0, 0, w - t, t), "d": (0, -h / 2, w - t, t), "f": (-w / 2, h / 4, t, h / 2 - t), "b": (w / 2, h / 4, t, h / 2 - t),
            "e": (-w / 2, -h / 4, t, h / 2 - t), "c": (w / 2, -h / 4, t, h / 2 - t)}
    for k, (dx, dz, sw, sh) in segs.items():
        bm = comp.box((sw, 0.003, sh), at=(x + dx, Y, z + dz))
        bmesh.ops.bevel(bm, geom=[e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) > 0.002], offset=min(sw, sh) * 0.45, segments=1, affect="EDGES")
        lit[colour if k in SEG[ch] else "off"].append(bm)


for i, (ch, x) in enumerate(zip("000", (-0.36, 0.1, 0.42))):
    digit(ch, x, 0.33, 0.36, "amber")
lit["amber"] += [comp.box((0.04, 0.003, 0.04), at=(-0.13, Y, 0.33 + s * 0.08)) for s in (-1, 1)]
for x0 in (-0.78, 0.78):
    for k, dx in enumerate((-0.16, 0.16)):
        digit("0", x0 + dx, -0.27, 0.42, "red")
digit("4", 0, -0.3, 0.24, "red")
lit["red"] += [comp.cyl(0.03, 0.003, at=(sx * 0.3, Y + 0.0015, -0.5), seg=16, axis="Y") for sx in (-1,)]
lit["off"] += [comp.cyl(0.03, 0.003, at=(sx * 0.3, Y + 0.0015, -0.5), seg=16, axis="Y") for sx in (1,)]
M("scoreboard_digits_score", comp.merge(*lit["red"]), red, smooth=False)
M("scoreboard_digits_clock", comp.merge(*lit["amber"]), amber, smooth=False)
M("scoreboard_segments_unlit", comp.merge(*lit["off"]), off, smooth=False)
words = []
for s, x, z, h in (("HOME", -0.78, 0.02, 0.085), ("GUEST", 0.78, 0.02, 0.085), ("PERIOD", 0, -0.12, 0.055), ("BONUS", -0.3, -0.575, 0.04), ("BONUS", 0.3, -0.575, 0.04)):
    words.append(xf(comp.text(s, h, depth=0.002), T(x, Y, z)))
M("scoreboard_words", comp.merge(*words), trim, smooth=False)
M("scoreboard_trim", comp.merge(*tr), trim, smooth=False)
horn = _lib.lathe([(0.03, 0), (0.035, 0.05), (0.06, 0.12), (0.1, 0.16), (0.095, 0.16), (0.055, 0.115), (0.03, 0.05), (0, 0.04)], seg=24, axis="Y")
xf(horn, R(180, "Z")); xf(horn, T(0.9, -0.02, H / 2 + 0.1))
M("scoreboard_horn", comp.merge(horn, comp.box((0.08, 0.06, 0.1), at=(0.9, -0.05, H / 2 + 0.05))), comp.mat("scoreboard_horn", (0.5, 0.5, 0.52), rough=0.4, metal=1.0))
comp.export(col, root, "gym", "scoreboard", made="blender/components/gym/scoreboard.py",
            source="own geometry (a generic scoreboard: HOME, GUEST, PERIOD; no maker's name); letters in Blender's built-in font", license="ours", credit="",
            rig={"glow": "in the scene: the materials scoreboard_lit (scores, period) and scoreboard_lit_clock (the clock) come up with the lights"})
