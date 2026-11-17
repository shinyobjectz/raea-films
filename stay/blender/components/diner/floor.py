# diner/floor: the diner's checkerboard floor, 8.4 x 6 m, modelled by hand: 30 cm vinyl-composition tiles, black and
# white, each tile its own quad a millimetre proud of a dark grout bed (textured from Poly Haven's marble_01 so the
# tiles carry real scuffs and veining). The origin is its middle, its top at z 0.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh

col, root = comp.fresh("floor")
M = _lib.maker(col, root)
TW, NX, NY, G = 0.3, 28, 20, 0.0015
white = comp.ph_texture("floor_white", "marble_01", tile=1.5, res="1k", grey=True, tint=(0.88, 0.86, 0.8))
black = comp.ph_texture("floor_black", "marble_01", tile=1.5, res="1k", grey=True, tint=(0.018, 0.018, 0.02))
grout = comp.mat("floor_grout", (0.03, 0.03, 0.03), rough=0.9)
bms = [bmesh.new(), bmesh.new()]
for i in range(NX):
    for j in range(NY):
        x0, y0 = (i - NX / 2) * TW, (j - NY / 2) * TW
        bm = bms[(i + j) % 2]
        bm.faces.new([bm.verts.new(p) for p in ((x0 + G, y0 + G, 0), (x0 + TW - G, y0 + G, 0), (x0 + TW - G, y0 + TW - G, 0), (x0 + G, y0 + TW - G, 0))])
for bm, name, m in zip(bms, ("floor_white_tiles", "floor_black_tiles"), (white, black)):
    o = M(name, bm, m, smooth=False)
    comp.uv_box(o, 1.0)
M("floor_bed", comp.box((NX * TW, NY * TW, 0.02), at=(0, 0, -0.011)), grout, smooth=False)
comp.export(col, root, "diner", "floor", made="blender/components/diner/floor.py",
            source="own geometry; tiles textured from https://polyhaven.com/a/marble_01", license="ours; texture CC0", credit="Poly Haven (marble_01)",
            notes="its top is z 0: stand it a few millimetres above another floor")
