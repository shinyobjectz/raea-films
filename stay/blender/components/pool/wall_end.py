# pool/wall-end: the hall's end wall, 16 x 6.5 m and 0.3 m thick, modelled by hand: white glazed tiles to a navy trim
# course at 2.1 m, painted plaster above, a coved tile skirting, and the doorway for the far door (1.9 x 2.15 m, its
# centre 5 m right of the hall's middle, over the deck). Its room face is at y 0 facing -y; its origin the middle of
# its foot. The near end wall is the same part turned round. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("wall_end")
tile_m, trim_m, plaster_m = wall_tiles(), trim_tiles(), plaster()
dx, dw, dh = DOOR
bm = wall(HALL_W, HALL_H, WALL_T, holes=[(dx - dw / 2, dx + dw / 2, 0.0, dh)], zs=[DADO])
w = comp.mesh(col, root, "wall_end_wall", bm, [plaster_m, tile_m])
paint(w, lambda c, n: 1 if (n.y < -0.5 and c.z < DADO) else 0)
comp.uv_box(w, 1.0)
trim = [comp.box((dx - dw / 2 + HALL_W / 2, 0.018, 0.1), at=((dx - dw / 2 - HALL_W / 2) / 2, -0.009, DADO + 0.05)), comp.box((HALL_W / 2 - dx - dw / 2, 0.018, 0.1), at=((HALL_W / 2 + dx + dw / 2) / 2, -0.009, DADO + 0.05)),
        comp.box((dw, 0.018, 0.1), at=(dx, -0.009, DADO + 0.05))]
t = comp.mesh(col, root, "wall_end_trim", comp.merge(*trim), trim_m)
comp.bevel(t, 0.006, 2)
comp.uv_box(t, 1.0)
cove = [comp.box((dx - dw / 2 + HALL_W / 2, 0.03, 0.1), at=((dx - dw / 2 - HALL_W / 2) / 2, -0.015, 0.05)), comp.box((HALL_W / 2 - dx - dw / 2, 0.03, 0.1), at=((HALL_W / 2 + dx + dw / 2) / 2, -0.015, 0.05))]
c = comp.mesh(col, root, "wall_end_skirting", comp.merge(*cove), trim_m)
comp.bevel(c, 0.02, 3)
comp.uv_box(c, 1.0)
done(col, root, "wall_end", source="own geometry; tiles https://polyhaven.com/a/long_white_tiles (levels stretched), plaster https://polyhaven.com/a/painted_plaster_wall",
     license="ours; textures CC0", credit="Poly Haven (long_white_tiles, painted_plaster_wall)",
     notes="room face at y 0; doorway centred at x +5.0 (pool/door, pool/exit-sign over it)")
