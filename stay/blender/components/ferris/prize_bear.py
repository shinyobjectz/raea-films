# ferris/prize-bear: a sitting plush prize bear, 45 cm, modelled by hand: a pear-shaped body, a head with a short
# muzzle and round ears with paler pads, bead eyes, a stitched nose, arms and legs as limbs of their own with paw
# pads, a satin bow at its neck and a swing tag on a string; the plush is Poly Haven's curly_teddy_natural.
# It sits on the floor facing -y; scale it up for the stall's top prize.
# Rig: "wave" raises its right arm 120 degrees from its shoulder; "nod" tips its head 22 degrees forward;
# "slump" tips the whole bear 75 degrees over onto its side (knocked from its shelf).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("prize_bear")
plush = comp.ph_texture("bear_plush", "curly_teddy_natural", tile=0.25, res="1k")
pad = comp.ph_texture("bear_pad", "curly_teddy_natural", tile=0.25, res="1k", tint=(1.0, 0.86, 0.7))
black = comp.mat("bear_eye", (0.01, 0.01, 0.012), rough=0.08)
bow_m = comp.mat("bear_bow", (0.6, 0.04, 0.06), rough=0.3)
tag_m = comp.mat("bear_tag", (0.92, 0.9, 0.8), rough=0.6)
whole = comp.pivot(col, root, "prize_bear_whole", (0.12, 0, 0))
def blob(name, r, at, sc, m, parent, rot=None):
    bm = L.sphere(1.0, u=20, v=14)
    xf(bm, S(r * sc[0], r * sc[1], r * sc[2]))
    if rot is not None:
        xf(bm, rot)
    xf(bm, T(*at))
    o = comp.mesh(col, root, name, bm, m, parent=parent, smooth=True)
    comp.uv_box(o, 1.0)
    return o
blob("prize_bear_body", 0.11, (0, 0.01, 0.13), (1.0, 0.92, 1.18), plush, whole)
blob("prize_bear_tummy", 0.08, (0, -0.035, 0.125), (0.95, 0.75, 1.1), pad, whole)
head = comp.pivot(col, root, "prize_bear_head", (0, 0.0, 0.25), parent=whole)
blob("prize_bear_skull", 0.095, (0, 0.0, 0.33), (1.05, 0.95, 0.95), plush, head)
blob("prize_bear_muzzle", 0.045, (0, -0.075, 0.31), (1.1, 0.9, 0.8), pad, head)
for s, side in ((-1, "l"), (1, "r")):
    blob(f"prize_bear_ear_{side}", 0.038, (s * 0.075, 0.01, 0.405), (1.0, 0.45, 1.0), plush, head)
    blob(f"prize_bear_ear_pad_{side}", 0.025, (s * 0.075, -0.004, 0.405), (1.0, 0.35, 1.0), pad, head)
    comp.mesh(col, root, f"prize_bear_eye_{side}", L.sphere(0.012, at=(s * 0.038, -0.083, 0.345), u=10, v=8), black, parent=head, smooth=True)
comp.mesh(col, root, "prize_bear_nose", xf(L.sphere(1.0, u=10, v=8), comp.Matrix.Translation((0, -0.115, 0.322)) @ S(0.016, 0.01, 0.011)), black, parent=head, smooth=True)
comp.mesh(col, root, "prize_bear_mouth", comp.merge(comp.box((0.002, 0.003, 0.018), at=(0, -0.113, 0.303)), xf(comp.box((0.02, 0.003, 0.002)), comp.Matrix.Translation((0.008, -0.111, 0.294)) @ R(-25, "Y")), xf(comp.box((0.02, 0.003, 0.002)), comp.Matrix.Translation((-0.008, -0.111, 0.294)) @ R(25, "Y"))), black, parent=head)
arms = {}
for s, side in ((-1, "l"), (1, "r")):
    ap = comp.pivot(col, root, f"prize_bear_arm_{side}", (s * 0.095, 0.0, 0.215), parent=whole)
    rot = R(s * 28, "Y") @ R(25, "X")
    blob(f"prize_bear_arm_{side}_limb", 0.04, tuple(Vector((s * 0.095, 0.0, 0.215)) + (rot @ Vector((0, 0, -0.085)))), (1.0, 1.0, 2.5), plush, ap, rot)
    blob(f"prize_bear_arm_{side}_paw", 0.024, tuple(Vector((s * 0.095, 0.0, 0.215)) + (rot @ Vector((0, -0.022, -0.16)))), (1.0, 0.5, 1.0), pad, ap, rot)
    arms[side] = ap
    rot = R(s * 18, "Z") @ R(82, "X")
    blob(f"prize_bear_leg_{side}", 0.047, tuple(Vector((s * 0.075, -0.04, 0.05)) + (rot @ Vector((0, 0, 0.07)))), (1.0, 1.0, 2.2), plush, whole, rot)
    blob(f"prize_bear_foot_pad_{side}", 0.034, tuple(Vector((s * 0.075, -0.04, 0.05)) + (rot @ Vector((0, 0, 0.168)))), (1.0, 1.0, 0.3), pad, whole, rot)
# the bow: two loops, a knot and two tails
bow = [xf(L.sphere(1.0, u=12, v=8), comp.Matrix.Translation((s * 0.035, -0.088, 0.245)) @ R(s * 15, "Y") @ S(0.035, 0.012, 0.02)) for s in (-1, 1)] + [L.sphere(0.013, at=(0, -0.092, 0.245), u=8, v=6)]
bow += [xf(comp.box((0.018, 0.004, 0.06)), comp.Matrix.Translation((s * 0.018, -0.094, 0.21)) @ R(s * 18, "Y")) for s in (-1, 1)]
bow.append(L.torus(0.062, 0.008, seg_=20, sides=5, at=(0, -0.005, 0.248)))
comp.mesh(col, root, "prize_bear_bow", comp.merge(*bow), bow_m, parent=whole, smooth=True)
comp.mesh(col, root, "prize_bear_tag", comp.merge(xf(comp.box((0.045, 0.001, 0.06)), comp.Matrix.Translation((-0.115, -0.06, 0.37)) @ R(12, "Y")), comp.tube([(-0.075, 0.01, 0.42), (-0.1, -0.03, 0.41), (-0.112, -0.06, 0.398)], 0.0012, res=4, sides=2)), tag_m, parent=head)
comp.channel("wave", [(arms["r"], "rotation_euler", 0, 0, math.radians(120))])
comp.channel("nod", [(head, "rotation_euler", 0, 0, math.radians(-22))])
comp.channel("slump", [(whole, "rotation_euler", 1, 0, math.radians(75))])
comp.export(col, root, "ferris", "prize_bear", made="blender/components/ferris/prize_bear.py", source="own geometry (a generic plush bear); texture: https://polyhaven.com/a/curly_teddy_natural", license="ours; texture CC0", credit="Poly Haven (curly_teddy_natural)",
            rig={"wave": "its right arm rises 120 degrees forward and up from the shoulder", "nod": "its head tips 22 degrees forward", "slump": "the whole bear tips 75 degrees over onto its side"})
