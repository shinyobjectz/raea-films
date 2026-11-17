# clocktower/bell: the hour bell in its timber frame, modelled by hand: a bronze bell 0.62 m across (turned profile:
# lip, sound bow, waist, shoulder, crown and canons) bolted under an oak headstock between two posts on sole plates,
# and beside it the clock hammer: a cast head on a steel arm pivoted on the post, its tail wired down toward the
# movement, a check spring under it. Origin: the floor under the bell. Rig: "strike" swings the hammer 16 degrees
# onto the sound bow; "ring" tips the bell 6 degrees away from the blow.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, bolt

col, root = comp.fresh("bell")
bronze = comp.mat("bell_bronze", (0.42, 0.27, 0.11), rough=0.42, metal=1.0)
oak = comp.ph_texture("bell_oak", "rough_wood", tile=0.8, res="1k", tint=(0.75, 0.62, 0.48))
iron = comp.mat("bell_iron", (0.03, 0.03, 0.035), rough=0.55, metal=0.5)
steel = comp.mat("bell_steel", (0.5, 0.5, 0.52), rough=0.35, metal=1.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, H, HS = 0.62, 1.75, 1.42  # between the posts, the posts' height, the headstock's underside
tim = []
for s in (-1, 1):
    tim.append(comp.box((0.14, 0.14, H), at=(s * W, 0, H / 2)))
    tim.append(comp.box((0.16, 0.9, 0.1), at=(s * W, 0, 0.05)))
    for d in (-1, 1):
        b = comp.box((0.09, 0.09, 0.62), at=(0, 0, 0))
        xf(b, R(d * 38, "X")); xf(b, T(s * W, d * 0.24, 0.4)); tim.append(b)
tim.append(comp.box((2 * W + 0.34, 0.16, 0.18), at=(0, 0, HS + 0.09)))
t = M("bell_frame", comp.merge(*tim), oak)
comp.bevel(t, 0.006, 2)
comp.uv_box(t)
ring = comp.pivot(col, root, "bell_ring", (0, 0, HS))
PROF = [(0.0, 0.0), (0.085, 0.0), (0.12, -0.02), (0.155, -0.07), (0.17, -0.16), (0.185, -0.27), (0.215, -0.36), (0.262, -0.43), (0.305, -0.475), (0.31, -0.495), (0.292, -0.5),
        (0.262, -0.468), (0.225, -0.41), (0.185, -0.35), (0.16, -0.26), (0.145, -0.16), (0.13, -0.08), (0.1, -0.04), (0.0, -0.03)]
M("bell_body", lathe(PROF, seg=64, at=(0, 0, HS - 0.06)), bronze, parent=ring, smooth=True)
bands = [lathe([(r, z - 0.006), (r + 0.006, z), (r, z + 0.006)], seg=64, at=(0, 0, HS - 0.06)) for r, z in ((0.172, -0.17), (0.176, -0.2), (0.27, -0.44), (0.157, -0.08))]
M("bell_bands", comp.merge(*bands), bronze, parent=ring, smooth=True)
M("bell_canons", comp.merge(comp.cyl(0.05, 0.06, at=(0, 0, HS - 0.06), seg=24), *[bolt((0.03 * math.cos(a), 0.03 * math.sin(a), HS + 0.18), 0.014, 0.014) for a in (0.5, 2.6, 4.7)],
                            comp.box((0.2, 0.05, 0.012), at=(0, 0, HS + 0.186)), comp.cyl(0.012, 0.2, at=(0.03 * math.cos(0.5), 0.03 * math.sin(0.5), HS - 0.01), seg=10)), iron, parent=ring)
# the hammer: pivoted on the right post, its head resting 4 cm off the sound bow
PX, PZ = W - 0.09, HS - 0.2
ham = comp.pivot(col, root, "bell_hammer", (PX, -0.12, PZ))
BOW = (0.325, HS - 0.06 - 0.455)
ang = math.degrees(math.atan2(BOW[0] - PX + 0.085, PZ - BOW[1]))
arm = comp.merge(comp.box((0.022, 0.014, 0.52), at=(0, 0, -0.2)), comp.box((0.022, 0.014, 0.16), at=(0, 0, 0.1)))
head = comp.merge(lathe([(0.0, 0), (0.03, 0.004), (0.036, 0.02), (0.036, 0.08), (0.03, 0.096), (0.0, 0.1)], seg=20, axis="X", at=(-0.085, 0, -0.44)))
hm = comp.merge(arm, head, comp.cyl(0.02, 0.05, at=(0, -0.025, 0), seg=16, axis="Y"))
xf(hm, R(-ang + 16, "Y")); xf(hm, T(PX, -0.12, PZ))
h = M("bell_hammer_arm", hm, iron, parent=ham)
comp.bevel(h, 0.003, 2)
M("bell_hammer_bracket", comp.merge(comp.box((0.1, 0.13, 0.08), at=(W - 0.07, -0.075, PZ)), bolt((W - 0.04, -0.14, PZ + 0.02), 0.01, 0.01, axis="Y")), iron)
# the wire down from the hammer's tail, and the check spring
tail = Vector((PX, -0.12, PZ)) + comp.Matrix.Rotation(math.radians(-ang + 16), 3, "Y") @ Vector((0, 0, 0.17))
M("bell_wire", comp.cyl(0.0025, tail.z - 0.02, at=(tail.x, -0.12, 0.02), seg=6), steel)
M("bell_check_spring", xf(comp.box((0.3, 0.03, 0.004), at=(-0.13, 0, 0)), comp.Matrix.Translation((W - 0.07, -0.1, PZ - 0.38)) @ R(-12, "Y")), steel)
comp.channel("strike", [(ham, "rotation_euler", 1, 0, math.radians(16))])
comp.channel("ring", [(ring, "rotation_euler", 1, 0, math.radians(6))])
comp.export(col, root, "clocktower", "bell", made="blender/components/clocktower/bell.py", source="own geometry (a generic hour bell, frame and clock hammer); oak: https://polyhaven.com/a/rough_wood", license="ours; texture CC0", credit="texture: Poly Haven",
            rig={"strike": "the hammer swings 16 degrees about its pivot onto the bell's sound bow", "ring": "the bell tips 6 degrees away from the blow about its headstock"})
