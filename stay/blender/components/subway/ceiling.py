# subway/ceiling: 20 m of the station's roof, 7.7 m across, modelled by hand: a concrete slab (Poly Haven's
# dirty_concrete, CC0, painted pale) on downstand beams every 5 m and a riveted steel girder along the column line
# over the platform's edge, with two conduit runs feeding the lamps. Origin: over the track's centre, the slab's
# underside at z 0 (it sits 4.5 m above the bed); the beams hang 0.45 m below. A shell part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt, XL, XB, LEN

col, root = comp.fresh("ceiling")
conc = comp.ph_texture("ceiling_concrete", "dirty_concrete", tile=3.0, tint=(0.8, 0.78, 0.72))
steel = comp.mat("ceiling_girder", (0.03, 0.09, 0.06), rough=0.5)
pipe = comp.mat("ceiling_conduit", (0.3, 0.3, 0.31), rough=0.5, metal=0.9)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
Y0, Y1, GX = -LEN / 2, LEN / 2, 2.3
s = M("ceiling_slab", comp.merge(slab(XL - 0.15, XB + 0.15, Y0, Y1, 0.0, 0.3), *[slab(XL - 0.15, XB + 0.15, y - 0.2, y + 0.2, -0.45, 0.0) for y in (-7.5, -2.5, 2.5, 7.5)]), conc)
comp.uv_box(s)
g = [slab(GX - 0.15, GX + 0.15, Y0, Y1, -0.03, 0.0), slab(GX - 0.15, GX + 0.15, Y0, Y1, -0.45, -0.42), slab(GX - 0.012, GX + 0.012, Y0, Y1, -0.42, -0.03)]
g += [slab(GX - 0.14, GX + 0.14, y - 0.008, y + 0.008, -0.42, -0.03) for y in [Y0 + 1.25 + i * 2.5 for i in range(8)]]
M("ceiling_girder", comp.merge(*g), steel)
riv = [bolt((GX + sx * 0.1, Y0 + 0.1 + i * 0.2, -0.462), 0.012, 0.012, seg=8) for sx in (-1, 1) for i in range(100)]
M("ceiling_rivets", comp.merge(*riv), steel)
M("ceiling_conduits", comp.merge(*[comp.cyl(0.015, LEN, at=(x, Y0, -0.02), seg=8, axis="Y") for x in (3.9, -0.4)]), pipe)
comp.export(col, root, "subway", "ceiling", made="blender/components/subway/ceiling.py", source="own geometry; texture https://polyhaven.com/a/dirty_concrete", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="Shell part, 20 m: origin over the track's centre at the slab's underside; place it 4.5 m up. The girder runs 2.3 m right of the track, over subway/column.")
