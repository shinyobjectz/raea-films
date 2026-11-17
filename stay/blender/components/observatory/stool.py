# observatory/stool: the observer's stool, Poly Haven's wooden_stool_01 (CC0). No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "stool", "wooden_stool_01", res="1k")
comp.export(col, root, "observatory", "stool", made="blender/components/observatory/stool.py", source="https://polyhaven.com/a/wooden_stool_01", license="CC0", credit=credit)
