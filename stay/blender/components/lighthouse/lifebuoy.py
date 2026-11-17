# lighthouse/lifebuoy: a ring lifebuoy hung on the cottage wall, 0.78 m (Poly Haven's lifebuoy, CC0), its back on the
# wall. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("lighthouse", "lifebuoy", "lifebuoy", res="1k", origin="back")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
comp.export(col, root, "lighthouse", "lifebuoy", made="blender/components/lighthouse/lifebuoy.py", source="https://polyhaven.com/a/lifebuoy", license="CC0", credit=credit)
