# laundromat/fire-alarm: a red manual fire alarm pull station, its back on the wall (Poly Haven's fire_alarm, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("laundromat", "fire_alarm", "fire_alarm", origin="back", res="1k")

comp.export(col, root, "laundromat", "fire_alarm", made="blender/components/laundromat/fire_alarm.py",
            source="https://polyhaven.com/a/fire_alarm", license="CC0", credit=credit, rig={})
