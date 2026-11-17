# bedroom/wall-side: the room's side wall, 3.6 x 2.5 m, the one the desk stands against, with the doorway: the same
# pale-blue painted plaster and star border as the window wall, a moulded skirting, a doorway 0.82 x 2.03 m (its
# centre 0.85 m right of the wall's centre) that the "door" component stands in, a light switch by the doorway and a
# double socket over the skirting. Its room face is at y 0, its foot at z 0, centred in x.
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import ROOM_D, ROOM_H
col, root = comp.fresh("wall_side")
M = _lib.maker(col, root)
TH, DW, DH, DX = 0.14, 0.82, 2.03, 0.85
plaster = comp.ph_texture("wall_plaster", "painted_plaster_wall", tile=2.0, res="1k", tint=(0.58, 0.74, 0.86), grey=True)
white = comp.mat("wall_trim", (0.9, 0.89, 0.84), rough=0.4)
border = comp.mat("wall_border", (0.03, 0.07, 0.3), rough=0.6)
plate = comp.mat("wall_plate", (0.88, 0.86, 0.78), rough=0.35)
dark = comp.mat("wall_socket_hole", (0.03, 0.03, 0.03), rough=0.6)
L, Rr = -ROOM_D / 2, ROOM_D / 2
x0, x1 = DX - DW / 2, DX + DW / 2
w = M("wall_side_plaster", comp.merge(comp.box((x0 - L, TH, ROOM_H), at=((x0 + L) / 2, TH / 2, ROOM_H / 2)), comp.box((Rr - x1, TH, ROOM_H), at=((Rr + x1) / 2, TH / 2, ROOM_H / 2)),
                                      comp.box((DW, TH, ROOM_H - DH), at=(DX, TH / 2, (ROOM_H + DH) / 2))), plaster)
comp.uv_box(w, 1.0)
sk = M("wall_side_skirting", comp.merge(comp.box((x0 - L - 0.07, 0.018, 0.12), at=((x0 + L - 0.07) / 2, -0.009, 0.06)), comp.box((x0 - L - 0.07, 0.01, 0.025), at=((x0 + L - 0.07) / 2, -0.005, 0.132)),
                                        comp.box((Rr - x1 - 0.07, 0.018, 0.12), at=((Rr + x1 + 0.07) / 2, -0.009, 0.06))), white)
comp.bevel(sk, 0.004, 2)
M("wall_side_border", comp.box((ROOM_D, 0.002, 0.09), at=(0, -0.001, 2.28)), border)
rnd = random.Random(9)
stars = []
for i in range(24):
    s = comp.cyl(0.022, 0.0015, seg=5, axis="Y")
    comp.xf(s, comp.R(rnd.uniform(0, 72), "Y")); comp.xf(s, comp.T(L + 0.08 + i * 0.15, -0.0035, 2.28))
    stars.append(s)
M("wall_side_border_stars", comp.merge(*stars), comp.mat("wall_border_star", (0.9, 0.6, 0.06), rough=0.6))
# the switch: a plate, a rocker, two screws
sx = x0 - 0.2
sw = M("wall_side_switch", comp.merge(comp.box((0.075, 0.006, 0.115), at=(sx, -0.003, 1.2)), comp.box((0.022, 0.012, 0.045), at=(sx, -0.009, 1.2))), plate)
comp.bevel(sw, 0.002, 2)
M("wall_side_switch_screws", comp.merge(comp.cyl(0.003, 0.002, at=(sx, -0.008, 1.245), seg=8, axis="Y"), comp.cyl(0.003, 0.002, at=(sx, -0.008, 1.155), seg=8, axis="Y")), comp.mat("wall_screw", (0.6, 0.6, 0.6), rough=0.3, metal=1.0))
# the socket
ox = -1.2
so = M("wall_side_socket", comp.box((0.075, 0.006, 0.115), at=(ox, -0.003, 0.32)), plate)
comp.bevel(so, 0.002, 2)
holes = []
for dz in (-0.025, 0.025):
    holes += [comp.box((0.003, 0.002, 0.012), at=(ox - 0.007, -0.0065, 0.32 + dz + 0.004)), comp.box((0.003, 0.002, 0.012), at=(ox + 0.007, -0.0065, 0.32 + dz + 0.004)), comp.cyl(0.0028, 0.002, at=(ox, -0.0075, 0.32 + dz - 0.01), seg=8, axis="Y")]
M("wall_side_socket_holes", comp.merge(*holes), dark)
comp.export(col, root, _lib.PLACE, "wall_side", made="blender/components/bedroom/wall_side.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
            notes="doorway 0.82 x 2.03 m, its centre 0.85 m right (+x) of the wall's centre; the door component stands in it")
