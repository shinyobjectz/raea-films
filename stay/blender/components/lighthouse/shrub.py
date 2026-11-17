# lighthouse/shrub: a wind-cut bush for the plateau's edge and the cottage's lee 2.5 m across and as high (one bush of Poly Haven's shrub_02, CC0). Rig:
# "sway" leans it 7 degrees downwind about its foot.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("lighthouse", "shrub", "shrub_02", res="1k", keep=lambda n: n.split(".")[0].endswith("_c"))
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
p = comp.hang(col, root, list(parts.values()), "shrub_sway", at=(0, 0, 0))
comp.channel("sway", [(p, "rotation_euler", 1, 0, math.radians(7)), (p, "rotation_euler", 0, 0, math.radians(3))])
comp.export(col, root, "lighthouse", "shrub", made="blender/components/lighthouse/shrub.py", source="https://polyhaven.com/a/shrub_02", license="CC0", credit=credit,
            rig={"sway": "the bush leans 7 degrees downwind (+x) about its foot"})
