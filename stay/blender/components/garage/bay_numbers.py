# garage/bay-numbers: the bay numbers painted on the pillars, four of them 5 m apart (the pillars' pitch): a teal disc
# 0.44 m across with a white ring and the number in white, 61 to 64 from the left. A wall item: backs at y 0, the
# first disc's middle at the origin. Each number is its own node (bay_number_61 ...), so a scene can reorder them.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("bay_numbers")
M = L.maker(col, root)
teal = comp.mat("bay_number_disc", (0.02, 0.24, 0.27), rough=0.65)
white = comp.mat("bay_number_paint", (0.88, 0.88, 0.84), rough=0.6)
for i, n in enumerate((61, 62, 63, 64)):
    p = comp.pivot(col, root, f"bay_number_{n}", (i * 5.0, 0, 0))
    M(f"bay_number_{n}_disc", comp.cyl(0.22, 0.003, at=(i * 5.0, -0.003, 0), seg=48, axis="Y"), teal, parent=p)
    ring = L.sweep([(i * 5.0 + 0.19 * math.cos(a), -0.004, 0.19 * math.sin(a)) for a in [2 * math.pi * k / 48 for k in range(48)]], L.rrect(0.012, 0.002, 0.0005, 1), closed=True, up=(0, 1, 0))
    M(f"bay_number_{n}_ring", ring, white, parent=p)
    M(f"bay_number_{n}_text", xf(comp.text(str(n), 0.2, 0.002), T(i * 5.0, -0.005, 0)), white, parent=p)
L.look(col, "bay-numbers", eye=(7.5, -9, 0.5), target=(7.5, 0, 0), lens=40)
comp.export(col, root, "garage", "bay_numbers", made="blender/components/garage/bay_numbers.py", source="own geometry", license="ours", credit="",
            rig={"order": "in the scene: each number is its own node (bay_number_61 to bay_number_64), 5 m apart, to move or swap"})
