# cathedral/aisle-wall: one 4.5 m bay of the aisle's outer wall, 7.2 m high and 0.6 m thick, modelled by hand: ashlar
# with a splayed lancet of pale quarry glass (cathedral_grisaille, which glows) under a hood mould, a sloped sill, a
# stone bench along its foot and a string course under the window. Stands on the floor, its back at y 0. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("aisle_wall")
stone, dressed = L.stone(), L.plain_stone()
glass = L.grisaille()
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
BAY, H, TH = 4.5, 7.2, 0.6
win, apex = L.arch(1.2, 5.0, 2.7, n=12)
w = M("aisle_wall_wall", L.plate([L.rect(-BAY / 2, 0, BAY / 2, H), win], TH), stone)
L.finish(w, 1.0)
g = M("aisle_wall_glass", xf(L.plate([L.arch(1.24, 5.0, 2.68, n=12)[0]], 0.012), T(0, -0.12, 0)), glass)
L.uv_planar(g, -0.62, 2.68, 1.24, 3.72)
M("aisle_wall_glazing_bars", comp.merge(*[comp.box((1.2, 0.02, 0.02), at=(0, -0.14, 3.05 + k * 0.42)) for k in range(6)] + [comp.box((0.02, 0.02, 3.2), at=(0, -0.14, 4.3))]), comp.mat("cathedral_lead", (0.05, 0.05, 0.055), rough=0.5, metal=0.5))
M("aisle_wall_hood", L.sweep([(x, -TH - 0.02, z) for x, z in L.arch(1.42, 5.0, 4.9, n=12)[0][2:]], 0.055), dressed, smooth=True)
M("aisle_wall_sill", xf(xf(comp.box((1.3, 0.5, 0.06)), R(-28, "X")), T(0, -TH + 0.22, 2.66)), dressed)
sc = M("aisle_wall_string_course", comp.merge(comp.box((BAY, 0.09, 0.09), at=(0, -TH - 0.045, 2.35)), comp.cyl(0.04, BAY, at=(-BAY / 2, -TH - 0.08, 2.32), seg=10, axis="X")), dressed)
b = M("aisle_wall_bench", comp.merge(comp.box((BAY, 0.42, 0.42), at=(0, -TH - 0.21, 0.21)), comp.box((BAY, 0.47, 0.07), at=(0, -TH - 0.235, 0.455))), dressed)
comp.bevel(b, 0.015, 2)
comp.export(col, root, "cathedral", "aisle_wall", made="blender/components/cathedral/aisle_wall.py",
            source="own geometry and glass painting; stone: https://polyhaven.com/a/large_sandstone_blocks_01", license="ours; texture CC0", credit="Poly Haven (large_sandstone_blocks_01)",
            rig={"glow": "in the scene: the material cathedral_grisaille's glow (the daylight in the lancet)"})
