# diner/menu-board: the diner's wrong detail (board/scenes.ts: "a menu in no language"): a black felt letter board,
# 1.7 x 0.75 m, in a chrome frame, three columns of dishes and prices under headings, every character a made-up glyph
# of two to four strokes in a letter's box (seeded, so it is the same menu every build), with a red line under each
# heading. Modelled by hand. Its back at y 0, its middle the origin.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("menu_board")
M = _lib.maker(col, root)
W, H = 1.7, 0.75
felt = comp.mat("menu_felt", (0.015, 0.015, 0.017), rough=0.95)
chrome = comp.mat("menu_frame", (0.86, 0.86, 0.88), rough=0.16, metal=1.0)
white = comp.mat("menu_letters", (0.9, 0.89, 0.84), rough=0.5)
red = comp.mat("menu_rule", (0.7, 0.05, 0.04), rough=0.4)
M("menu_board_felt", comp.box((W, 0.02, H), at=(0, -0.01, 0)), felt, smooth=False)
fr = [comp.box((W + 0.06, 0.04, 0.035), at=(0, -0.02, sz * (H / 2 + 0.01))) for sz in (-1, 1)] + [comp.box((0.035, 0.04, H + 0.05), at=(sx * (W / 2 + 0.01), -0.02, 0)) for sx in (-1, 1)]
f = M("menu_board_frame", comp.merge(*fr), chrome, smooth=False)
comp.bevel(f, 0.006, 2)
rnd = random.Random(1947)
Y = -0.0215


def glyph(x, z, h):
    """A character that is no letter: strokes between points of a 3 x 4 grid in its box."""
    w = h * 0.55
    pts = [(x + w * i / 2, z + h * j / 3) for i in range(3) for j in range(4)]
    out = []
    for _ in range(rnd.choice((2, 3, 3, 4))):
        a, b = rnd.sample(pts, 2)
        dx, dz = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dz)
        s = comp.box((ln + h * 0.14, 0.002, h * 0.14))
        xf(s, R(-math.degrees(math.atan2(dz, dx)), "Y"))
        xf(s, T((a[0] + b[0]) / 2, Y, (a[1] + b[1]) / 2))
        out.append(s)
    return out


letters, rules = [], []
CW = W / 3
for c in range(3):
    x0 = -W / 2 + c * CW + 0.06
    z = H / 2 - 0.1
    hx = x0
    for _ in range(rnd.randint(5, 8)):       # the heading
        letters += glyph(hx, z, 0.055)
        hx += 0.055 * 0.8
    rules.append(comp.box((CW - 0.12, 0.002, 0.006), at=(x0 + (CW - 0.12) / 2, Y, z - 0.022)))
    z -= 0.085
    for row in range(9):
        lx = x0
        for wd in range(rnd.randint(1, 3)):   # the dish
            for _ in range(rnd.randint(3, 6)):
                if lx < x0 + CW - 0.24:
                    letters += glyph(lx, z, 0.03)
                    lx += 0.03 * 0.8
            lx += 0.022
        px = x0 + CW - 0.19
        for k in range(4):                    # the price: glyphs too, with a point
            if k == 2:
                letters.append(comp.box((0.006, 0.002, 0.006), at=(px - 0.004, Y, z + 0.003)))
            letters += glyph(px, z, 0.03)
            px += 0.03 * 0.8
        z -= 0.058
M("menu_board_letters", comp.merge(*letters), white, smooth=False)
M("menu_board_rules", comp.merge(*rules), red, smooth=False)
comp.export(col, root, "diner", "menu_board", made="blender/components/diner/menu_board.py",
            source="own geometry (a letter board whose characters are made-up glyphs: no language, no brand)", license="ours", credit="",
            notes="the diner's wrong detail: a menu in no language")
