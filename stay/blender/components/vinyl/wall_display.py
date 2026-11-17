# vinyl/wall-display: the wall's face-out display, modelled by hand: two plywood picture ledges 1.5 m long, four LPs
# leaning on each in their sleeves (designs of our own), price stickers on their corners, and a painted NEW ARRIVALS
# board above on two chains. A wall piece: its back at y 0, the origin at the lower ledge's middle. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("wall_display")
rng = random.Random(11)
INK = inks()
ply = comp.ph_texture("wall_display_plywood", "plywood", tile=0.5, res="1k")
board = comp.mat("wall_display_board", (0.022, 0.085, 0.08), rough=0.45)
cream = comp.mat("wall_display_letters", (0.92, 0.86, 0.7), rough=0.6)
sticker = comp.mat("wall_display_sticker", (0.95, 0.85, 0.15), rough=0.5)
steel = comp.mat("wall_display_chain", (0.6, 0.6, 0.62), rough=0.3, metal=1.0)
W = 1.5
sl, st = [], []
for r, z in enumerate((0.0, 0.42)):
    led = M(f"wall_display_ledge_{r + 1}", comp.merge(comp.box((W, 0.07, 0.018), at=(0, -0.035, z - 0.009)), comp.box((W, 0.012, 0.03), at=(0, -0.064, z + 0.006)), comp.box((W, 0.012, 0.05), at=(0, -0.006, z + 0.016))), ply)
    comp.uv_box(led, 1.0)
    comp.bevel(led, 0.0015, 2)
    for k in range(4):
        x = -0.54 + k * 0.36 + rng.uniform(-0.01, 0.01)
        m = T(x, -0.05, z) @ R(-7, "X")
        sl.append(xf(sleeve(rng, art=True), m))
        st.append(xf(comp.cyl(0.016, 0.0006, at=(0.125, -0.0024, 0.285), seg=20, axis="Y"), m))
M("wall_display_sleeves", comp.merge(*sl), INK)
M("wall_display_stickers", comp.merge(*st), sticker)
BZ = 0.9
b = M("wall_display_board", comp.box((0.9, 0.018, 0.16), at=(0, -0.012, BZ)), board)
comp.bevel(b, 0.003, 2)
M("wall_display_words", xf(comp.text("NEW ARRIVALS", 0.075, depth=0.002), T(0, -0.022, BZ)), cream)
shade(M("wall_display_chains", comp.merge(*[comp.merge(comp.cyl(0.0025, 0.14, at=(sx * 0.4, -0.012, BZ + 0.08), seg=8), comp.cyl(0.006, 0.01, at=(sx * 0.4, -0.012, BZ + 0.22), seg=10, axis="Y")) for sx in (-1, 1)]), steel))
done(col, root, "wall_display", "own geometry (picture ledges of LPs and a sign; plywood https://polyhaven.com/a/plywood, CC0)")
