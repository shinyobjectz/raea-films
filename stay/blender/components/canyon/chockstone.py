# canyon/chockstone: a boulder a flood dropped into the slot and wedged between the walls overhead, 2.85 m across
# (Poly Haven's namaqualand_boulder_02, CC0), with three smaller stones jammed in beside it and a mat of flood twigs
# caught on top, those modelled by hand. Its origin is under its middle: stand it where the slot is 2.6 m wide (in this
# canyon 4 m up, 7.25 m in) and scale it to bite both walls. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root, parts, credit = comp.ph_component(L.PLACE, "chockstone", "namaqualand_boulder_02", res="1k", scale=1.12)
rock = next(iter(parts.values()))
rock.name = rock.data.name = "chockstone_rock"
L.decimate(rock, 0.4)
L.tint(rock.data.materials[0], (1.0, 0.78, 0.62))
stone = comp.ph_texture("canyon_sandstone_s", "sandstone_cracks", tile=1.0, res="1k", tint=(1.0, 0.68, 0.48))
for i, (size, at, tilt) in enumerate((((0.62, 0.5, 0.42), (-1.05, 0.38, 0.5), 25), ((0.5, 0.42, 0.36), (1.08, -0.3, 0.42), -35), ((0.36, 0.3, 0.26), (-0.85, -0.42, 0.62), 60))):
    b = L.rock(size, seed=70 + i, sub=3, rough=0.24, flat=0.35)
    xf(b, R(tilt, "Y"))
    xf(b, T(*at))
    o = comp.mesh(col, root, f"chockstone_wedge_{i + 1}", b, stone, smooth=True)
    bpy.context.view_layer.update()
    comp.uv_box(o)
# flood twigs caught on top
wood = comp.mat("canyon_flood_twig", (0.42, 0.36, 0.3), rough=0.9)
rnd = random.Random(5)
lo, hi = comp.box_of(rock)
tw = []
for k in range(46):
    a = Vector((rnd.uniform(-0.9, 0.9), rnd.uniform(-0.35, 0.35), hi.z - 0.12 + rnd.uniform(0, 0.14)))
    d = Vector((rnd.uniform(-1, 1), rnd.uniform(-0.4, 0.4), rnd.uniform(-0.12, 0.12))).normalized() * rnd.uniform(0.25, 0.7)
    mid = a + d * 0.5 + Vector((0, 0, rnd.uniform(-0.03, 0.05)))
    tw.append(L.twig([a, mid, a + d], rnd.uniform(0.004, 0.011), sides=4))
comp.mesh(col, root, "chockstone_twigs", comp.merge(*tw), wood)
comp.export(col, root, L.PLACE, "chockstone", made="blender/components/canyon/chockstone.py",
            source="https://polyhaven.com/a/namaqualand_boulder_02; wedged stones and twigs own geometry, sandstone https://polyhaven.com/a/sandstone_cracks", license="CC0", credit=credit,
            notes="its origin is under its middle, not on the floor: it hangs between the walls")
