# garage/floor: one deck of the car park, a 20 x 14 m power-floated concrete slab 0.35 m thick, its top at z 0 and its
# middle at the origin (Poly Haven's garage_floor, CC0, at its real 1.89 m tile). Sawn joints every 5 m, and a linear
# drain along the aisle under a rusted grating (metal_grate_rusty). No rig: the puddles and the paint are their own parts.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("floor")
M = L.maker(col, root)
conc = comp.ph_texture("floor_concrete", "garage_floor", tile=1.886, res="2k", tint=(0.74, 0.86, 1.0))
grate = comp.ph_texture("floor_grate", "metal_grate_rusty", tile=0.5, res="1k", tint=(0.3, 0.3, 0.32), grey=True)
dark = comp.mat("floor_joint", (0.03, 0.03, 0.03), rough=0.9)
W, D, TH = 20.0, 14.0, 0.35
slab = M("floor_slab", comp.box((W, D, TH), at=(0, 0, -TH / 2)), conc)
comp.uv_box(slab, 1.0)
joints = [comp.box((0.012, D, 0.002), at=(x, 0, 0.0008)) for x in (-5, 0, 5)] + [comp.box((W, 0.012, 0.002), at=(0, y, 0.0008)) for y in (-3.5, 3.5)]
M("floor_joints", comp.merge(*joints), dark)
DY = -5.0
g = M("floor_drain_grating", comp.box((W - 0.4, 0.16, 0.006), at=(0, DY, 0.0015)), grate)
comp.uv_box(g, 1.0)
frame = [comp.box((W - 0.36, 0.02, 0.006), at=(0, DY + s * 0.09, 0.002)) for s in (-1, 1)] + [comp.box((0.02, 0.2, 0.007), at=(-W / 2 + 0.2 + i * (W - 0.4) / 10, DY, 0.002)) for i in range(11)]
M("floor_drain_frame", comp.merge(*frame), comp.mat("floor_drain_steel", (0.2, 0.19, 0.18), rough=0.55, metal=1.0))
L.look(col, "floor", eye=(6, -9, 5), target=(0, 0, 0), lens=28)
comp.export(col, root, "garage", "floor", made="blender/components/garage/floor.py",
            source="own geometry; https://polyhaven.com/a/garage_floor, https://polyhaven.com/a/metal_grate_rusty", license="ours; textures CC0",
            credit="Poly Haven (garage_floor, metal_grate_rusty)", rig={}, notes="Top at z 0, middle at the origin; the drain runs along x at y -5.")
