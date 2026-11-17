# laundromat/wall-back: the wall the dryers stand against, 9 m long and 3 m high, 0.2 m thick, its room face at y 0:
# pale green painted plaster (Poly Haven's painted_plaster_wall) over a wainscot of white tile (long_white_tiles) with a
# steel cap rail and a black cove base; a run of steel conduit to a junction box and two sockets, a thermostat, and
# a row of coat hooks. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, label, T, R, S, xf

col, root = comp.fresh("wall_back")
M = _lib.maker(col, root)
m = _lib.wall_mats()
L, Hh = 9.0, 3.0
_lib.wall(M, "wall_back", L, Hh, m)
# conduit: down from the ceiling to a junction box, then along over the wainscot to the sockets
CX = 3.3
pipes = [comp.cyl(0.011, Hh - 1.62, at=(CX, -0.02, 1.62), seg=12), comp.cyl(0.011, 1.9, at=(CX - 1.9, -0.02, 1.5), seg=12, axis="X")]
straps = [rbox((0.05, 0.006, 0.02), at=(CX, -0.03, z), r=0.002) for z in (1.9, 2.4, 2.85)] + [rbox((0.02, 0.006, 0.05), at=(x, -0.03, 1.5), r=0.002) for x in (CX - 0.5, CX - 1.2)]
M("wall_back_conduit", comp.merge(*pipes, *straps), m["steel"], smooth=True)
M("wall_back_junction", comp.merge(rbox((0.11, 0.05, 0.11), at=(CX, -0.025, 1.56), r=0.004), rbox((0.1, 0.05, 0.1), at=(CX - 1.9, -0.025, 1.5), r=0.004)), m["steel"])
parts = [_lib.outlet((x, 1.5), None, None) for x in (CX - 1.9,)] + [_lib.outlet((x, 0.45), None, None) for x in (-3.9, 4.1)]
M("wall_back_socket_plates", comp.merge(*[xf(p[0], T(0, -0.04 if i == 0 else 0, 0)) for i, p in enumerate(parts)]), m["white"])
M("wall_back_socket_faces", comp.merge(*[xf(p[1], T(0, -0.04 if i == 0 else 0, 0)) for i, p in enumerate(parts)]), m["white"])
M("wall_back_socket_slots", comp.merge(*[xf(p[2], T(0, -0.04 if i == 0 else 0, 0)) for i, p in enumerate(parts)]), m["dark"])
# a thermostat and a light switch by the right end
M("wall_back_thermostat", comp.merge(rbox((0.12, 0.028, 0.085), at=(4.1, -0.014, 1.55), r=0.008), rbox((0.075, 0.006, 0.12), at=(3.85, -0.003, 1.4), r=0.002)), m["white"])
M("wall_back_thermostat_dial", comp.merge(turn([(0.0, 0.012), (0.024, 0.012), (0.028, 0.0)], seg=24, axis="F", at=(4.1, -0.028, 1.55)), comp.box((0.012, 0.008, 0.024), at=(3.85, -0.008, 1.4))), m["rail"], smooth=True)
# coat hooks on a board, left of the dryers
M("wall_back_hook_board", rbox((0.9, 0.018, 0.09), at=(-3.7, -0.009, 1.75), r=0.004), m["white"])
M("wall_back_hooks", comp.merge(*[comp.merge(comp.tube([(x, -0.018, 1.77), (x, -0.07, 1.76), (x, -0.085, 1.73), (x, -0.075, 1.705), (x, -0.06, 1.71)], 0.005, res=8, sides=3), disc(0.014, seg=12, at=(x, -0.0185, 1.77))) for x in (-4.05, -3.82, -3.58, -3.35)]), m["steel"], smooth=True)
comp.export(col, root, _lib.PLACE, "wall_back", made="blender/components/laundromat/wall_back.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall; tiles: https://polyhaven.com/a/long_white_tiles", license="ours; textures CC0", credit="Poly Haven (painted_plaster_wall, long_white_tiles)", rig={},
            notes="Its room face is at y 0 (raea z 0), facing the camera; the dryers stand against it.")
