# office/blinds: a venetian blind for a 1.5 x 1.7 m window, modelled by hand: a steel headrail, 56 curved aluminium
# slats each a part of its own on two ladder tapes, a bottom rail, the lift cords, a tilt wand. Its origin is the
# headrail's top centre against the wall (y 0); it hangs down the window. Rig: "slats" turns every slat 70 degrees
# from open (flat, the light through) to shut; "raise" gathers the slats and the bottom rail up under the headrail.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("blinds")
alu = comp.mat("blinds_slat", (0.84, 0.83, 0.79), rough=0.35, metal=0.0)
rail_m = comp.mat("blinds_rail", (0.78, 0.78, 0.76), rough=0.4)
cord_m = comp.mat("blinds_cord", (0.8, 0.79, 0.74), rough=0.8)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, DROP, N, SW = 1.5, 1.7, 56, 0.025
Y = -0.035
hr = M("blinds_headrail", comp.box((W, 0.03, 0.028), at=(0, Y, -0.014)), rail_m)
comp.bevel(hr, 0.002, 2)
pitch = (DROP - 0.06) / N
slats = []
for i in range(N):
    z = -0.045 - i * pitch
    p = comp.pivot(col, root, f"blinds_slat_{i + 1:02d}", (0, Y, z))
    g = bmesh.new()
    bmesh.ops.create_grid(g, x_segments=1, y_segments=4, size=0.5)
    xf(g, S(W - 0.01, SW, 1))
    for v in g.verts:
        v.co.z = 0.0022 * (1 - (2 * v.co.y / SW) ** 2)   # a slat is crowned
    xf(g, T(0, Y, z))
    so = M(f"blinds_slat_{i + 1:02d}_mesh", g, alu, parent=p, smooth=True)
    comp.solidify(so, 0.0005)
    slats.append((p, z))
bz = -0.045 - N * pitch
bp = comp.pivot(col, root, "blinds_bottom", (0, Y, bz))
br = M("blinds_bottom_rail", comp.box((W, 0.026, 0.012), at=(0, Y, bz)), rail_m, parent=bp)
comp.bevel(br, 0.002, 2)
cords = comp.pivot(col, root, "blinds_cords", (0, Y, -0.028))
M("blinds_cords_mesh", comp.merge(*[comp.cyl(0.0008, -bz - 0.028, at=(x, Y + dy, bz), seg=6) for x in (-W / 2 + 0.2, W / 2 - 0.2) for dy in (-SW / 2 - 0.001, SW / 2 + 0.001, 0)]), cord_m, parent=cords)
M("blinds_wand", comp.merge(comp.cyl(0.004, 0.7, at=(-W / 2 + 0.08, Y - 0.025, -0.73), seg=6), comp.cyl(0.0015, 0.03, at=(-W / 2 + 0.08, Y - 0.025, -0.03), seg=6)), comp.mat("blinds_wand", (0.9, 0.9, 0.88), rough=0.2, alpha=0.6), smooth=True)
M("blinds_pull", comp.merge(comp.cyl(0.0012, 0.9, at=(W / 2 - 0.08, Y - 0.022, -0.93), seg=6), comp.cyl(0.006, 0.03, at=(W / 2 - 0.08, Y - 0.022, -0.96), seg=10, r2=0.003)), cord_m)
comp.channel("slats", [(p, "rotation_euler", 0, 0, math.radians(70)) for p, z in slats])
STACK = 0.0028
comp.channel("raise", [(p, "location", 2, p.location.z, -0.034 - i * STACK) for i, (p, z) in enumerate(slats)]
             + [(bp, "location", 2, bp.location.z, -0.04 - N * STACK), (cords, "scale", 2, 1.0, (0.012 + N * STACK) / (-bz - 0.028))])
comp.export(col, root, "office", "blinds", made="blender/components/office/blinds.py", source="own geometry (a generic venetian blind)", license="ours", credit="",
            rig={"slats": "every slat turns 70 degrees, from open (flat) to shut", "raise": "the slats and the bottom rail gather up under the headrail"})
