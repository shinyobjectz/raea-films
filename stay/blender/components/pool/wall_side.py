# pool/wall-side: one long wall of the hall, 30 x 6.5 m and 0.3 m thick, modelled by hand: white glazed tiles to a
# navy trim course at 2.1 m, painted plaster above with six clerestory openings (3.2 x 1.8 m, sills at 3.6 m, every
# 4.5 m) for pool/windows, each with a tiled sill, and pilasters between the bays. Room face at y 0 facing -y; the
# origin the middle of its foot. It stands along the pool turned a quarter. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("wall_side")
tile_m, trim_m, plaster_m = wall_tiles(), trim_tiles(), plaster()
ww, wh, sill = WIN
bm = wall(HALL_L, HALL_H, WALL_T, holes=[(x - ww / 2, x + ww / 2, sill, sill + wh) for x in WIN_X], zs=[DADO])
w = comp.mesh(col, root, "wall_side_wall", bm, [plaster_m, tile_m])
paint(w, lambda c, n: 1 if (n.y < -0.5 and c.z < DADO) else 0)
comp.uv_box(w, 1.0)
t = comp.mesh(col, root, "wall_side_trim", comp.box((HALL_L, 0.018, 0.1), at=(0, -0.009, DADO + 0.05)), trim_m)
comp.bevel(t, 0.006, 2)
comp.uv_box(t, 1.0)
c = comp.mesh(col, root, "wall_side_skirting", comp.box((HALL_L, 0.03, 0.1), at=(0, -0.015, 0.05)), trim_m)
comp.bevel(c, 0.02, 3)
comp.uv_box(c, 1.0)
s = comp.mesh(col, root, "wall_side_sills", comp.merge(*[comp.box((ww + 0.12, 0.2, 0.04), at=(x, -0.02 + 0.06, sill - 0.005)) for x in WIN_X]), tile_m)
comp.bevel(s, 0.01, 2)
comp.uv_box(s, 1.0)
# pilasters between the bays, from the trim course to the soffit (the hall's frame showing through the plaster)
xs = [(a + b) / 2 for a, b in zip(WIN_X, WIN_X[1:])] + [WIN_X[0] - 2.25 - 0.25, WIN_X[-1] + 2.25 + 0.25]
p = comp.mesh(col, root, "wall_side_pilasters", comp.merge(*[comp.box((0.4, 0.12, HALL_H - DADO - 0.1), at=(x, -0.06, (HALL_H + DADO + 0.1) / 2)) for x in xs]), plaster_m)
comp.bevel(p, 0.01, 2)
comp.uv_box(p, 1.0)
done(col, root, "wall_side", source="own geometry; tiles https://polyhaven.com/a/long_white_tiles (levels stretched), plaster https://polyhaven.com/a/painted_plaster_wall",
     license="ours; textures CC0", credit="Poly Haven (long_white_tiles, painted_plaster_wall)",
     notes="room face at y 0; window openings centred at x -11.25 .. +11.25 every 4.5 m, sills at 3.6 m")
