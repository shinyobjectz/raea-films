# court/basketball: an outdoor rubber basketball, size 7 (23.9 cm), modelled by hand as the gym's: orange pebbled rubber
# with its eight panels' black seams painted on the sphere. It rests on the ground at the origin.
# Rig: "drop" falls it 1.5 m straight down (set it above the rim: the ball going through the hoop); "spin" turns it one
# whole turn of backspin about x; "squash" flattens it 22% onto the ground (a bounce's bottom).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp

col, root = comp.fresh("basketball")
M = _lib.maker(col, root)
r = _lib.BALL_R
drop = comp.pivot(col, root, "basketball_drop", (0, 0, r))
squash = comp.pivot(col, root, "basketball_squash", (0, 0, 0), parent=drop)
spin = comp.pivot(col, root, "basketball_spin", (0, 0, r), parent=squash)
ball = M("basketball_ball", _lib.ball_bm(at=(0, 0, r), turn=(0.5, 0.3, 0.8)), _lib.ball_mat(), parent=spin)
_lib.channel("drop", [(drop, "location", 2, drop.location.z, drop.location.z - 1.5)])
_lib.channel("spin", [(spin, "rotation_euler", 0, 0, 2 * math.pi)])
_lib.channel("squash", [(squash, "scale", 2, 1.0, 0.78), (squash, "scale", 0, 1.0, 1.1), (squash, "scale", 1, 1.0, 1.1)])
comp.export(col, root, "court", "basketball", made="blender/components/court/basketball.py", source="own geometry and our own painted skin", license="ours", credit="",
            rig={"drop": "the ball falls 1.5 m straight down from where it is set", "spin": "one whole turn of backspin about x", "squash": "the ball flattens 22% onto the ground under it"})
