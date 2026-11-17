# bedroom/wall-left: the room's fourth-side wall, 3.6 x 2.5 m, the one facing the desk (behind the bed's head): the
# same pale-blue plaster, skirting and star border, plain but for a double socket, a height chart pencilled up the
# plaster with its dated marks (a paper chart taped on, 0.6 to 1.5 m) and a row of three coat pegs.
# Its room face is at y 0, its foot at z 0, centred in x. Off the stand (it would stand between the stand's sun and
# the room); library-bedroom-walls shows it.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("wall_left")
M = _lib.plain_wall(col, root, "wall_left", _lib.ROOM_D)
plate = comp.mat("wall_plate", (0.88, 0.86, 0.78), rough=0.35)
so = M("wall_left_socket", comp.box((0.075, 0.006, 0.115), at=(0.9, -0.003, 0.32)), plate)
comp.bevel(so, 0.002, 2)
M("wall_left_socket_holes", comp.merge(*[comp.box((0.003, 0.002, 0.012), at=(0.9 + sx, -0.0065, 0.32 + dz)) for sx in (-0.007, 0.007) for dz in (-0.021, 0.029)]), comp.mat("wall_socket_hole", (0.03, 0.03, 0.03), rough=0.6))
# the height chart
paper = comp.mat("wall_chart_paper", (0.93, 0.9, 0.78), rough=0.7)
ink = comp.mat("wall_chart_ink", (0.05, 0.08, 0.3), rough=0.6)
red = comp.mat("wall_chart_mark", (0.5, 0.02, 0.02), rough=0.6)
CX = -0.2
M("wall_left_chart", comp.box((0.16, 0.0006, 0.95), at=(CX, -0.0006, 1.06)), paper)
ticks = [comp.box((0.05 if i % 5 == 0 else 0.025, 0.0004, 0.002), at=(CX - 0.08 + (0.025 if i % 5 == 0 else 0.0125), -0.0011, 0.6 + i * 0.02)) for i in range(46)]
nums = [xf(comp.text(str(60 + i * 10), 0.022, depth=0.0004), T(CX + 0.02, -0.0011, 0.6 + i * 0.1)) for i in range(10)]
M("wall_left_chart_ticks", comp.merge(*ticks, *nums), ink)
marks = [comp.merge(comp.box((0.07, 0.0004, 0.003), at=(CX + 0.04, -0.0012, z)), xf(comp.text(label, 0.014, depth=0.0004), T(CX + 0.045, -0.0012, z + 0.014))) for z, label in ((1.02, "'92"), (1.11, "'93"), (1.19, "'94"), (1.26, "'95"), (1.34, "'96"))]
M("wall_left_chart_marks", comp.merge(*marks), red)
# coat pegs on a rail
pine = comp.ph_texture("wall_peg_rail", "stained_pine", tile=0.9, res="1k")
rail = M("wall_left_peg_rail", comp.box((0.5, 0.018, 0.07), at=(-1.1, -0.009, 1.55)), pine)
comp.bevel(rail, 0.003, 2); comp.uv_box(rail, 1.0)
pg = M("wall_left_pegs", comp.merge(*[comp.merge(comp.cyl(0.009, 0.06, at=(-1.1 + dx, -0.078, 1.55), seg=12, axis="Y"), comp.cyl(0.014, 0.012, at=(-1.1 + dx, -0.086, 1.55), seg=12, axis="Y")) for dx in (-0.17, 0, 0.17)]), pine, smooth=True)
comp.uv_box(pg, 1.0)
comp.export(col, root, _lib.PLACE, "wall_left", made="blender/components/bedroom/wall_left.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall, rail: https://polyhaven.com/a/stained_pine", license="ours; textures CC0", credit="Poly Haven (painted_plaster_wall, stained_pine)")
