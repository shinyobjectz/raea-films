# sea/cliff: the coast's cliff, 92 m long and 8.5 m high over the water: Poly Haven's coastal_cliff_01 (CC0, a photoscan by Rob
# Tuytel, cleaned up by Rico Cilliers), cut from its 462,000 faces to about a fifth so it fits a film scene. It faces
# the sea (-y, raea +z); its origin is the foot's middle at the still-water level, its ragged foot sunk 1.7 m behind a line of fallen rock (modelled by hand, Poly Haven's seaside_rock on it). The pier
# runs out from it. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("cliff")
parts, credit = _lib.bring(col, root, "coastal_cliff_01", "cliff", res="2k")
o = parts["body"]
lo, hi = comp.box_of(o)
o.matrix_world = T(-(lo.x + hi.x) / 2, -hi.y, -1.7) @ o.matrix_world
_lib.decimate(o, 0.17)
# fallen rock along its foot, awash: the scan's own foot is ragged and ends in the air
rock = comp.ph_texture("cliff_falls", "seaside_rock", tile=3.0, res="1k", tint=(0.55, 0.5, 0.46))
random.seed(8)
falls = []
for i in range(90):
    x = random.uniform(-46, 46)
    r = random.uniform(0.5, 1.9)
    falls.append(_lib.lump(_lib.ico(r, at=(x, -hi.y + lo.y - random.uniform(-4.0, 3.0), random.uniform(-0.6, 0.35) * r), sub=2, scale=(1.3, 1.0, 0.75)), r * 0.4, r * 0.8, 4, seed=i))
fo = comp.mesh(col, root, "cliff_falls", comp.merge(*falls), rock)
comp.uv_box(fo, 1.0)
comp.export(col, root, "sea", "cliff", made="blender/components/sea/cliff.py", source="https://polyhaven.com/a/coastal_cliff_01 (decimated to 17%); fallen rock our own, texture https://polyhaven.com/a/seaside_rock", license="CC0; ours", credit=credit + "; Poly Haven (seaside_rock)",
            notes="A scan of a cliff's face: open at the back and the top, so keep the camera on its seaward side and below its brow.")
