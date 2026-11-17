# ferris/pole: a showman's lighting pole, 3.6 m, modelled by hand: a galvanised scaffold tube in a concrete-filled
# tyre for a base, a cross arm at its top with two hooks for string lights and bunting, a horn loudspeaker on a
# bracket, a cable tied down it with three ties into a rubber plug box at its foot. Origin: on the ground at its
# centre; the hooks are 3.5 m up. Rig: "horn" turns the loudspeaker 60 degrees on its bracket.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("pole")
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
tyre = comp.mat("pole_tyre", (0.02, 0.02, 0.022), rough=0.8)
conc = comp.ph_texture("pole_concrete", "concrete_floor_worn_001", tile=1.0, res="1k")
horn_m = comp.mat("pole_horn", (0.6, 0.6, 0.58), rough=0.5)
rubber = comp.mat("festoon_cable", (0.015, 0.015, 0.017), rough=0.6)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
t = M("pole_tyre", L.torus(0.22, 0.1, seg_=28, sides=10, at=(0, 0, 0.1)), tyre)
c = M("pole_concrete", comp.cyl(0.2, 0.17, at=(0, 0, 0.01), seg=24), conc, smooth=False)
comp.uv_box(c, 1.0)
M("pole_tube", comp.merge(comp.cyl(0.024, 3.6, at=(0, 0, 0), seg=12), L.seg((-0.35, 0, 3.5), (0.35, 0, 3.5), 0.017, 8), comp.cyl(0.03, 0.05, at=(0, 0, 3.47), seg=10),
                          *[L.torus(0.022, 0.004, seg_=10, sides=4, axis="Y", at=(sx * 0.33, 0, 3.465)) for sx in (-1, 1)], comp.cyl(0.03, 0.02, at=(0, 0, 3.6), seg=10)), galv)
hp = comp.pivot(col, root, "pole_horn", (0, 0, 3.05))
bm = bmesh.new()
prof = [(0.03, 0.0), (0.035, 0.12), (0.06, 0.2), (0.11, 0.27), (0.17, 0.31), (0.175, 0.315)]
vs = [bm.verts.new((r, 0, z)) for r, z in prof]
es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=20, use_duplicate=False)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
xf(bm, comp.Matrix.Translation((0, -0.1, 3.05)) @ R(100, "X"))
ho = M("pole_horn_bell", bm, horn_m, hp)
comp.solidify(ho, 0.004)
M("pole_horn_driver", xf(comp.merge(comp.cyl(0.05, 0.09, at=(0, 0, -0.08), seg=14), comp.cyl(0.012, 0.1, at=(0, 0, 0.05), seg=8)), comp.Matrix.Translation((0, -0.1, 3.05)) @ R(100, "X")), tyre, hp)
M("pole_horn_bracket", comp.merge(L.seg((0, 0, 3.05), (0, -0.1, 3.05), 0.012, 8), comp.cyl(0.03, 0.04, at=(0, 0, 3.03), seg=10)), galv)
M("pole_cable", comp.merge(comp.tube([(0.03, 0.01, 3.45), (0.032, 0.012, 2.4), (0.03, 0.01, 1.2), (0.035, 0.012, 0.3), (0.2, 0.05, 0.2), (0.34, 0.1, 0.03), (0.5, 0.2, 0.012)], 0.007, res=5, sides=3),
                           *[L.torus(0.027, 0.003, seg_=10, sides=4, at=(0.004, 0.002, z)) for z in (0.8, 1.8, 2.8)]), rubber)
pb = M("pole_plug_box", comp.box((0.12, 0.09, 0.06), at=(0.56, 0.22, 0.03)), comp.mat("pole_plug", (0.75, 0.4, 0.05), rough=0.5), smooth=False)
comp.bevel(pb, 0.01, 3)
comp.channel("horn", [(hp, "rotation_euler", 2, 0, math.radians(60))])
comp.export(col, root, "ferris", "pole", made="blender/components/ferris/pole.py", source="own geometry; texture: https://polyhaven.com/a/concrete_floor_worn_001", license="ours; texture CC0", credit="Poly Haven (concrete_floor_worn_001)",
            rig={"horn": "the horn loudspeaker turns 60 degrees round the pole on its bracket"}, notes="the hooks for string lights and bunting are 3.5 m up")
