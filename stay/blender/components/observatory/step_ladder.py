# observatory/step-ladder: a worn wooden step ladder against the wall, Poly Haven's wooden_ladder_02 (CC0), 1.7 m. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "step_ladder", "wooden_ladder_02", res="2k")
comp.export(col, root, "observatory", "step_ladder", made="blender/components/observatory/step_ladder.py", source="https://polyhaven.com/a/wooden_ladder_02", license="CC0", credit=credit)
