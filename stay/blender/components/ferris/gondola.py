# ferris/gondola: one of the wheel's gondolas off the wheel, hung on a service trestle (two steel A-frames with a
# tie bar), modelled by hand with the wheel's own builder (_lib.gondola): hanger arms, an open tub with two facing
# benches, a half door, a lap rail, the cream trim, its number, an eight-gore canopy with a scalloped valance.
# The rod is 2.3 m up; origin on the ground under it. Rig: "swing" swings the gondola 16 degrees on its rod;
# "door" opens the half door 95 degrees outward; "upward" swings it half a turn to stand above the rod.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("gondola")
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
cream = comp.mat("wheel_cream", (0.88, 0.82, 0.62), rough=0.45)
body = comp.mat("gondola_red", (0.6, 0.05, 0.04), rough=0.35)
ink = comp.mat("gondola_number", (0.95, 0.92, 0.8), rough=0.4)
seat = comp.mat("gondola_seat", (0.1, 0.07, 0.05), rough=0.6)
yellow = comp.mat("trestle_yellow", (0.8, 0.55, 0.05), rough=0.45)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
ZR = 2.3
gp = comp.pivot(col, root, "gondola_swing", (0, 0, ZR))
L.gondola(M, "gondola", (0, 0, ZR), body, cream, galv, seat, body, cream, gp, number=7, ink=ink)
door = comp.bpy.data.objects["gondola_door"]
dp = comp.hang(col, root, door, "gondola_door_hinge", at=(0.65 - 0.012, -0.27, ZR - 2.02 + 0.3), parent=gp)
tr = []
for s in (-1, 1):
    y = s * 0.95
    tr += [L.seg((-1.1, y, 0), (0, y, ZR + 0.05), 0.035, 8), L.seg((1.1, y, 0), (0, y, ZR + 0.05), 0.035, 8), L.seg((-0.62, y, 1.0), (0.62, y, 1.0), 0.025, 8),
           comp.box((0.3, 0.12, 0.02), at=(-1.1, y, 0.01)), comp.box((0.3, 0.12, 0.02), at=(1.1, y, 0.01)), comp.cyl(0.07, 0.12, at=(0, y - 0.06, ZR), seg=12, axis="Y")]
tr += [L.seg((-1.1, -0.95, 0.05), (-1.1, 0.95, 0.05), 0.025, 8), L.seg((1.1, -0.95, 0.05), (1.1, 0.95, 0.05), 0.025, 8), L.seg((0, -0.95, ZR), (0, -0.78, ZR), 0.03, 8), L.seg((0, 0.78, ZR), (0, 0.95, ZR), 0.03, 8)]
M("gondola_trestle", comp.merge(*tr), yellow, None, True)
comp.channel("swing", [(gp, "rotation_euler", 1, 0, math.radians(16))])
comp.channel("door", [(dp, "rotation_euler", 2, 0, math.radians(-95))])
comp.channel("upward", [(gp, "rotation_euler", 1, 0, math.pi)])
comp.export(col, root, "ferris", "gondola", made="blender/components/ferris/gondola.py", source="own geometry (a generic Ferris wheel gondola on a service trestle); number in Blender's built-in font", license="ours", credit="",
            rig={"swing": "the gondola swings 16 degrees on its rod", "door": "the half door opens 95 degrees outward on its hinge", "upward": "the gondola swings half a turn about its rod, to stand upside down above it"})
