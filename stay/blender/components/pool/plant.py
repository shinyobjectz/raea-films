# pool/plant: a tall leafy plant in a pot, 1.35 m (Poly Haven's potted_plant_01, CC0; the office's
# blender/components/office/plant.py), for the hall's warm corners. Rig: "sway" leans the stem and leaves 4 degrees
# off the pot (the draught from the vents).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
col, root, parts, credit = comp.ph_component("pool", "plant", "potted_plant_01", res="1k")
lo, hi = comp.box_of(parts["pot"])
top = comp.hang(col, root, [parts["stem"], parts["leaves"]], "plant_top", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z))
comp.channel("sway", [(top, "rotation_euler", 0, 0, math.radians(4))])
done(col, root, "plant", source="https://polyhaven.com/a/potted_plant_01", license="CC0", credit=credit,
     rig={"sway": "the stem and leaves lean 4 degrees toward the back, pivoting at the pot's rim"})
