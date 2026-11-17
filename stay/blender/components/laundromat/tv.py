# laundromat/tv: a small CRT television (Poly Haven's television_02, CC0, at 1.3 times: a 19 inch set) on a wall
# bracket, high in a corner: a steel wall plate, a tube arm, a tray the set is strapped to, tipped 12 degrees down at
# the room, its lead and aerial cable looping to the wall. The picture is a pane of its own just proud of the tube's
# glass, in its own material (tv_screen). The back of the wall plate is at y 0; the origin is the plate's middle.
# Rig: "screen" is the scene's (tv_screen's picture and glow, a key per state); "swing" turns the set and its tray 40
# degrees on the arm's end.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, path, rbox, ph_add, T, R, S, xf
import bmesh

col, root = comp.fresh("tv")
M = _lib.maker(col, root)
steel = comp.mat("tv_bracket", (0.08, 0.08, 0.09), rough=0.45)
cable = comp.mat("tv_cable", (0.02, 0.02, 0.022), rough=0.6)
screen = comp.mat("tv_screen", (0.1, 0.14, 0.2), rough=0.15, emit=(0.35, 0.55, 0.9), strength=2.5)
strap = comp.mat("tv_strap", (0.75, 0.6, 0.1), rough=0.6)
AY, AZ = -0.42, -0.1                      # the arm's end: where the tray turns
M("tv_wall_plate", rbox((0.2, 0.012, 0.3), at=(0, -0.006, 0), r=0.004), steel)
M("tv_wall_bolts", comp.merge(*[turn([(0.0, 0.006), (0.009, 0.006), (0.011, 0.0)], seg=6, axis="F", at=(sx * 0.07, -0.012, sz * 0.11)) for sx in (-1, 1) for sz in (-1, 1)]), comp.mat("tv_bolts", (0.6, 0.6, 0.62), rough=0.3, metal=0.9))
M("tv_arm", comp.merge(path([(0, -0.012, 0.08), (0, -0.2, -0.04), (0, AY, AZ)], 0.02, seg=12), path([(0, -0.012, -0.11), (0, -0.2, -0.085), (0, AY, AZ)], 0.014, seg=10), comp.cyl(0.03, 0.04, at=(0, AY, AZ - 0.02), seg=20)), steel, smooth=True)
sw = comp.pivot(col, root, "tv_swing", (0, AY, AZ))
tilt = comp.pivot(col, root, "tv_tilt", (0, AY, AZ + 0.03), parent=sw)
tray = comp.merge(rbox((0.5, 0.46, 0.012), at=(0, AY, AZ + 0.036), r=0.004), comp.box((0.5, 0.012, 0.04), at=(0, AY + 0.224, AZ + 0.06)), comp.box((0.012, 0.46, 0.025), at=(-0.244, AY, AZ + 0.05)), comp.box((0.012, 0.46, 0.025), at=(0.244, AY, AZ + 0.05)),
                  comp.cyl(0.035, 0.03, at=(0, AY, AZ + 0.006), seg=20))
M("tv_tray", tray, steel, parent=tilt)
parts, credit = ph_add(col, root, "television_02", "tv_set", at=(0, AY - 0.02, AZ + 0.042), scale=1.3, res="2k", parent=tilt)
lo, hi = comp.box_of(list(parts.values()))
# the picture: a pane bulged like the tube's face, a hair in front of it
g = comp.grid(0.335, 0.262, 10, 8)
for v in g.verts:
    v.co.y = 0.016 * ((v.co.x / 0.17) ** 2 + (v.co.z / 0.13) ** 2)
    k = max(abs(v.co.x) / 0.1675, abs(v.co.z) / 0.131)
xf(g, T((lo.x + hi.x) / 2 - 0.022, lo.y - 0.004 + 0.016, lo.z + (hi.z - lo.z) * 0.6))
M("tv_screen", g, screen, parent=tilt, smooth=True)
M("tv_strap", comp.merge(comp.box((0.03, 0.002, hi.z - lo.z + 0.004), at=(0.2, lo.y - 0.001 + (hi.y - lo.y), (lo.z + hi.z) / 2)), comp.box((0.03, hi.y - lo.y + 0.004, 0.002), at=(0.2, (lo.y + hi.y) / 2, hi.z + 0.001)),
                           comp.box((0.03, 0.002, (hi.z - lo.z) * 0.18), at=(0.2, lo.y - 0.001, hi.z - (hi.z - lo.z) * 0.09))), strap, parent=tilt)
M("tv_cables", comp.merge(comp.tube([(0.1, hi.y, lo.z + 0.1), (0.14, hi.y + 0.08, lo.z - 0.02), (0.1, -0.1, -0.2), (0.07, -0.014, -0.13)], 0.004, res=8), comp.tube([(-0.1, hi.y, lo.z + 0.2), (-0.16, hi.y + 0.1, lo.z + 0.05), (-0.1, -0.08, -0.16), (-0.06, -0.014, 0.12)], 0.003, res=8)), cable, smooth=True)
tilt.rotation_euler[0] = math.radians(12)
_lib.channel("swing", [(sw, "rotation_euler", 2, 0, math.radians(40))])
comp.export(col, root, _lib.PLACE, "tv", made="blender/components/laundromat/tv.py",
            source="https://polyhaven.com/a/television_02 (the set); bracket, tray, strap, cables and the picture's pane own geometry", license="CC0; ours", credit=credit,
            rig={"screen": "in the scene: the material tv_screen (the picture's pane), its picture and glow, a key per state",
                 "swing": "the set and its tray turn 40 degrees on the arm's end (tv_swing)"},
            notes="Wall plate's back at y 0, origin its middle; the set hangs 0.42 m out and looks 12 degrees down. Mount it about 2.3 m up.")
