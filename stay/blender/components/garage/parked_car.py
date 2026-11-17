# garage/parked-car: a car left under a tarpaulin in a far bay (Poly Haven's covered_car, CC0), 4.4 m long, its nose
# toward -y, on the floor at the origin. Set dressing behind the hero car. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "parked_car", "covered_car", res="1k", origin="floor")
L.look(col, "parked-car", lens=50)
comp.export(col, root, "garage", "parked_car", made="blender/components/garage/parked_car.py", source="https://polyhaven.com/a/covered_car", license="CC0", credit=credit, rig={})
