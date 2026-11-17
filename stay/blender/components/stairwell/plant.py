# stairwell/plant (copied from the office): a tall leafy plant in a pot, 1.35 m (Poly Haven's potted_plant_01, CC0), for a window or a partition's
# end. Rig: "sway" leans the stem and leaves 4 degrees off the pot (a draught, a fan, a reroll's shudder).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("stairwell", "plant", "potted_plant_01")
lo, hi = comp.box_of(parts["pot"])
top = comp.hang(col, root, [parts["stem"], parts["leaves"]], "plant_top", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z))
comp.channel("sway", [(top, "rotation_euler", 0, 0, math.radians(4))])
comp.export(col, root, "stairwell", "plant", made="blender/components/stairwell/plant.py",
            source="https://polyhaven.com/a/potted_plant_01", license="CC0", credit=credit,
            rig={"sway": "the stem and leaves lean 4 degrees toward the back, pivoting at the pot's rim"})
