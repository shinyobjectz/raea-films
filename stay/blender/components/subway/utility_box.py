# subway/utility-box: a grey steel electrical cabinet, 1.12 m (Poly Haven's utility_box_01, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("subway", "utility_box", "utility_box_01", res="1k", origin="floor", turn=0)
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "subway", "utility_box", made="blender/components/subway/utility_box.py",
            source="https://polyhaven.com/a/utility_box_01", license="CC0", credit=credit)
