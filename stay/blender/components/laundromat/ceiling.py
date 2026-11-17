# laundromat/ceiling: a module of the laundromat's suspended ceiling, 3.6 x 1.2 m, its underside at z 0 and its centre
# the origin, modelled by hand: a white T-bar grid at 0.6 m, eleven lay-in acoustic tiles (Poly Haven's
# ceiling_interior) with one of them water-stained, an air diffuser in one bay, a sprinkler head, a 1.2 x 0.6 m
# opening in the front row for a troffer (the tubes component, at x 0, y -0.3), and the dark of the void above. The
# room's ceiling is this module side by side and row behind row. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, T, R, S, xf

col, root = comp.fresh("ceiling")
M = _lib.maker(col, root)
tile_m = comp.ph_texture("ceiling_tile", "ceiling_interior", tile=1.2, res="1k", tint=(0.93, 0.93, 0.9), grey=True)
stain_m = comp.ph_texture("ceiling_tile_stained", "ceiling_interior", tile=1.2, res="1k", tint=(0.8, 0.7, 0.5), grey=True)
bar = comp.mat("ceiling_grid", (0.9, 0.9, 0.88), rough=0.45)
dark = comp.mat("laundromat_dark", (0.03, 0.03, 0.035), rough=0.6)
brass = comp.mat("ceiling_sprinkler", (0.7, 0.55, 0.25), rough=0.3, metal=0.9)
L, Dp = 3.6, 1.2
bars = [comp.box((L, 0.024, 0.003), at=(0, y, 0.0015)) for y in (-0.6, 0.0, 0.6)] + [comp.box((0.024, Dp, 0.003), at=(x, 0, 0.0015)) for x in [-1.8 + 0.6 * i for i in range(7)] if not (abs(x) < 0.01)]
bars += [comp.box((0.024, 0.6, 0.003), at=(0, 0.3, 0.0015))]
bars += [comp.box((L, 0.002, 0.03), at=(0, y, 0.018)) for y in (-0.6, 0.0, 0.6)]
M("ceiling_grid", comp.merge(*bars), bar)
tiles, stained = [], []
for i in range(6):
    for j in range(2):
        x, y = -1.5 + 0.6 * i, -0.3 + 0.6 * j
        if j == 0 and i in (2, 3):
            continue                     # the troffer's opening
        if j == 1 and i == 5:
            continue                     # the diffuser's bay
        t = rbox((0.572, 0.572, 0.016), at=(x, y, 0.011), r=0.004, seg=2)
        (stained if (i, j) == (0, 1) else tiles).append(t)
to = M("ceiling_tiles", comp.merge(*tiles), tile_m)
comp.uv_box(to, 1.0)
so = M("ceiling_tile_stained", comp.merge(*stained), stain_m)
comp.uv_box(so, 1.0)
# the diffuser: a square frame and four stepped square cones
DX, DY = 1.5, 0.3
rings = [comp.merge(comp.box((0.574, 0.03, 0.004), at=(DX, DY + s * 0.272, 0.004)), comp.box((0.03, 0.574, 0.004), at=(DX + s * 0.272, DY, 0.004))) for s in (-1, 1)]
for k in range(4):
    a, z = 0.21 - k * 0.055, 0.006 + k * 0.01
    for s in (-1, 1):
        rings.append(xf(xf(comp.box((2 * a + 0.03, 0.03, 0.002)), R(s * 35, "X")), T(DX, DY + s * a, z)))
        rings.append(xf(xf(comp.box((0.03, 2 * a + 0.03, 0.002)), R(-s * 35, "Y")), T(DX + s * a, DY, z)))
rings.append(comp.box((0.07, 0.07, 0.003), at=(DX, DY, 0.045)))
M("ceiling_diffuser", comp.merge(*rings), bar)
M("ceiling_diffuser_throat", comp.box((0.5, 0.5, 0.004), at=(DX, DY, 0.06)), dark)
M("ceiling_sprinkler", comp.merge(turn([(0.03, 0.0), (0.032, -0.004), (0.0, -0.004)], seg=20, at=(-0.9, 0.3, 0)), comp.cyl(0.008, 0.03, at=(-0.9, 0.3, -0.032), seg=10),
                                    comp.cyl(0.016, 0.002, at=(-0.9, 0.3, -0.036), seg=14), comp.box((0.003, 0.02, 0.028), at=(-0.9, 0.3, -0.02))), brass, smooth=True)
M("ceiling_void", comp.merge(comp.box((L, Dp, 0.12), at=(0, 0, 0.36)), comp.box((L, 0.01, 0.3), at=(0, 0.595, 0.15)), comp.box((0.01, Dp, 0.3), at=(-1.795, 0, 0.15)), comp.box((0.01, Dp, 0.3), at=(1.795, 0, 0.15))), dark)
comp.export(col, root, _lib.PLACE, "ceiling", made="blender/components/laundromat/ceiling.py",
            source="own geometry (a generic lay-in grid ceiling); tiles: https://polyhaven.com/a/ceiling_interior", license="ours; texture CC0", credit="Poly Haven (ceiling_interior)", rig={},
            notes="Underside at z 0. The troffer (tubes) fits its opening at x 0, y -0.3 (raea: z +0.3 from the module's centre).")
