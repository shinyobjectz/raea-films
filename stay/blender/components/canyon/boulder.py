# canyon/boulder: a fallen sandstone block, 1.45 m by 1.85 m and 0.9 m high (Poly Haven's namaqualand_boulder_03, CC0,
# at six tenths of its size and a quarter of its triangles), warmed toward the walls' red, with flood sand banked
# round its foot. Stands on the sand against a wall. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf

col, root, parts, credit = comp.ph_component(L.PLACE, "boulder", "namaqualand_boulder_03", res="1k", scale=0.6)
rock = next(iter(parts.values()))
rock.name = rock.data.name = "boulder_rock"
L.decimate(rock, 0.45)
L.tint(rock.data.materials[0], (1.0, 0.8, 0.66))
sand = comp.ph_texture("canyon_sand", "coast_sand_01", tile=1.6, res="1k", tint=(1.0, 0.68, 0.46))
m = L.rock((2.3, 2.7, 0.2), seed=4, sub=4, rough=0.25)
xf(m, T(0.1, -0.15, -0.03))
o = comp.mesh(col, root, "boulder_sand", m, sand, smooth=True)
bpy.context.view_layer.update()
comp.uv_box(o)
comp.export(col, root, L.PLACE, "boulder", made="blender/components/canyon/boulder.py",
            source="https://polyhaven.com/a/namaqualand_boulder_03; sand https://polyhaven.com/a/coast_sand_01", license="CC0", credit=credit)
