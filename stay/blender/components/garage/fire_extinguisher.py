# garage/fire-extinguisher: a red dry-powder extinguisher on its floor stand (Poly Haven's korean_fire_extinguisher_01,
# CC0, by its author's label), standing against a pillar or a wall: its back at y 0, on the floor at the origin. Over
# it, our own red FIRE POINT plate with a white flame mark, 1.55 m up on the same face. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "fire_extinguisher", "korean_fire_extinguisher_01", res="1k", origin="floor")
M = L.maker(col, root)
lo, hi = comp.box_of(list(parts.values()))
for o in parts.values():
    o.location.y -= hi.y + 0.01
red = comp.mat("fire_point_red", (0.65, 0.03, 0.025), rough=0.45)
white = comp.mat("fire_point_white", (0.92, 0.92, 0.9), rough=0.5)
pl = M("fire_extinguisher_plate", comp.box((0.26, 0.004, 0.34), at=(0, -0.002, 1.55)), red)
comp.bevel(pl, 0.001, 1)
flame = L.plate([(0, 0.075), (0.03, 0.03), (0.05, -0.01), (0.04, -0.05), (0, -0.07), (-0.04, -0.05), (-0.05, -0.01), (-0.025, 0.02), (-0.015, -0.005)], 0.0015)
M("fire_extinguisher_plate_mark", comp.merge(xf(xf(flame, R(90, "X")), T(0, -0.004, 1.6)), xf(comp.text("FIRE POINT", 0.042, 0.0015), T(0, -0.0045, 1.445)),
                                              L.sweep([(-0.115, -0.0045, 1.395), (0.115, -0.0045, 1.395), (0.115, -0.0045, 1.705), (-0.115, -0.0045, 1.705)], L.rrect(0.006, 0.0015, 0.0003, 1), closed=True, up=(0, -1, 0))), white)
M("fire_extinguisher_plate_screws", comp.merge(*[comp.cyl(0.005, 0.003, at=(sx * 0.11, -0.0075, 1.55 + sz * 0.15), seg=8, axis="Y") for sx in (-1, 1) for sz in (-1, 1)]), comp.mat("fire_point_screws", (0.7, 0.7, 0.72), rough=0.3, metal=1.0))
L.look(col, "fire-extinguisher", lens=50)
comp.export(col, root, "garage", "fire_extinguisher", made="blender/components/garage/fire_extinguisher.py",
            source="https://polyhaven.com/a/korean_fire_extinguisher_01; the FIRE POINT plate is own geometry", license="CC0; plate ours", credit=credit, rig={})
