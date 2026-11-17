# bedroom/desk: a kid's homework desk from a flat-pack catalogue, modelled by hand, 1.5 x 0.65 m and 0.75 m high: a
# maple-veneer top with a rounded front edge, white melamine sides and a modesty panel, a three-drawer pedestal on the
# right with red plastic pulls, a pencil groove, a cable hole with its cap, and stickers on the pedestal's side.
# Rig: "drawer" pulls the pedestal's top drawer out 0.3 m (pencils and a ruler inside); "drawers" all three 5 cm.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("desk")
M = _lib.maker(col, root)
W, D, H = 1.5, 0.65, 0.75
maple = comp.ph_texture("desk_top", "white_maple_veneer", tile=1.2, res="1k", tint=(1.0, 0.86, 0.66))
white = comp.mat("desk_melamine", (0.86, 0.85, 0.8), rough=0.45)
red = comp.mat("desk_pull", (0.45, 0.02, 0.015), rough=0.35)
dark = comp.mat("desk_dark", (0.05, 0.05, 0.05), rough=0.6)
top = M("desk_top", comp.box((W, D, 0.03), at=(0, 0, H - 0.015)), maple)
comp.bevel(top, 0.01, 3)
comp.uv_box(top, 1.0)
PW = 0.42
body = [comp.box((0.02, D - 0.04, H - 0.03), at=(-W / 2 + 0.03, 0.0, (H - 0.03) / 2)),
        comp.box((0.02, D - 0.04, H - 0.03), at=(W / 2 - 0.03, 0.0, (H - 0.03) / 2)),
        comp.box((0.02, D - 0.04, H - 0.03), at=(W / 2 - 0.03 - PW, 0.0, (H - 0.03) / 2)),
        comp.box((W - 0.08, 0.016, 0.38), at=(0, D / 2 - 0.05, H - 0.03 - 0.19)),
        comp.box((PW, D - 0.04, 0.02), at=(W / 2 - 0.03 - PW / 2, 0, 0.07)),
        comp.box((PW, 0.016, H - 0.1), at=(W / 2 - 0.03 - PW / 2, D / 2 - 0.03, (H - 0.03) / 2 + 0.03))]
b = M("desk_body", comp.merge(*body), white)
comp.bevel(b, 0.002, 2)
feet = [comp.cyl(0.015, 0.008, at=(x, y, 0), seg=12) for x in (-W / 2 + 0.03, W / 2 - 0.03, W / 2 - 0.03 - PW) for y in (-D / 2 + 0.06, D / 2 - 0.06)]
M("desk_feet", comp.merge(*feet), dark)
# the drawers: a front, a box behind it, a pull
dx = W / 2 - 0.03 - PW / 2
drawers = []
DHs = [(0.615, 0.17), (0.435, 0.17), (0.215, 0.25)]
for i, (zc, dh) in enumerate(DHs):
    p = comp.pivot(col, root, f"desk_drawer_{i + 1}", (dx, -D / 2 + 0.02, zc))
    fw = PW - 0.026
    box = comp.merge(comp.box((fw, 0.018, dh - 0.006), at=(dx, -D / 2 + 0.029, zc)),
                     comp.box((fw - 0.04, 0.5, 0.008), at=(dx, -D / 2 + 0.28, zc - dh / 2 + 0.02)),
                     comp.box((0.012, 0.5, dh - 0.05), at=(dx - fw / 2 + 0.026, -D / 2 + 0.28, zc - 0.01)), comp.box((0.012, 0.5, dh - 0.05), at=(dx + fw / 2 - 0.026, -D / 2 + 0.28, zc - 0.01)),
                     comp.box((fw - 0.04, 0.012, dh - 0.05), at=(dx, -D / 2 + 0.53, zc - 0.01)))
    o = M(f"desk_drawer_{i + 1}_box", box, white, parent=p)
    comp.bevel(o, 0.002, 2)
    pull = comp.tube([(dx - 0.06, -D / 2 + 0.02, zc), (dx - 0.055, -D / 2 - 0.012, zc), (dx + 0.055, -D / 2 - 0.012, zc), (dx + 0.06, -D / 2 + 0.02, zc)], 0.007, res=8, sides=4)
    M(f"desk_drawer_{i + 1}_pull", pull, red, parent=p, smooth=True)
    drawers.append(p)
# what's in the top drawer
rnd = random.Random(7)
stuff = []
pcols = [(0.9, 0.75, 0.1), (0.85, 0.1, 0.1), (0.1, 0.4, 0.8), (0.1, 0.6, 0.25), (0.9, 0.45, 0.1)]
for i, c in enumerate(pcols):
    m = comp.mat(f"desk_pencil_{i + 1}", _lib.srgb(c), rough=0.5)
    pc = comp.merge(comp.cyl(0.0037, 0.16, seg=6, axis="Y"), comp.cyl(0.0005, 0.014, at=(0, -0.014, 0), seg=6, r2=0.0037, axis="Y"))
    xf(pc, R(rnd.uniform(-14, 14), "Z") @ T(0, 0, 0))
    xf(pc, T(dx - 0.12 + i * 0.03, -D / 2 + 0.1 + rnd.uniform(0, 0.05), DHs[0][0] - DHs[0][1] / 2 + 0.029))
    M(f"desk_pencil_{i + 1}", pc, m, parent=drawers[0])
M("desk_ruler", xf(comp.box((0.03, 0.3, 0.002)), T(dx + 0.12, -D / 2 + 0.25, DHs[0][0] - DHs[0][1] / 2 + 0.026)), comp.mat("desk_ruler", (0.95, 0.85, 0.3), rough=0.3, alpha=0.7), parent=drawers[0])
# pencil groove and cable cap on the top
M("desk_groove", comp.box((0.4, 0.02, 0.001), at=(-0.3, -D / 2 + 0.06, H + 0.0003)), comp.mat("desk_groove", (0.55, 0.42, 0.28), rough=0.6))
M("desk_cable_cap", comp.merge(comp.cyl(0.03, 0.003, at=(-0.45, D / 2 - 0.07, H), seg=24), comp.cyl(0.012, 0.004, at=(-0.45, D / 2 - 0.06, H), seg=12)), dark)
# stickers on the left side panel (toward the room when the desk is on the side wall)
scol = [(0.95, 0.2, 0.3), (0.2, 0.7, 0.9), (0.98, 0.85, 0.2), (0.3, 0.8, 0.4), (0.6, 0.3, 0.8)]
for i, c in enumerate(scol):
    r = rnd.uniform(0.022, 0.04)
    st = comp.cyl(r, 0.0006, seg=[5, 24, 6, 24, 3][i], axis="X")
    xf(st, R(rnd.uniform(0, 60), "X"))
    xf(st, T(-W / 2 + 0.0195 - 0.0006, rnd.uniform(-0.2, 0.2), rnd.uniform(0.25, 0.6)))
    M(f"desk_sticker_{i + 1}", st, comp.mat(f"desk_sticker_{i + 1}", _lib.srgb(c), rough=0.4))
comp.channel("drawer", [(drawers[0], "location", 1, drawers[0].location.y, drawers[0].location.y - 0.3)])
comp.channel("drawers", [(d, "location", 1, d.location.y, d.location.y - 0.05) for d in drawers])
comp.export(col, root, _lib.PLACE, "desk", made="blender/components/bedroom/desk.py",
            source="own geometry (a generic flat-pack desk); top: https://polyhaven.com/a/white_maple_veneer", license="ours; texture CC0", credit="Poly Haven (white_maple_veneer)",
            rig={"drawer": "the pedestal's top drawer (desk_drawer_1) out 0.3 m toward the front", "drawers": "all three drawers out 5 cm"},
            notes="top 0.75 m up; the pedestal is on its right (+x)")
