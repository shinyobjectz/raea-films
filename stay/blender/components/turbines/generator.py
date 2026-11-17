# turbines/generator: the service crew's portable generator left on the crane pad, 0.8 m (Poly Haven's
# portable_generator, CC0). No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("turbines", "generator", "portable_generator", res="1k")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
comp.export(col, root, "turbines", "generator", made="blender/components/turbines/generator.py", source="https://polyhaven.com/a/portable_generator", license="CC0", credit=credit)
