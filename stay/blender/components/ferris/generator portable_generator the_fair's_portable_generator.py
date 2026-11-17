# ferris/generator portable-generator the-fair's-portable-generator:  (Poly Haven's , CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "generator portable_generator the_fair's_portable_generator", "", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS generator portable_generator the_fair's_portable_generator", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "generator portable_generator the_fair's_portable_generator", made="blender/components/ferris/generator portable_generator the_fair's_portable_generator.py", source="https://polyhaven.com/a/", license="CC0", credit=credit)
