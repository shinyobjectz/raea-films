# turbines/shrub: a wind-cut upland bush for the ridge's shoulders, 2.5 m across and as high (one bush of Poly Haven's
# shrub_02, CC0). Rig: "sway" leans it 8 degrees downwind about its foot.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("turbines", "shrub", "shrub_02", res="1k", keep=lambda n: n.split(".")[0].endswith("_c"))
p = comp.hang(col, root, list(parts.values()), "shrub_sway", at=(0, 0, 0))
comp.channel("sway", [(p, "rotation_euler", 1, 0, math.radians(8)), (p, "rotation_euler", 0, 0, math.radians(3))])
comp.export(col, root, "turbines", "shrub", made="blender/components/turbines/shrub.py", source="https://polyhaven.com/a/shrub_02", license="CC0", credit=credit,
            rig={"sway": "the bush leans 8 degrees downwind (+x) about its foot"})
