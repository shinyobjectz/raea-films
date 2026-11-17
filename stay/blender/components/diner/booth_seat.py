# diner/booth-seat: one bench of a booth, 1.2 m wide, modelled by hand: a black plinth with a chrome kick strip, a red
# vinyl seat cushion with a waterfall front, a channel-tufted back of six vertical rolls with a cream cap roll and
# white piping, and a boxed end panel. Seat 0.46 m up, 1.07 m to the top. It faces -y; two of them face each other
# across diner/booth-table.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("booth_seat")
M = _lib.maker(col, root)
W = 1.2
vinyl = _lib.ph_plain("booth_vinyl", "leather_red_03", (0.3, 0.006, 0.01))
cream = comp.ph_texture("booth_cream", "leather_white", tile=0.3, res="1k", tint=(0.95, 0.9, 0.78))
black = comp.mat("booth_plinth", (0.025, 0.025, 0.028), rough=0.5)
chrome = comp.mat("booth_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
piping = comp.mat("booth_piping", (0.85, 0.83, 0.78), rough=0.45)

M("booth_seat_plinth", comp.box((W, 0.5, 0.3), at=(0, 0.03, 0.15)), black, smooth=False)
M("booth_seat_kick", comp.box((W + 0.004, 0.008, 0.05), at=(0, -0.222, 0.05)), chrome, smooth=False)
s = comp.box((W - 0.01, 0.54, 0.16), at=(0, -0.01, 0.38))
bmesh.ops.subdivide_edges(s, edges=s.edges[:], cuts=3, use_grid_fill=True)
for v in s.verts:
    if v.co.z > 0.4 and v.co.y < -0.2:
        v.co.z -= 0.035
so = M("booth_seat_cushion", s, vinyl)
comp.bevel(so, 0.03, 4, angle=30)
comp.uv_box(so, 0.3)
M("booth_seat_shell", comp.box((W, 0.1, 1.0), at=(0, 0.3, 0.5)), black, smooth=False)
n = 6
rw = (W - 0.02) / n
rolls = []
for i in range(n):
    x = -W / 2 + 0.01 + rw * (i + 0.5)
    r = rbox((rw - 0.004, 0.11, 0.5), at=(x, 0.215, 0.72), r=0.035, seg=4)
    xf(r, T(0, -0.215, -0.47)); xf(r, R(7, "X")); xf(r, T(0, 0.215, 0.47))
    rolls.append(r)
ro = M("booth_seat_back", comp.merge(*rolls), vinyl)
comp.uv_box(ro, 0.3)
cap = rbox((W, 0.17, 0.11), at=(0, 0.255, 1.015), r=0.045, seg=4)
co = M("booth_seat_cap", cap, cream)
comp.uv_box(co, 1.0)
M("booth_seat_piping", comp.merge(comp.cyl(0.006, W, at=(-W / 2, 0.168, 0.962), seg=8, axis="X"), comp.cyl(0.006, W - 0.01, at=(-W / 2 + 0.005, -0.275, 0.445), seg=8, axis="X")), piping)
comp.export(col, root, "diner", "booth_seat", made="blender/components/diner/booth_seat.py",
            source="own geometry (a generic channel-back diner booth bench); vinyl: https://polyhaven.com/a/leather_red_03, https://polyhaven.com/a/leather_white", license="ours; textures CC0", credit="Poly Haven (leather_red_03, leather_white)")
