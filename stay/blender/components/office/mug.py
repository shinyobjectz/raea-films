# office/mug: a glazed ceramic mug with coffee in it, modelled by hand: a turned wall with a foot and a rounded lip, a
# D handle, the coffee's surface a part of its own. Rig: "rock" tips it 14 degrees on its foot's edge (a bump, a
# reroll's shudder); "level" drops the coffee 5 cm (drunk).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("mug")
glaze = comp.mat("mug_glaze", (0.85, 0.83, 0.78), rough=0.18)
coffee_m = comp.mat("mug_coffee", (0.05, 0.022, 0.008), rough=0.05)
# the wall's profile, turned: (radius, height), outside up then inside down
PROF = [(0.0, 0.0), (0.034, 0.0), (0.037, 0.003), (0.0405, 0.012), (0.0415, 0.05), (0.0415, 0.09), (0.0405, 0.0945), (0.039, 0.096), (0.0375, 0.0945), (0.037, 0.09), (0.0368, 0.014), (0.034, 0.008), (0.0, 0.007)]
bm = bmesh.new()
vs = [bm.verts.new((r, 0, z)) for r, z in PROF]
es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=48, use_duplicate=False)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
rock = comp.pivot(col, root, "mug_rock", (0.034, 0, 0))
comp.mesh(col, root, "mug_body", bm, glaze, parent=rock, smooth=True)
h = comp.tube([(0.04, 0, 0.078), (0.062, 0, 0.08), (0.07, 0, 0.055), (0.062, 0, 0.03), (0.04, 0, 0.026)], 0.0055, res=10, sides=4)
xf(h, T(-0.04, 0, 0)); xf(h, S(1, 0.75, 1)); xf(h, T(0.04, 0, 0))
comp.mesh(col, root, "mug_handle", h, glaze, parent=rock, smooth=True)
c = comp.pivot(col, root, "mug_level", (0, 0, 0.082), parent=rock)
comp.mesh(col, root, "mug_coffee", comp.cyl(0.0367, 0.001, at=(0, 0, 0.0815), seg=48), coffee_m, parent=c, smooth=False)
comp.channel("rock", [(rock, "rotation_euler", 1, 0, math.radians(14))])
comp.channel("level", [(c, "location", 2, c.location.z, c.location.z - 0.05)])
comp.export(col, root, "office", "mug", made="blender/components/office/mug.py", source="own geometry (a generic mug)", license="ours", credit="",
            rig={"rock": "tips 14 degrees on the edge of its foot, toward +x", "level": "the coffee drops 5 cm"})
