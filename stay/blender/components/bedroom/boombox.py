# bedroom/boombox: a twin-speaker radio cassette player (Poly Haven's boombox, CC0), 0.72 m wide: the room's sound.
# Stands on the floor by the bed.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component(_lib.PLACE, "boombox", "boombox", res="1k", origin="floor")
print("boombox", list(parts), comp.box_of(list(parts.values())))
comp.export(col, root, _lib.PLACE, "boombox", made="blender/components/bedroom/boombox.py", source="https://polyhaven.com/a/boombox", license="CC0", credit=credit, rig={})
