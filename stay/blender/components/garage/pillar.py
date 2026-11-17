# garage/pillar: a cast concrete column of the car park, 0.5 m square and 2.3 m to the main beam it carries (the slab is at 2.75), its corners chamfered
# (Poly Haven's wood_textured_concrete, CC0): painted mustard to 1.2 m under a black band, with four black rubber
# corner guards carrying yellow reflective bars, bolted on. Its bay number is its own part (bay-numbers). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("pillar")
M = L.maker(col, root)
conc = comp.ph_texture("pillar_concrete", "wood_textured_concrete", tile=1.8, res="1k", tint=(0.8, 0.88, 1.0))
paintm = comp.ph_texture("pillar_paint", "concrete_wall_008", tile=2.71, res="1k", tint=(1.0, 0.66, 0.1), grey=True)
black = comp.mat("pillar_band", (0.02, 0.02, 0.02), rough=0.6)
rubber = comp.mat("pillar_guard", (0.015, 0.015, 0.016), rough=0.8)
yellow = comp.mat("pillar_reflector", (0.95, 0.75, 0.05), rough=0.3)
steel = comp.mat("pillar_bolts", (0.6, 0.6, 0.62), rough=0.35, metal=1.0)
A, H = 0.5, 2.3
c = M("pillar_column", comp.box((A, A, H), at=(0, 0, H / 2)), conc)
comp.bevel(c, 0.025, 1)
comp.uv_box(c, 1.0)
p = M("pillar_paint", comp.box((A + 0.004, A + 0.004, 1.2), at=(0, 0, 0.6)), paintm)
comp.bevel(p, 0.026, 1)
comp.uv_box(p, 1.0)
b = M("pillar_band", comp.box((A + 0.005, A + 0.005, 0.1), at=(0, 0, 1.25)), black)
comp.bevel(b, 0.026, 1)
guards, bars, bolts = [], [], []
for sx in (-1, 1):
    for sy in (-1, 1):
        cx, cy = sx * A / 2, sy * A / 2
        guards.append(comp.box((0.11, 0.014, 0.9), at=(cx - sx * 0.045, cy + sy * 0.007, 0.5)))
        guards.append(comp.box((0.014, 0.11, 0.9), at=(cx + sx * 0.007, cy - sy * 0.045, 0.5)))
        for i in range(4):
            z = 0.2 + i * 0.2
            bars.append(comp.box((0.085, 0.003, 0.09), at=(cx - sx * 0.05, cy + sy * 0.015, z)))
            bars.append(comp.box((0.003, 0.085, 0.09), at=(cx + sx * 0.015, cy - sy * 0.05, z)))
        for z in (0.1, 0.5, 0.9):
            bolts.append(comp.cyl(0.008, 0.006, at=(cx - sx * 0.05, cy + sy * (0.014 + (0.006 if sy < 0 else 0)), z), seg=6, axis="Y") if sy > 0 else comp.cyl(0.008, 0.006, at=(cx - sx * 0.05, cy - 0.02, z), seg=6, axis="Y"))
g = M("pillar_guards", comp.merge(*guards), rubber)
comp.bevel(g, 0.004, 2)
M("pillar_reflectors", comp.merge(*bars), yellow)
M("pillar_bolts", comp.merge(*bolts), steel)
L.look(col, "pillar", lens=40)
comp.export(col, root, "garage", "pillar", made="blender/components/garage/pillar.py",
            source="own geometry; https://polyhaven.com/a/wood_textured_concrete, https://polyhaven.com/a/concrete_wall_008", license="ours; textures CC0",
            credit="Poly Haven (wood_textured_concrete, concrete_wall_008)", rig={})
