# office/desk-lamp: an articulated arm lamp for a desk's corner. Its light is the scene's (a spot at the shade); one mesh, so no arm rig yet (Poly Haven's desk_lamp_arm_01, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "desk_lamp", "desk_lamp_arm_01", origin="floor")

comp.export(col, root, "office", "desk_lamp", made="blender/components/office/desk_lamp.py",
            source="https://polyhaven.com/a/desk_lamp_arm_01", license="CC0", credit=credit, rig={})
