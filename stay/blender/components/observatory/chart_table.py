# observatory/chart-table: the observer's table: Poly Haven's wooden_table_02 (CC0) with our own things on it: a star
# chart (our own painted sheet, 86 x 58 cm, one corner curling under a brass paperweight), a planisphere (a card
# sleeve with an oval window over a turning star disc), an observing log open on two pages with a pencil, a brass
# loupe, and Poly Haven's vintage_binocular (CC0). The table stands at the origin, its long side along x.
# Rig: "dial" turns the planisphere's star disc one whole turn in its sleeve; "page" lifts the log's right-hand page
# 150 degrees over its spine.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, torus, rbox, sphere, T, R, S, xf

col, root = comp.fresh("chart_table")
M = _lib.maker(col, root)
tbl, credit = _lib.ph_into(col, root, "wooden_table_02", "chart_table_table", res="2k")
lo, hi = comp.box_of(tbl)
TOP = hi.z
chart_m = _lib.image_mat("chart_table_chart", _lib.paint("chart_sheet", 1536, 1024, _lib.star_chart(seed=4)), rough=0.7)
disc_m = _lib.image_mat("chart_table_planisphere", _lib.paint("planisphere", 768, 768, _lib.star_chart(polar=True, seed=9, paper=(0.1, 0.13, 0.24), ink=(0.92, 0.9, 0.8))), rough=0.6)
card = comp.mat("chart_table_card", (0.75, 0.7, 0.55), rough=0.7)
paper = comp.mat("chart_table_paper", (0.88, 0.85, 0.76), rough=0.8)
cloth = comp.mat("chart_table_log_cover", (0.25, 0.05, 0.05), rough=0.6)
brass = comp.mat("chart_table_brass", (0.78, 0.58, 0.22), rough=0.25, metal=1.0)
ink = comp.mat("chart_table_ink", (0.08, 0.08, 0.1), rough=0.6)
glass = comp.mat("chart_table_glass", (0.7, 0.8, 0.85), rough=0.03, alpha=0.3)
# the chart: a sheet lying a little skew, its near right corner curled
sh = bmesh.new()
bmesh.ops.create_grid(sh, x_segments=24, y_segments=16, size=0.5)
for v in sh.verts:
    x, y = v.co.x, v.co.y
    curl = max(0.0, (x + y * -1) - 0.62)
    v.co = (x * 0.86, y * 0.58, 0.0015 + curl * curl * 1.6)
c = M("chart_table_chart", sh, chart_m, smooth=True)
_lib.uv_planar(c, (-0.43, -0.29), (0.43, 0.29), axes=(0, 1))
for o in (c,):
    o.matrix_world = T(-0.1, 0.03, TOP) @ R(4, "Z")
M("chart_table_paperweight", xf(lathe([(0.0, 0.0), (0.03, 0.0), (0.032, 0.006), (0.022, 0.014), (0.012, 0.02), (0.016, 0.03), (0.012, 0.04), (0.0, 0.043)], seg=24), T(-0.42, 0.22, TOP + 0.002)), brass)
# the planisphere
PX, PY = 0.36, -0.14
dial = comp.pivot(col, root, "chart_table_dial", (PX, PY, TOP + 0.004))
d = M("chart_table_star_disc", comp.cyl(0.125, 0.002, at=(PX, PY, TOP + 0.003), seg=64), disc_m, parent=dial)
_lib.uv_planar(d, (PX - 0.137, PY - 0.137), (PX + 0.137, PY + 0.137), axes=(0, 1))
M("chart_table_sleeve_back", rbox((0.27, 0.27, 0.002), at=(PX, PY + 0.005, TOP + 0.001), r=0.0008, seg=1), card, smooth=False)
sl = bmesh.new()                                 # the sleeve's front: a card with an oval window, as a ring of quads
n = 48
outer = [(0.135 * max(-1, min(1, 1.45 * math.cos(a))), 0.135 * max(-1, min(1, 1.45 * math.sin(a)))) for a in (2 * math.pi * i / n for i in range(n))]
inner = [(0.1 * math.cos(a), 0.072 * math.sin(a) - 0.02) for a in (2 * math.pi * i / n for i in range(n))]
vo = [sl.verts.new((PX + x, PY + 0.005 + y, TOP + 0.006)) for x, y in outer]
vi = [sl.verts.new((PX + x, PY + 0.005 + y, TOP + 0.006)) for x, y in inner]
for i in range(n):
    sl.faces.new((vo[i], vo[(i + 1) % n], vi[(i + 1) % n], vi[i]))
M("chart_table_sleeve", sl, card, smooth=False)
M("chart_table_rivet", comp.cyl(0.006, 0.004, at=(PX, PY, TOP + 0.005), seg=12), brass)
# the log, open; a pencil; a loupe
LX, LY = -0.3, -0.2
M("chart_table_log_cover", rbox((0.34, 0.24, 0.008), at=(LX, LY, TOP + 0.004), r=0.002, seg=1), cloth, smooth=False)
pg = lambda sx: [comp.box((0.16, 0.225, 0.012), at=(LX + sx * 0.082, LY, TOP + 0.014))]
M("chart_table_log_pages", comp.merge(*pg(-1), *pg(1)), paper, smooth=False)
M("chart_table_log_lines", comp.merge(*[comp.box((0.13, 0.0012, 0.0006), at=(LX + sx * 0.082, LY + 0.09 - i * 0.016, TOP + 0.0204)) for sx in (-1, 1) for i in range(12)]), ink, smooth=False)
page = comp.pivot(col, root, "chart_table_page", (LX, LY, TOP + 0.021))
M("chart_table_log_page", comp.merge(comp.box((0.158, 0.223, 0.0008), at=(LX + 0.08, LY, TOP + 0.0214)), *[comp.box((0.13, 0.0012, 0.0005), at=(LX + 0.082, LY + 0.09 - i * 0.016, TOP + 0.022)) for i in range(7)]), paper, parent=page, smooth=False)
M("chart_table_pencil", xf(comp.merge(comp.cyl(0.0035, 0.15, seg=6), comp.cyl(0.0035, 0.012, at=(0, 0, 0.15), seg=6, r2=0.0005)), T(LX + 0.2, LY - 0.06, TOP + 0.004) @ R(70, "Z") @ R(90, "Y")), comp.mat("chart_table_pencil", (0.75, 0.55, 0.1), rough=0.5), smooth=False)
M("chart_table_loupe", comp.merge(torus(0.035, 0.005, seg=28, sides=6, at=(0.12, 0.2, TOP + 0.03)), *[_lib.rod((0.12 + 0.035 * math.cos(a), 0.2 + 0.035 * math.sin(a), TOP + 0.03), (0.12 + 0.03 * math.cos(a), 0.2 + 0.03 * math.sin(a), TOP), 0.003, seg=6) for a in (0.3, 2.4, 4.5)],
                                     torus(0.03, 0.003, seg=28, sides=4, at=(0.12, 0.2, TOP + 0.002))), brass)
M("chart_table_loupe_glass", comp.cyl(0.034, 0.003, at=(0.12, 0.2, TOP + 0.029), seg=28), glass)
bino, c2 = _lib.ph_into(col, root, "vintage_binocular", "chart_table_binocular", at=(0.38, 0.2, TOP + 0.03), turn=200, res="1k")
blo, bhi = comp.box_of(bino)
for o in bino:                                   # set it down on the table (its parts are placed about their own middles)
    o.matrix_world = T(0, 0, TOP - blo.z) @ o.matrix_world
_lib.channel("dial", [(dial, "rotation_euler", 2, 0, 2 * math.pi)])
_lib.channel("page", [(page, "rotation_euler", 1, 0, math.radians(-150))])
comp.export(col, root, "observatory", "chart_table", made="blender/components/observatory/chart_table.py", source="https://polyhaven.com/a/wooden_table_02 and https://polyhaven.com/a/vintage_binocular; the charts, planisphere, log, loupe and paperweight are our own",
            license="CC0 (models); ours", credit=f"{credit}; {c2}",
            rig={"dial": "the planisphere's star disc one whole turn in its sleeve", "page": "the log's right-hand page lifts 150 degrees over the spine"})
