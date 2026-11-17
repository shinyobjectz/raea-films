# subway/platform: 20 m of the platform, 4 m deep and 1.2 m above the track bed, modelled by hand: a concrete deck
# (Poly Haven's concrete_floor_worn_001, CC0) oversailing its supporting wall by half a metre, a timber rubbing board
# along the edge, a white nosing and the yellow safety line behind it (the shot's horizontal line), expansion
# joints every 5 m, a drain channel at the back, and under the overhang a refuge with two conduits.
# Origin: the track's centre on the bed (the edge is 1.5 m to the right). A shell part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, prism, slab, bolt, XL, XE, XB, LEN, PLAT

col, root = comp.fresh("platform")
deck = comp.ph_texture("platform_deck", "concrete_floor_worn_001", tile=2.5)
under = comp.ph_texture("platform_under", "dirty_concrete", tile=2.5, res="1k", tint=(0.3, 0.29, 0.28))
yellow = comp.mat("platform_line", (0.85, 0.6, 0.03), rough=0.55)
white = comp.mat("platform_nosing", (0.82, 0.82, 0.78), rough=0.5)
wood = comp.ph_texture("platform_board", "rough_wood", tile=0.9, res="1k", tint=(0.35, 0.3, 0.25))
dark = comp.mat("platform_joint", (0.02, 0.02, 0.02), rough=0.8)
pipe = comp.mat("platform_conduit", (0.2, 0.2, 0.2), rough=0.5, metal=0.8)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
Y0, Y1 = -LEN / 2, LEN / 2
d = M("platform_deck", slab(XE + 0.04, XB, Y0, Y1, PLAT - 0.22, PLAT), deck)
comp.uv_box(d)
u = M("platform_support", slab(XE + 0.5, XB, Y0, Y1, 0.0, PLAT - 0.22), under)
comp.uv_box(u)
b = M("platform_rubbing_board", slab(XE, XE + 0.04, Y0, Y1, PLAT - 0.16, PLAT - 0.005), wood)
comp.uv_box(b)
M("platform_nosing", slab(XE + 0.04, XE + 0.14, Y0, Y1, PLAT, PLAT + 0.003), white)
M("platform_line", slab(XE + 0.3, XE + 0.6, Y0, Y1, PLAT, PLAT + 0.003), yellow)
M("platform_joints", comp.merge(*[slab(XE + 0.04, XB, y - 0.006, y + 0.006, PLAT, PLAT + 0.002) for y in (-5, 0, 5)], slab(XB - 0.25, XB - 0.1, Y0, Y1, PLAT, PLAT + 0.002)), dark)
M("platform_conduits", comp.merge(*[comp.cyl(0.02, LEN, at=(XE + 0.46, Y0, z), seg=10, axis="Y") for z in (0.6, 0.7)], *[comp.box((0.012, 0.05, 0.2), at=(XE + 0.49, y, 0.65)) for y in range(-9, 10, 3)]), pipe, smooth=False)
comp.export(col, root, "subway", "platform", made="blender/components/subway/platform.py", source="own geometry; textures https://polyhaven.com/a/concrete_floor_worn_001, https://polyhaven.com/a/dirty_concrete, https://polyhaven.com/a/rough_wood", license="ours; textures CC0", credit="textures: Poly Haven",
            notes="Shell part, 20 m: origin at the track's centre on the bed; the deck's top is 1.2 m up, its edge 1.5 m right of the origin, its back 5.5 m right.")
