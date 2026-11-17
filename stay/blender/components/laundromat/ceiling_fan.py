# laundromat/ceiling-fan: a five-blade ceiling fan, 1.46 m across (Poly Haven's ceiling_fan, CC0), its origin at the
# ceiling mount. Rig: "spin" turns the blades one whole turn (anticlockwise from below, as a fan turns in summer).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("laundromat", "ceiling_fan", "ceiling_fan", origin="top", res="1k")
# the axis is the motor housing's centre (five blades make a lopsided box)
lo, hi = comp.box_of(parts["body"])
blo, bhi = comp.box_of(parts["blades"])
blades = comp.hang(col, root, parts["blades"], "ceiling_fan_rotor", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (blo.z + bhi.z) / 2))
comp.channel("spin", [(blades, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "laundromat", "ceiling_fan", made="blender/components/laundromat/ceiling_fan.py",
            source="https://polyhaven.com/a/ceiling_fan", license="CC0", credit=credit,
            rig={"spin": "the blades one whole turn about the down rod"})
