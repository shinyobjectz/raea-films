# gym/basketball: the montage's circle (board/chain.ts: "the ball ... bounced up to the upper third, it hangs"). A size
# 7 basketball, 23.9 cm, modelled by hand: orange pebbled rubber with the eight panels' black seams (painted on by
# gym/_lib.py), a valve. It rests on the floor at the origin.
# Rig: "bounce" lifts it 2.6 m straight up (rest on the floor, full at the top of its bounce, where it hangs);
# "squash" presses it to 78% of its height against the floor (the instant it lands); "spin" gives it one whole turn of
# backspin about its side-to-side axis; where it is on the court is the Model's own position.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import T, R, S, xf, BALL_R

col, root = comp.fresh("basketball")
M = _lib.maker(col, root)
up = comp.pivot(col, root, "basketball_bounce", (0, 0, 0))
sq = comp.pivot(col, root, "basketball_squash", (0, 0, 0), parent=up)
sp = comp.pivot(col, root, "basketball_spin", (0, 0, BALL_R), parent=sq)
M("basketball_ball", _lib.ball_bm(at=(0, 0, BALL_R), turn=(math.radians(20), math.radians(-15), math.radians(35))), _lib.ball_mat(), parent=sp)
v = comp.cyl(0.003, 0.001, seg=10)
xf(v, T(0, 0, BALL_R - 0.0006)); xf(v, R(-62, "X")); xf(v, R(25, "Z")); xf(v, T(0, 0, BALL_R))
M("basketball_valve", v, comp.mat("ball_valve", (0.01, 0.01, 0.01), rough=0.6), parent=sp)
comp.channel("bounce", [(up, "location", 2, 0, 2.6)])
comp.channel("squash", [(sq, "scale", 2, 1.0, 0.78)])
comp.channel("spin", [(sp, "rotation_euler", 0, 0, 2 * math.pi)])
comp.export(col, root, "gym", "basketball", made="blender/components/gym/basketball.py",
            source="own geometry and painted skin (a generic basketball, no maker's mark)", license="ours", credit="",
            rig={"bounce": "the ball 2.6 m straight up from the floor: the top of the bounce, where it hangs (the circle from CC to TC)",
                 "squash": "pressed to 78% of its height against the floor, the instant it lands",
                 "spin": "one whole turn of backspin about its side-to-side axis",
                 "position": "the Model's own position on the court"},
            notes="the circle is 23.9 cm; its centre is 0.12 m above the origin at rest")
