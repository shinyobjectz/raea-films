# court/tyre: an old car tyre left at the fence, Poly Haven's old_tyre (CC0), 60 cm, standing on its tread.
# Rig: "roll" rolls it one whole turn along x (1.885 m, its circumference).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("court", "tyre", "old_tyre", res="2k")
lo, hi = comp.box_of(list(parts.values()))
thin = "y" if (hi.y - lo.y) < (hi.x - lo.x) else "x"
r = (hi.z - lo.z) / 2
axle = comp.hang(col, root, list(parts.values()), "tyre_axle", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, r))
if thin == "y":
    _lib.channel("roll", [(axle, "rotation_euler", 1, 0, 2 * math.pi), (axle, "location", 0, 0, 2 * math.pi * r)])
else:
    _lib.channel("roll", [(axle, "rotation_euler", 0, 0, -2 * math.pi), (axle, "location", 1, 0, 2 * math.pi * r)])
comp.export(col, root, "court", "tyre", made="blender/components/court/tyre.py", source="https://polyhaven.com/a/old_tyre", license="CC0", credit=credit,
            rig={"roll": "the tyre rolls one whole turn along its tread, 1.885 m"}, notes=f"its axle runs along Blender's {thin}")
