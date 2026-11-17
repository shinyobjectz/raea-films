# bedroom/dartboard: a bristle dartboard on the wall by the door (Poly Haven's dartboard, CC0), 0.45 m across, its
# back on the wall (y 0), origin at its centre. Rig: "spin" turns the board one whole turn on its nail.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component(_lib.PLACE, "dartboard", "dartboard", res="1k", origin="back")
lo, hi = comp.box_of(list(parts.values()))
print("dartboard", list(parts), lo, hi)
p = comp.hang(col, root, list(parts.values()), "dartboard_spin", at=(0, 0, 0))
comp.channel("spin", [(p, "rotation_euler", 1, 0, 2 * math.pi)])
comp.export(col, root, _lib.PLACE, "dartboard", made="blender/components/bedroom/dartboard.py", source="https://polyhaven.com/a/dartboard", license="CC0", credit=credit,
            rig={"spin": "the board one whole turn about its centre, on the wall"})
