# sea/pier: a weathered timber pier running 25 m out from the shore, its deck 2.5 m wide and 2.6 m over the water on
# pairs of piles with cross-braces and handrails (Poly Haven's modular_wooden_pier, CC0, by Rico Cilliers): its four
# deck sections end to end twice over, its tall pile frame as the pier head, and its loose piles as a mooring dolphin
# beside the head. It runs away from the camera (+y, raea -z); its origin is the shore end's middle at the
# still-water level. The deck's top is DECK = 2.66 m up. No rig: what stands on it (the lamp, the bench, the catch, the
# life ring, the fenders, the lantern) are components of their own.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("pier")
parts, credit = _lib.bring(col, root, "modular_wooden_pier", "pier", res="1k")
names = ["section_01", "section_02", "section_03", "section_04"]
lo0, _ = comp.box_of(parts["section_01"])
_, hi3 = comp.box_of(parts["section_04"])
RUN = (hi3.y - lo0.y) - 0.22
base = T(0, -lo0.y, 0)
for n in names:
    o = parts[n]
    w = o.matrix_world.copy()
    o.matrix_world = base @ w
    _lib.copy_of(col, root, o, f"pier_{n}_b", T(0, RUN, 0) @ base @ w)
head = parts["section_05"]
lo5, hi5 = comp.box_of(head)
head.matrix_world = T(0, 2 * RUN - (lo5.y + hi5.y) / 2 - lo0.y + 0.1, 0) @ head.matrix_world
poles = parts["poles"]
lop, hip = comp.box_of(poles)
poles.matrix_world = T(3.4 - (lop.x + hip.x) / 2, 2 * RUN - 2.0 - (lop.y + hip.y) / 2, 0) @ poles.matrix_world
poles.name = "pier_dolphin"
planks = parts["planks"]
lok, hik = comp.box_of(planks)
planks.matrix_world = T(-(lok.x + hik.x) / 2, 2 * RUN + 0.2 - lok.y - lo0.y, 0) @ planks.matrix_world
planks.name = "pier_head_planks"
bpy.context.view_layer.update()
lo, hi = comp.box_of([o for o in col.all_objects if o.type == "MESH"])
print("pier box", [round(v, 2) for v in lo], [round(v, 2) for v in hi])
comp.export(col, root, "sea", "pier", made="blender/components/sea/pier.py", source="https://polyhaven.com/a/modular_wooden_pier (its sections laid end to end twice)", license="CC0", credit=credit,
            notes="The deck's top is 2.66 m over the origin (the still water) and 2.5 m wide between the rails; the pier runs 25 m toward raea -z.")
