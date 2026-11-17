# subway/wall: 10 m of the platform's back wall, 3.3 m from the deck to the ceiling, modelled by hand: white glazed
# tile (Poly Haven's long_white_tiles, CC0) over a black base course, a green tile band with black borders under a
# plaster top, two mosaic tablets with the station's name (STAY ST, our own), small name tiles along the band, and
# two framed posters of our own between the tablets. A wall item: its back at y 0, its face toward -y, standing on
# the deck. A shell part: turn it to face the track and set copies side by side.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt, CEIL, PLAT

col, root = comp.fresh("wall")
W, H = 10.0, CEIL - PLAT
TH = _lib.tiled_wall(col, root, "wall", W, H, tablets=2, posters=True)
frame = comp.mat("wall_poster_frame", (0.25, 0.26, 0.27), rough=0.35, metal=0.9)
M = lambda n, bm, m: comp.mesh(col, root, n, bm, m)
POST = [(0.0, (0.75, 0.68, 0.5), (0.5, 0.08, 0.05), ["LAST TRAIN", "02:14"], "KEEP BACK FROM THE EDGE"), (-4.1, (0.1, 0.2, 0.35), (0.9, 0.85, 0.7), ["NIGHT", "OWL"], "ALL STOPS  ALL NIGHT")]
fr, sheets = [], []
for i, (x, bg, fg, big, small) in enumerate(POST):
    z, pw, ph = 1.25, 1.0, 1.5
    fr += [slab(x - pw / 2 - 0.03, x + pw / 2 + 0.03, -TH - 0.02, -TH, z + s * (ph / 2 + 0.015) - 0.015, z + s * (ph / 2 + 0.015) + 0.015) for s in (-1, 1)]
    fr += [slab(x + s * (pw / 2 + 0.015) - 0.015, x + s * (pw / 2 + 0.015) + 0.015, -TH - 0.02, -TH, z - ph / 2, z + ph / 2) for s in (-1, 1)]
    M(f"wall_poster_{i + 1}", slab(x - pw / 2, x + pw / 2, -TH - 0.006, -TH, z - ph / 2, z + ph / 2), comp.mat(f"wall_poster_{i + 1}_paper", bg, rough=0.6))
    words = [xf(comp.text(w, 0.19, depth=0.002), T(x, -TH - 0.007, z + 0.35 - k * 0.26)) for k, w in enumerate(big)]
    words.append(xf(comp.text(small, 0.055, depth=0.002), T(x, -TH - 0.007, z - 0.55)))
    words.append(slab(x - 0.36, x + 0.36, -TH - 0.008, -TH - 0.006, z - 0.4, z - 0.385))
    M(f"wall_poster_{i + 1}_ink", comp.merge(*words), comp.mat(f"wall_poster_{i + 1}_ink", fg, rough=0.6))
M("wall_poster_frames", comp.merge(*fr), frame)
comp.export(col, root, "subway", "wall", made="blender/components/subway/wall.py", source="own geometry; tile https://polyhaven.com/a/long_white_tiles; letters in Blender's built-in font", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="Shell part, 10 m wide and 3.3 m high: stands on the platform's deck at its back (5.5 m right of the track), turned to face the track.")
