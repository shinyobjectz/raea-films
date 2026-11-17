# bedroom/chair: the desk's chair, a school chair in bent ply on a steel frame (Poly Haven's SchoolChair_01, CC0).
# Its front faces -y. Where it stands and how it is turned is the Model's own position (pulled out from the desk).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component(_lib.PLACE, "chair", "SchoolChair_01", res="1k", origin="floor")
print("chair", list(parts), comp.box_of(list(parts.values())))
comp.export(col, root, _lib.PLACE, "chair", made="blender/components/bedroom/chair.py", source="https://polyhaven.com/a/SchoolChair_01", license="CC0", credit=credit,
            rig={"position": "in the scene: the Model's own position and turn (the cursor's drag)"})
