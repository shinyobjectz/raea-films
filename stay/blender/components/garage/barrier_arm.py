# garage/barrier-arm: the entry barrier, modelled by hand: a yellow steel cabinet 1.08 m high on a concrete plinth
# (a service door with a lock and louvres, a grey cap, an amber beacon in the material barrier_lamp), its boom on a hub
# on the front face: a 3.2 m aluminium arm banded red and white with a rubber tip, a round red no-entry disc hung
# under it, and a counterweight stub; and the rest post it lands in, 3.1 m along. The cabinet stands on the origin;
# the boom reaches along +x across the lane. Rig: "lift" raises the boom 88 degrees about its hub (still lifting as
# the car rolls in).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("barrier_arm")
M = L.maker(col, root)
yellow = comp.mat("barrier_cabinet", (0.9, 0.62, 0.03), rough=0.45)
grey = comp.mat("barrier_grey", (0.3, 0.31, 0.33), rough=0.5)
white = comp.mat("barrier_white", (0.88, 0.88, 0.86), rough=0.4)
red = comp.mat("barrier_red", (0.7, 0.04, 0.03), rough=0.4)
black = comp.mat("barrier_black", (0.02, 0.02, 0.02), rough=0.6)
steel = comp.mat("barrier_steel", (0.65, 0.65, 0.67), rough=0.3, metal=1.0)
lamp = comp.mat("barrier_lamp", (1.0, 0.55, 0.05), rough=0.25, emit=(1.0, 0.45, 0.02), strength=3.0)
conc = comp.ph_texture("barrier_plinth", "garage_floor", tile=1.886, res="1k", tint=(0.74, 0.86, 1.0))
p = M("barrier_arm_plinth", comp.box((0.56, 0.56, 0.08), at=(0, 0, 0.04)), conc)
comp.bevel(p, 0.012, 2)
comp.uv_box(p, 1.0)
cab = M("barrier_arm_cabinet", comp.box((0.36, 0.36, 1.0), at=(0, 0, 0.58)), yellow)
comp.bevel(cab, 0.012, 3)
cap = M("barrier_arm_cap", comp.box((0.4, 0.4, 0.05), at=(0, 0, 1.105)), grey)
comp.bevel(cap, 0.012, 3)
door = M("barrier_arm_door", comp.box((0.3, 0.006, 0.62), at=(0, 0.182, 0.45)), yellow)
comp.bevel(door, 0.002, 1)
M("barrier_arm_door_seam", L.sweep([(-0.152, 0.181, 0.14), (0.152, 0.181, 0.14), (0.152, 0.181, 0.762), (-0.152, 0.181, 0.762)], L.rrect(0.004, 0.004, 0.001, 1), closed=True, up=(0, 1, 0)), black)
M("barrier_arm_louvres", comp.merge(*[comp.box((0.2, 0.008, 0.012), at=(0, 0.186, 0.2 + i * 0.03)) for i in range(5)]), grey)
M("barrier_arm_lock", comp.cyl(0.012, 0.008, at=(0.11, 0.184, 0.5), seg=14, axis="Y"), steel)
M("barrier_arm_beacon_base", comp.cyl(0.05, 0.02, at=(0, 0, 1.13), seg=20), grey)
M("barrier_arm_beacon", L.lathe([(0.042, 0), (0.042, 0.04), (0.034, 0.065), (0.018, 0.08), (0, 0.084)], 20, at=(0, 0, 1.15)), lamp, smooth=True)
stripe = L.stripes(0.36, 0.14, 6, t=0.002)
M("barrier_arm_hazard_black", xf(stripe[1], T(0, -0.18, 0.16)), black)
stripe[0].free()
AX = (0.0, -0.2, 0.93)
M("barrier_arm_hub", comp.merge(comp.cyl(0.085, 0.04, at=(0, -0.22, 0.93), seg=28, axis="Y"), comp.cyl(0.03, 0.09, at=(0, -0.27, 0.93), seg=16, axis="Y")), grey, smooth=False)
arm = comp.pivot(col, root, "barrier_arm_boom", AX)
BY, BZ, BL = -0.245, 0.93, 3.2
M("barrier_arm_clamp", comp.box((0.3, 0.06, 0.14), at=(0.02, BY, BZ)), grey, parent=arm)
wh, rd = [], []
NB = 8
for i in range(NB):
    x0 = 0.17 + i * (BL - 0.17) / NB
    seg = comp.box(((BL - 0.17) / NB, 0.035, 0.09), at=(x0 + (BL - 0.17) / NB / 2, BY, BZ))
    (rd if i % 2 == 0 else wh).append(seg)
M("barrier_arm_boom_white", comp.merge(*wh), white, parent=arm)
M("barrier_arm_boom_red", comp.merge(*rd), red, parent=arm)
tip = M("barrier_arm_boom_tip", comp.box((0.05, 0.045, 0.1), at=(BL + 0.025, BY, BZ)), black, parent=arm)
comp.bevel(tip, 0.01, 2)
M("barrier_arm_counterweight", comp.box((0.34, 0.05, 0.12), at=(-0.3, BY, BZ)), grey, parent=arm)
M("barrier_arm_edge", comp.box((BL - 0.2, 0.03, 0.02), at=(0.17 + (BL - 0.2) / 2, BY, BZ - 0.055)), black, parent=arm)
dx = 1.7
M("barrier_arm_disc_hanger", comp.merge(*[comp.box((0.004, 0.02, 0.05), at=(dx + s * 0.08, BY, BZ - 0.08)) for s in (-1, 1)]), steel, parent=arm)
M("barrier_arm_disc", comp.cyl(0.17, 0.004, at=(dx, BY - 0.002, BZ - 0.27), seg=48, axis="Y"), red, parent=arm)
M("barrier_arm_disc_rim", L.sweep([(dx + 0.165 * math.cos(a), BY - 0.004, BZ - 0.27 + 0.165 * math.sin(a)) for a in [2 * math.pi * k / 48 for k in range(48)]], L.rrect(0.012, 0.002, 0.0005, 1), closed=True, up=(0, 1, 0)), white, parent=arm)
M("barrier_arm_disc_bar", comp.merge(comp.box((0.22, 0.002, 0.05), at=(dx, BY - 0.0045, BZ - 0.27)), comp.box((0.22, 0.002, 0.05), at=(dx, BY + 0.0035, BZ - 0.27))), white, parent=arm)
# the rest post
rx = BL - 0.1
M("barrier_arm_rest_post", comp.merge(comp.box((0.06, 0.06, 0.86), at=(rx, BY, 0.43)), comp.box((0.16, 0.16, 0.01), at=(rx, BY, 0.005)), comp.box((0.08, 0.008, 0.14), at=(rx, BY - 0.03, 0.92)), comp.box((0.08, 0.008, 0.14), at=(rx, BY + 0.03, 0.92)), comp.box((0.08, 0.068, 0.008), at=(rx, BY, 0.864))), grey)
M("barrier_arm_rest_pad", comp.box((0.07, 0.05, 0.012), at=(rx, BY, 0.874)), black)
comp.channel("lift", [(arm, "rotation_euler", 1, 0, math.radians(-88))])
L.look(col, "barrier-arm", eye=(3.2, -5.5, 1.9), target=(1.4, 0, 1.2), lens=35, frame=None)
comp.export(col, root, "garage", "barrier_arm", made="blender/components/garage/barrier_arm.py", source="own geometry (a generic car park barrier)", license="ours", credit="",
            rig={"lift": "the boom (barrier_arm_boom), its disc and counterweight rise 88 degrees about the hub on the cabinet's front",
                 "lamp": "in the scene: the material barrier_lamp's glow (the amber beacon)"})
