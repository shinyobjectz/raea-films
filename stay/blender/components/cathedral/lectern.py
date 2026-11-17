# cathedral/lectern: an oak lectern, 1.3 m, modelled by hand: a stepped octagonal foot, an octagonal post with a
# moulded collar, brackets, and a sloped desk with a lip, carrying an open Bible (a leather cover, two blocks of
# pages, a red ribbon) with one leaf standing ready to turn. The reader stands at -y.
# Rig: "page" turns the leaf over from the right-hand page to the left, 160 degrees about the book's gutter.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Matrix, Vector

col, root = comp.fresh("lectern")
oak = L.oak()
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
ft = M("lectern_foot", comp.merge(L.octa([(0.3, 0.0), (0.3, 0.05), (0.27, 0.07)]), L.octa([(0.21, 0.07), (0.21, 0.13), (0.15, 0.2), (0.09, 0.24)])), oak)
comp.bevel(ft, 0.006, 2)
L.finish(ft, 1.0)
post = M("lectern_post", comp.merge(L.octa([(0.06, 0.2), (0.06, 0.98), (0.0, 0.98)]), L.octa([(0.085, 0.55), (0.1, 0.58), (0.085, 0.61)]), L.octa([(0.08, 0.94), (0.12, 1.0), (0.12, 1.03), (0, 1.03)])), oak)
comp.bevel(post, 0.004, 2)
L.finish(post, 1.0)
TILT = 32
desk_m = T(0, 0, 1.14) @ R(TILT, "X")      # the desk's own frame: x across, y up the slope (toward +y, away from the reader), z out of its face
def on_desk(bm):
    return xf(bm, desk_m)
dk = M("lectern_desk", on_desk(comp.merge(comp.box((0.62, 0.46, 0.03), at=(0, 0, 0)), comp.box((0.62, 0.025, 0.03), at=(0, -0.2175, 0.03)), comp.box((0.03, 0.42, 0.1), at=(-0.2, 0.0, -0.06)), comp.box((0.03, 0.42, 0.1), at=(0.2, 0.0, -0.06)))), oak)
comp.bevel(dk, 0.005, 2)
L.finish(dk, 1.0)
leather = comp.mat("lectern_leather", (0.08, 0.03, 0.02), rough=0.55)
paper = comp.mat("lectern_paper", (0.86, 0.82, 0.7), rough=0.85)
ink = comp.mat("lectern_ink", (0.05, 0.04, 0.035), rough=0.8)
cv = M("lectern_book_cover", on_desk(comp.box((0.5, 0.34, 0.012), at=(0, -0.02, 0.021))), leather)
comp.bevel(cv, 0.003, 2)
def pages(sx):
    g = comp.grid(0.235, 0.31, 8, 1)
    xf(g, R(-90, "X"))                       # lie it flat: x across, y along
    for v in g.verts:
        t = (v.co.x / 0.235 + 0.5) if sx > 0 else (0.5 - v.co.x / 0.235)      # 0 at the gutter
        v.co.z = 0.012 + 0.026 * math.sin(min(1.0, t * 1.15) * math.pi * 0.62) * (1 - 0.35 * t)
    xf(g, T(sx * 0.1195, -0.02, 0.027))
    return g
for sx, side in ((-1, "left"), (1, "right")):
    po = M(f"lectern_book_pages_{side}", on_desk(pages(sx)), paper, smooth=True)
    comp.solidify(po, 0.024, 1.0)
lines = []
for sx in (-1, 1):
    for r in range(15):
        for c2 in range(2):
            lines.append(comp.box((0.09, 0.006, 0.0006), at=(sx * 0.125 + (c2 - 0.5) * 0.105, 0.105 - r * 0.0165, 0.066)))
M("lectern_book_text", on_desk(comp.merge(*lines)), ink)
M("lectern_book_ribbon", on_desk(comp.merge(comp.box((0.012, 0.36, 0.001), at=(0.004, -0.06, 0.056)), comp.box((0.012, 0.001, 0.07), at=(0.004, -0.24, 0.022)))), comp.mat("lectern_ribbon", (0.55, 0.03, 0.05), rough=0.6))
# the turning leaf: hinged on the gutter, which runs up the desk's slope
gp = comp.pivot(col, root, "lectern_page", (0, 0, 0))
gp.matrix_world = desk_m @ T(0, -0.02, 0.058)
bpy.context.view_layer.update()
leaf = comp.grid(0.225, 0.305, 6, 1)
xf(leaf, R(-90, "X"))
for v in leaf.verts:
    t = v.co.x / 0.225 + 0.5
    v.co.z = 0.05 * math.sin(t * math.pi) * 0.5
xf(leaf, T(0.1125, 0, 0))
xf(leaf, R(-28, "Y"))                         # it stands a little open at rest
lo = M("lectern_page_leaf", xf(leaf, gp.matrix_world), paper, parent=gp, smooth=True)
L.channel("page", [(gp, "rotation_euler", 1, 0, math.radians(-128))])
comp.export(col, root, "cathedral", "lectern", made="blender/components/cathedral/lectern.py", source="own geometry (an oak lectern and Bible); oak: https://polyhaven.com/a/dark_wood", license="ours; texture CC0", credit="Poly Haven (dark_wood)",
            rig={"page": "the standing leaf (lectern_page) turns over about the book's gutter, from 28 degrees off the right-hand page to lying on the left"})
