# office/water-cooler: a bottle water cooler, 1.4 m with its bottle, modelled by hand: a white cabinet with a recessed
# dispensing bay, blue and red taps, a drip tray with a grille, vents, and a 19-litre bottle upside down in its collar,
# the water in it a part of its own with a bubble at its top. Rig: "glug" drops the water's surface 9 cm and lifts the
# bubble through it; "slosh" tilts the water's surface 10 degrees (the reroll's shudder, the cursor's nudge).
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("water_cooler")
white = comp.mat("cooler_body", (0.86, 0.86, 0.84), rough=0.4)
grey = comp.mat("cooler_grey", (0.25, 0.26, 0.28), rough=0.5)
blue = comp.mat("cooler_tap_cold", (0.05, 0.2, 0.75), rough=0.35)
red = comp.mat("cooler_tap_hot", (0.75, 0.06, 0.05), rough=0.35)
bottle_m = comp.mat("cooler_bottle", (0.55, 0.78, 0.95), rough=0.06, alpha=0.28)
water_m = comp.mat("cooler_water", (0.35, 0.62, 0.9), rough=0.03, alpha=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D, H = 0.31, 0.32, 0.98
body = M("water_cooler_body", comp.box((W, D, H), at=(0, 0, H / 2)), white)
comp.bevel(body, 0.014, 4)
M("water_cooler_bay", comp.box((W - 0.07, 0.03, 0.26), at=(0, -D / 2 + 0.006, 0.72)), grey)
for s, m, n in ((-1, blue, "cold"), (1, red, "hot")):
    t = M(f"water_cooler_tap_{n}", comp.merge(comp.cyl(0.011, 0.045, at=(s * 0.055, -D / 2 - 0.04, 0.8), seg=16, axis="Y"), comp.cyl(0.008, 0.03, at=(s * 0.055, -D / 2 - 0.03, 0.77), seg=12),
                                               comp.box((0.03, 0.012, 0.04), at=(s * 0.055, -D / 2 - 0.044, 0.825))), m, smooth=False)
    comp.bevel(t, 0.002, 2)
tray = M("water_cooler_tray", comp.merge(comp.box((W - 0.08, 0.1, 0.02), at=(0, -D / 2 - 0.035, 0.6)), *[comp.box((0.004, 0.09, 0.006), at=(-0.1 + i * 0.02, -D / 2 - 0.035, 0.612)) for i in range(11)]), grey)
M("water_cooler_vents", comp.merge(*[comp.box((W - 0.1, 0.004, 0.006), at=(0, -D / 2 - 0.001, 0.12 + i * 0.022)) for i in range(8)]), grey)
M("water_cooler_collar", comp.cyl(0.075, 0.035, at=(0, 0, H), seg=40, r2=0.09), white, smooth=True)
# the bottle, upside down: neck in the collar, shoulders, a ribbed body, a domed base on top
PROF = [(0.027, 0.0), (0.027, 0.05), (0.06, 0.085), (0.13, 0.14), (0.135, 0.17), (0.135, 0.22), (0.13, 0.228), (0.135, 0.236), (0.135, 0.3), (0.13, 0.308), (0.135, 0.316), (0.135, 0.385), (0.125, 0.41), (0.09, 0.425), (0.0, 0.43)]
def turn(prof, z0, seg=48):
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
BZ = H + 0.012
M("water_cooler_bottle", turn(PROF, BZ), bottle_m, smooth=True)
LEVEL = 0.33
wp = comp.pivot(col, root, "water_cooler_level", (0, 0, BZ + 0.14))
inner = [(0.0, 0.004), (0.024, 0.004), (0.024, 0.05), (0.057, 0.087), (0.127, 0.142), (0.131, 0.17), (0.131, LEVEL), (0.0, LEVEL)]
sl = comp.pivot(col, root, "water_cooler_slosh", (0, 0, BZ + LEVEL), parent=wp)
M("water_cooler_water", turn(inner, BZ), water_m, parent=wp, smooth=True)
M("water_cooler_surface", comp.cyl(0.1305, 0.002, at=(0, 0, BZ + LEVEL - 0.001), seg=48), water_m, parent=sl)
bub = comp.pivot(col, root, "water_cooler_bubble", (0.03, 0.01, BZ + 0.09))
bb = bmesh.new(); bmesh.ops.create_uvsphere(bb, u_segments=16, v_segments=10, radius=0.022); xf(bb, T(0.03, 0.01, BZ + 0.09))
M("water_cooler_bubble_mesh", bb, comp.mat("cooler_bubble", (0.9, 0.96, 1.0), rough=0.02, alpha=0.35), parent=bub, smooth=True)
comp.channel("glug", [(wp, "scale", 2, 1.0, 0.52), (bub, "location", 2, bub.location.z, bub.location.z + 0.12), (bub, "scale", 0, 1.0, 1.5), (bub, "scale", 1, 1.0, 1.5)])
comp.channel("slosh", [(sl, "rotation_euler", 1, 0, math.radians(10))])
comp.export(col, root, "office", "water_cooler", made="blender/components/office/water_cooler.py", source="own geometry (a generic bottle water cooler)", license="ours", credit="",
            rig={"glug": "the water's surface drops 9 cm and a bubble rises through it", "slosh": "the water's surface tilts 10 degrees"})
