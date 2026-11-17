# canyon/boulder-b: a low, flat sandstone boulder, 1.4 m long and half a metre high (Poly Haven's
# namaqualand_boulder_05, CC0), with two cobbles the flood left against it, modelled by hand. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf

col, root, parts, credit = comp.ph_component(L.PLACE, "boulder_b", "namaqualand_boulder_05", res="1k")
rock = next(iter(parts.values()))
rock.name = rock.data.name = "boulder_b_rock"
L.decimate(rock, 0.35)
L.tint(rock.data.materials[0], (1.0, 0.8, 0.66))
stone = comp.ph_texture("canyon_sandstone_s", "sandstone_cracks", tile=1.0, res="1k", tint=(1.0, 0.68, 0.48))
for i, (size, at, turn) in enumerate((((0.34, 0.27, 0.2), (0.78, -0.3, -0.02), 30), ((0.22, 0.18, 0.13), (0.62, -0.52, -0.01), 110))):
    b = L.rock(size, seed=40 + i, sub=3, rough=0.22, flat=0.25)
    xf(b, R(turn, "Z"))
    xf(b, T(*at))
    o = comp.mesh(col, root, f"boulder_b_cobble_{i + 1}", b, stone, smooth=True)
    bpy.context.view_layer.update()
    comp.uv_box(o)
comp.export(col, root, L.PLACE, "boulder_b", made="blender/components/canyon/boulder_b.py",
            source="https://polyhaven.com/a/namaqualand_boulder_05; cobbles own geometry, sandstone https://polyhaven.com/a/sandstone_cracks", license="CC0", credit=credit)
