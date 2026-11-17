# subway/signal: a three-aspect colour-light signal at the tunnel mouth, modelled by hand: a steel post on a base
# with ladder rungs, a black head with a backboard, three hooded lenses (red lit, yellow and green dark: each its
# own material, signal_red, signal_yellow, signal_green), a number plate and a trip-stop arm a metre to its right, between the third rail and the running rail.
# Stands on the track bed at the origin, facing -y (toward the platform's camera end). Rig: "trip" drops the
# stop arm 80 degrees flat; the aspects are the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, slab, bolt

col, root = comp.fresh("signal")
black = comp.mat("signal_head", (0.012, 0.012, 0.014), rough=0.5)
steel = comp.mat("signal_post", (0.2, 0.2, 0.21), rough=0.5, metal=0.8)
plate = comp.mat("signal_plate", (0.9, 0.9, 0.86), rough=0.3)
ink = comp.mat("signal_plate_ink", (0.02, 0.02, 0.02), rough=0.5)
yellow = comp.mat("signal_trip", (0.85, 0.6, 0.03), rough=0.5)
LENS = {"red": comp.mat("signal_red", (0.9, 0.05, 0.03), rough=0.2, emit=(1.0, 0.05, 0.02), strength=6000.0),
        "yellow": comp.mat("signal_yellow", (0.12, 0.08, 0.01), rough=0.2), "green": comp.mat("signal_green", (0.01, 0.1, 0.05), rough=0.2)}
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
PH_, HZ = 2.3, 2.75
M("signal_post", comp.merge(comp.cyl(0.045, PH_, seg=16), comp.box((0.3, 0.3, 0.02), at=(0, 0, 0.01)), lathe([(0.045, 0.02), (0.08, 0.02), (0.05, 0.12), (0.045, 0.12)], seg=16),
                            *[comp.cyl(0.008, 0.26, at=(-0.13, 0.05, 0.5 + i * 0.3), seg=6, axis="X") for i in range(6)]), steel)
M("signal_post_bolts", comp.merge(*[bolt((sx * 0.11, sy * 0.11, 0.02), 0.014, 0.012) for sx in (-1, 1) for sy in (-1, 1)]), steel)
h = M("signal_head", comp.merge(slab(-0.13, 0.13, -0.1, 0.1, PH_ - 0.1, PH_ + 0.8), slab(-0.24, 0.24, -0.105, -0.095, PH_ - 0.18, PH_ + 0.88)), black)
comp.bevel(h, 0.01, 2)
for i, (nm, m) in enumerate(LENS.items()):
    z = PH_ + 0.62 - i * 0.26
    M(f"signal_lens_{nm}", xf(lathe([(0.0, -0.022), (0.05, -0.016), (0.075, 0.0)], seg=24, axis="Y"), T(0, -0.106, z)), m, smooth=True)
    hood = lathe([(0.08, 0.0), (0.085, 0.0), (0.085, -0.16), (0.08, -0.16), (0.08, 0.0)], seg=24, axis="Y")
    bmesh.ops.bisect_plane(hood, geom=hood.verts[:] + hood.edges[:] + hood.faces[:], plane_co=(0, -0.02, -0.02), plane_no=(0, -0.35, -1), clear_outer=True)
    M(f"signal_hood_{nm}", xf(hood, T(0, -0.105, z)), black)
M("signal_plate", slab(-0.1, 0.1, -0.052, -0.046, 1.5, 1.74), plate)
M("signal_plate_ink", xf(comp.text("S\n31", 0.09, depth=0.002), T(0, -0.054, 1.62)), ink)
# the trip stop: a painted arm on a pivot beside the running rail, standing up while the signal is red
tp = comp.pivot(col, root, "signal_trip", (1.0, -0.4, 0.2))
M("signal_trip_box", comp.merge(slab(0.75, 0.97, -0.55, -0.25, 0.0, 0.2), comp.cyl(0.015, 0.75, at=(0.0, -0.4, 0.1), seg=8, axis="X")), steel)
M("signal_trip_arm", comp.merge(slab(0.98, 1.02, -0.43, -0.37, 0.2, 0.42), slab(0.97, 1.03, -0.47, -0.33, 0.4, 0.44), comp.cyl(0.02, 0.1, at=(0.95, -0.4, 0.2), seg=10, axis="X")), yellow, parent=tp)
comp.channel("trip", [(tp, "rotation_euler", 0, 0, math.radians(80))])
comp.export(col, root, "subway", "signal", made="blender/components/subway/signal.py", source="own geometry (a generic three-aspect tunnel signal with a trip stop)", license="ours", credit="",
            rig={"trip": "the stop arm drops 80 degrees to lie flat (the signal clearing)", "aspects": "in the scene: the materials signal_red, signal_yellow and signal_green glow, one at a time"})
