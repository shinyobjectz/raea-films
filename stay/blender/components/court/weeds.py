# court/weeds: weeds come up through the slab's edge at the fence's foot, from Poly Haven's weed_plant_02 (CC0): its
# five plants set fourteen times along a 2.6 m strip, turned and sized unevenly. The strip runs along x, centred.
# Rig: "sway" leans every plant 9 degrees with the wind about its root.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import T, R, S

col, root = comp.fresh("weeds")
parts, credit = _lib.kit("weed_plant_02", "1k")
names = sorted(parts)
rnd = random.Random(2)
keys = []
for i in range(14):
    src = parts[names[i % len(names)]]
    lo, hi = comp.box_of(src)
    c = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)
    x, y, k = -1.3 + 2.6 * (i + rnd.uniform(-0.3, 0.3)) / 13, rnd.uniform(-0.1, 0.1), rnd.uniform(1.0, 2.4)
    p = comp.pivot(col, root, f"weeds_root_{i + 1}", (x, y, 0))
    _lib.put(col, root, src, f"weeds_plant_{i + 1}", T(x, y, 0) @ R(rnd.uniform(0, 360), "Z") @ S(k) @ T(-c[0], -c[1], -c[2]), parent=p)
    keys.append((p, "rotation_euler", 1, 0, math.radians(rnd.uniform(6, 11))))
_lib.kit_done(parts)
_lib.channel("sway", keys)
comp.export(col, root, "court", "weeds", made="blender/components/court/weeds.py", source="https://polyhaven.com/a/weed_plant_02 (fourteen of its five plants along a strip)", license="CC0", credit=credit,
            rig={"sway": "every plant leans 6 to 11 degrees with the wind about its root"})
