# laundromat/floor: the laundromat's floor, 9 x 6.4 m of worn checkered tile on a slab (Poly Haven's floor_tiles_06,
# CC0, laid so a tile is 0.4 m), its top at z 0 and its centre at the origin, with a chrome floor drain before the washers
# and a rubber-backed entrance mat by the door. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, T, R, S, xf

col, root = comp.fresh("floor")
M = _lib.maker(col, root)
tile = comp.ph_texture("laundromat_floor", "floor_tiles_06", tile=1.6)
chrome = comp.mat("laundromat_drain", (0.75, 0.76, 0.78), rough=0.25, metal=0.8)
dark = comp.mat("laundromat_dark", (0.03, 0.03, 0.035), rough=0.6)
mat_m = comp.ph_texture("laundromat_mat", "rubber_tiles", tile=1.0, res="1k", tint=(0.55, 0.55, 0.6))
edge = comp.mat("laundromat_mat_edge", (0.02, 0.02, 0.022), rough=0.7)
L, Dp = 9.0, 6.4
f = M("floor_tiles", comp.box((L, Dp, 0.15), at=(0, 0, -0.075)), tile)
comp.uv_box(f, 1.0)
# the drain: a round chrome grate, its slots dark, set flush
DX, DY = 2.6, 0.9
M("floor_drain", turn([(0.0, 0.0025), (0.07, 0.0025), (0.078, 0.0)], seg=32, at=(DX, DY, 0)), chrome, smooth=True)
M("floor_drain_slots", comp.merge(*[comp.box((0.012, 2 * math.sqrt(max(0.0, 0.06 ** 2 - x ** 2)), 0.001), at=(DX + x, DY, 0.003)) for x in (-0.045, -0.0225, 0.0, 0.0225, 0.045)],
                                    *[disc(0.004, seg=8, at=(DX + 0.064 * math.cos(a), DY + 0.064 * math.sin(a), 0.0031), axis="Z") for a in (0.6, 2.2, 3.8, 5.4)]), dark)
# the entrance mat, by the storefront's door (the storefront stands along the floor's left edge, its door at the front)
MX, MY = -L / 2 + 0.85, -Dp / 2 + 1.1
m = M("floor_mat", rbox((1.2, 0.9, 0.008), at=(MX, MY, 0.004), r=0.003, seg=2), mat_m)
comp.uv_box(m, 1.0)
M("floor_mat_edge", comp.merge(rbox((1.3, 0.05, 0.006), at=(MX, MY - 0.475, 0.003), r=0.002, seg=2), rbox((1.3, 0.05, 0.006), at=(MX, MY + 0.475, 0.003), r=0.002, seg=2),
                                 rbox((0.05, 1.0, 0.006), at=(MX - 0.625, MY, 0.003), r=0.002, seg=2), rbox((0.05, 1.0, 0.006), at=(MX + 0.625, MY, 0.003), r=0.002, seg=2)), edge)
comp.export(col, root, _lib.PLACE, "floor", made="blender/components/laundromat/floor.py",
            source="own geometry; tiles: https://polyhaven.com/a/floor_tiles_06; mat: https://polyhaven.com/a/rubber_tiles", license="ours; textures CC0", credit="Poly Haven (floor_tiles_06, rubber_tiles)", rig={},
            notes="9 x 6.4 m, top at z 0. The back wall stands along its far edge, the storefront along its left edge, the side wall along its right.")
