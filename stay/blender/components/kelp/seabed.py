# kelp/seabed: the forest's floor, 26 x 26 m, modelled by hand: sand heaped in low mounds and combed into ripples by
# the surge (Poly Haven's sand_02, CC0, tinted to the water), with two hundred pebbles and shell fragments scattered
# on it. It lies on the origin; its lowest sand is 3 cm up and its mounds reach 0.55 m. The sand glows a little with its own colour (seabed_sand: the water's scattered light; see _lib.ambient). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh, bpy
from comp import T, R, S, xf

col, root = comp.fresh("seabed")
def ripples(h, w):
    """The ripples' light and shade, painted into the sand's picture (three ripples a tile, as the mesh has), since
    the stand has no light under the surface to model them."""
    import numpy as np
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = xx / w, yy / h
    return 0.78 + 0.3 * np.sin(2 * np.pi * 3 * u + 1.2 * np.sin(2 * np.pi * v) + 0.5 * np.sin(2 * np.pi * 2 * v))
W, N = 26.0, 130
sand = L.ambient(L.tint_picture(comp.ph_texture("seabed_sand", "sand_02", tile=2.14, res="1k"), (0.6, 0.9, 0.86), "seabed_sand.png", shade=ripples), 300.0)
def height(x, y):
    m = 0.26 * (math.sin(x * 0.31 + 1.3) * math.cos(y * 0.27 - 0.4) + 0.6 * math.sin(x * 0.63 - y * 0.5 + 2.0)) + 0.26
    rip = 0.018 * math.sin(x * 9.0 + 1.6 * math.sin(y * 0.8) + 0.5 * math.sin(y * 2.3))
    return max(0.03, m * 0.75 + 0.1 + rip)
bm = bmesh.new()
vs = [[bm.verts.new((-W / 2 + W * i / N, -W / 2 + W * j / N, height(-W / 2 + W * i / N, -W / 2 + W * j / N))) for j in range(N + 1)] for i in range(N + 1)]
for i in range(N):
    for j in range(N):
        bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in bm.faces:
    if f.normal.z < 0:
        f.normal_flip()
o = comp.mesh(col, root, "seabed_sand", bm, sand, smooth=True)
bpy.context.view_layer.update()
me = o.data
me.uv_layers.new(name="UVMap")
for poly in me.polygons:
    for li in poly.loop_indices:
        c = me.vertices[me.loops[li].vertex_index].co
        me.uv_layers.active.data[li].uv = (c.x, c.y)       # the material tiles it every 2.14 m
random.seed(31)
peb, shl = [], []
for i in range(200):
    x, y = random.uniform(-9, 9), random.uniform(-9, 9)
    r = random.uniform(0.012, 0.05)
    b = L.ball(r, sub=1, squash=(random.uniform(0.8, 1.4), random.uniform(0.7, 1.2), random.uniform(0.3, 0.6)))
    xf(b, R(random.uniform(0, 360), "Z"))
    (shl if i % 5 == 0 else peb).append(xf(b, T(x, y, height(x, y) + r * 0.15)))
comp.mesh(col, root, "seabed_pebbles", comp.merge(*peb), L.ambient(comp.mat("seabed_pebble", (0.16, 0.17, 0.16), rough=0.7), 60.0), smooth=True)
comp.mesh(col, root, "seabed_shell_bits", comp.merge(*shl), L.ambient(comp.mat("seabed_shell", (0.7, 0.66, 0.58), rough=0.5), 60.0), smooth=True)
comp.export(col, root, "kelp", "seabed", made="blender/components/kelp/seabed.py", source="own geometry; sand: https://polyhaven.com/a/sand_02", license="ours; texture CC0", credit="Poly Haven (sand_02)",
            notes="The sand's height at (x, y) in Blender's frame is seabed.py's height(); things placed on it stand 0.1 to 0.5 m above the origin.")
