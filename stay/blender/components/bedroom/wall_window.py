# bedroom/wall-window: the room's back wall, 4.2 x 2.5 m, with its sash window: painted plaster (Poly Haven's
# painted_plaster_wall, CC0, tinted a 90s pale blue), a moulded skirting board, a picture rail's border strip, and a
# timber double-hung window 1.4 x 1.2 m in a moulded casing with a deep sill, each sash with its glazing bars, its own
# glass (window_glass) and a latch. The wall's room face is at y 0, its foot at z 0, centred in x; the window's centre
# is at x -0.6, z 1.6. Rig: "sash" slides the lower sash up 0.45 m (the cursor's lift); the glass is where the scene's
# rain lies ("rain" is its own component) and the scene's sun comes through.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import ROOM_W, ROOM_H, WIN_W, WIN_H, WIN_SILL, WIN_X
col, root = comp.fresh("wall_window")
M = _lib.maker(col, root)
TH = 0.14
plaster = comp.ph_texture("wall_plaster", "painted_plaster_wall", tile=2.0, res="1k", tint=(0.58, 0.74, 0.86), grey=True)
white = comp.mat("wall_trim", (0.9, 0.89, 0.84), rough=0.4)
border = comp.mat("wall_border", (0.03, 0.07, 0.3), rough=0.6)
glass = comp.mat("window_glass", (0.75, 0.85, 0.9), rough=0.03, alpha=0.12)
brass = comp.mat("window_latch", (0.72, 0.56, 0.28), rough=0.3, metal=1.0)
x0, x1 = WIN_X - WIN_W / 2, WIN_X + WIN_W / 2
z0, z1 = WIN_SILL, WIN_SILL + WIN_H
L, Rr = -ROOM_W / 2, ROOM_W / 2
pieces = [comp.box((x0 - L, TH, ROOM_H), at=((x0 + L) / 2, TH / 2, ROOM_H / 2)),
          comp.box((Rr - x1, TH, ROOM_H), at=((Rr + x1) / 2, TH / 2, ROOM_H / 2)),
          comp.box((WIN_W, TH, z0), at=(WIN_X, TH / 2, z0 / 2)),
          comp.box((WIN_W, TH, ROOM_H - z1), at=(WIN_X, TH / 2, (ROOM_H + z1) / 2))]
w = M("wall_window_plaster", comp.merge(*pieces), plaster)
comp.uv_box(w, 1.0)
# skirting: a board with a moulded top
sk = M("wall_window_skirting", comp.merge(comp.box((ROOM_W, 0.018, 0.12), at=(0, -0.009, 0.06)), comp.box((ROOM_W, 0.01, 0.025), at=(0, -0.005, 0.132))), white)
comp.bevel(sk, 0.004, 2)
M("wall_window_border", comp.box((ROOM_W, 0.002, 0.09), at=(0, -0.001, 2.28)), border)
stars = []
import random
rnd = random.Random(4)
for i in range(28):
    s = comp.cyl(0.022, 0.0015, seg=5, axis="Y")
    comp.xf(s, comp.R(rnd.uniform(0, 72), "Y")); comp.xf(s, comp.T(L + 0.08 + i * 0.15, -0.0035, 2.28))
    stars.append(s)
M("wall_window_border_stars", comp.merge(*stars), comp.mat("wall_border_star", (0.9, 0.6, 0.06), rough=0.6))
# the casing round the opening, the sill and its apron
CW = 0.09
cas = comp.merge(comp.box((CW, 0.022, WIN_H + CW), at=(x0 - CW / 2, -0.011, (z0 + z1 + CW) / 2)), comp.box((CW, 0.022, WIN_H + CW), at=(x1 + CW / 2, -0.011, (z0 + z1 + CW) / 2)),
                 comp.box((WIN_W + 2 * CW + 0.04, 0.03, CW), at=(WIN_X, -0.015, z1 + CW / 2)), comp.box((WIN_W + 2 * CW + 0.03, 0.02, 0.08), at=(WIN_X, -0.01, z0 - 0.065)))
c = M("wall_window_casing", cas, white)
comp.bevel(c, 0.005, 2)
s = M("wall_window_sill", comp.box((WIN_W + 2 * CW + 0.08, TH * 0.6 + 0.07, 0.03), at=(WIN_X, TH * 0.3 - 0.035, z0 - 0.015)), white)
comp.bevel(s, 0.008, 3)
# the jamb lining the opening
jm = comp.merge(comp.box((0.02, TH, WIN_H), at=(x0 + 0.01, TH / 2, (z0 + z1) / 2)), comp.box((0.02, TH, WIN_H), at=(x1 - 0.01, TH / 2, (z0 + z1) / 2)), comp.box((WIN_W, TH, 0.02), at=(WIN_X, TH / 2, z1 - 0.01)))
M("wall_window_jamb", jm, white)

def sash(name, zc, y, h):
    """One sash: stiles, rails, a cross of glazing bars, its glass. Returns its pivot."""
    p = comp.pivot(col, root, name, (WIN_X, y, zc))
    w_, st = WIN_W - 0.04, 0.05
    fr = comp.merge(comp.box((st, 0.035, h), at=(WIN_X - w_ / 2 + st / 2, y, zc)), comp.box((st, 0.035, h), at=(WIN_X + w_ / 2 - st / 2, y, zc)),
                    comp.box((w_, 0.035, st), at=(WIN_X, y, zc + h / 2 - st / 2)), comp.box((w_, 0.035, st), at=(WIN_X, y, zc - h / 2 + st / 2)),
                    comp.box((0.02, 0.02, h - 0.06), at=(WIN_X, y, zc)), comp.box((w_ - 0.06, 0.02, 0.02), at=(WIN_X, y, zc)))
    f = M(name + "_frame", fr, white, parent=p)
    comp.bevel(f, 0.003, 2)
    M(name + "_glass", comp.box((w_ - 0.08, 0.004, h - 0.08), at=(WIN_X, y, zc)), glass, parent=p)
    return p
hh = WIN_H / 2 + 0.02
upper = sash("wall_window_sash_upper", z1 - hh / 2, 0.095, hh)
lower = sash("wall_window_sash_lower", z0 + hh / 2, 0.055, hh)
lt = M("wall_window_latch", comp.merge(comp.cyl(0.014, 0.008, at=(WIN_X, 0.055, z0 + hh), seg=16), comp.box((0.05, 0.012, 0.006), at=(WIN_X + 0.012, 0.05, z0 + hh + 0.011))), brass, parent=lower)
for i, x in enumerate((-0.3, 0.3)):
    M(f"wall_window_lift_{i + 1}", comp.merge(comp.box((0.07, 0.014, 0.012), at=(WIN_X + x, 0.032, z0 + 0.03))), brass, parent=lower)
comp.channel("sash", [(lower, "location", 2, lower.location.z, lower.location.z + 0.45)])
comp.export(col, root, _lib.PLACE, "wall_window", made="blender/components/bedroom/wall_window.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
            rig={"sash": "the lower sash slides up 0.45 m", "glass": "in the scene: window_glass, the pane the rain lies on and the sun comes through"},
            notes="window opening 1.4 x 1.2 m, its centre at x -0.6, z 1.6 from the wall's foot centre")
