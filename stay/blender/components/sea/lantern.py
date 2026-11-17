# sea/lantern: a storm lantern hung from a wrought-iron bracket on a pier post: the lantern is Poly Haven's
# Lantern_01 (CC0, by Rajil Jose Macatangay) at twice its size (0.58 m, a pier's lamp); the bracket, its scroll and
# the hook are modelled by hand, and a flame of our own sits in the glass (the material lantern_flame). A wall item:
# its back plate is on the post (y 0), its origin the plate's middle; the lantern hangs 0.45 m out. Rig: "swing"
# swings the lantern 18 degrees on its hook; "flame" is the scene's: lantern_flame's glow.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("lantern")
M = _lib.maker(col, root)
iron = comp.mat("lantern_bracket", (0.03, 0.03, 0.032), rough=0.55, metal=0.8)
flame = comp.mat("lantern_flame", (1.0, 0.6, 0.2), rough=0.5, emit=(1.0, 0.5, 0.12), strength=15000.0)
pl = M("lantern_plate", comp.merge(comp.box((0.07, 0.012, 0.34), at=(0, -0.006, 0)), *[comp.cyl(0.011, 0.008, at=(0, -0.02, z), seg=6, axis="Y") for z in (-0.13, 0.13)]), iron)
comp.bevel(pl, 0.003, 2)
arm = comp.merge(comp.tube([(0, -0.012, 0.1), (0, -0.2, 0.12), (0, -0.4, 0.11), (0, -0.47, 0.07), (0, -0.45, 0.02)], 0.011, res=8, sides=3),
                 comp.tube([(0, -0.012, -0.12), (0, -0.1, -0.06), (0, -0.25, 0.08), (0, -0.33, 0.1)], 0.008, res=8, sides=3),
                 comp.tube([(0, -0.2, 0.05), (0, -0.24, 0.0), (0, -0.2, -0.04), (0, -0.16, 0.0), (0, -0.19, 0.03)], 0.006, res=8, sides=2))
M("lantern_arm", arm, iron, smooth=True)
HOOK = (0, -0.45, 0.02)
sw = comp.pivot(col, root, "lantern_swing", HOOK)
parts, credit = _lib.bring(col, root, "Lantern_01", "lantern_body", res="1k")
objs = list(parts.values())
lo, hi = comp.box_of(objs)
m = T(HOOK[0], HOOK[1], HOOK[2] + 0.012) @ S(2.0) @ T(-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -hi.z)
for o in objs:
    o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()
for o in objs:
    comp.link(col, root, o, parent=sw)
print("lantern parts", {k: [round(v, 3) for v in comp.box_of(o)[0]] + [round(v, 3) for v in comp.box_of(o)[1]] for k, o in parts.items()})
H = (hi.z - lo.z) * 2
M("lantern_flame", _lib.sphere(0.016, at=(HOOK[0], HOOK[1], HOOK[2] - H * 0.66), u=10, v=8, scale=(1, 1, 2.2)), flame, parent=sw, smooth=True)
_lib.channel("swing", [(sw, "rotation_euler", 0, 0.0, math.radians(18))])
comp.export(col, root, "sea", "lantern", made="blender/components/sea/lantern.py", source="https://polyhaven.com/a/Lantern_01 (twice its size); bracket and flame our own", license="CC0; ours", credit=credit,
            rig={"swing": "the lantern swings 18 degrees out from the post on its hook", "flame": "in the scene: the material lantern_flame's glow (15,000 lit), a key per state"})
