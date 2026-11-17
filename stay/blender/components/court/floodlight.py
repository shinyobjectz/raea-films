# court/floodlight: the court's one floodlight, modelled by hand: an 8 m tapered galvanised column on a bolted flange
# with a handhole door, a conduit and junction box up it, step pegs, a bracket arm, and one 60 x 45 cm floodlight on a
# trunnion yoke: a finned die-cast body, a visor, a glass front over its reflector and lamp. The glass is its own
# material (floodlight_lens). The origin is the column's foot; the lamp looks toward -y, tipped 50 degrees down.
# Rig: "tilt" raises the lamp 25 degrees on its trunnion; "pan" turns the arm and lamp 40 degrees about the column;
# "on" is the scene's: floodlight_lens's glow and a spot light at the lamp.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rod, rbox, T, R, S, xf

col, root = comp.fresh("floodlight")
M = _lib.maker(col, root)
galv = comp.mat("floodlight_column", (0.5, 0.52, 0.54), rough=0.35, metal=1.0)
body_m = comp.mat("floodlight_body", (0.1, 0.11, 0.12), rough=0.4, metal=0.7)
refl = comp.mat("floodlight_reflector", (0.9, 0.9, 0.88), rough=0.1, metal=1.0)
lens = comp.mat("floodlight_lens", (1.0, 0.97, 0.9), rough=0.2, emit=(1.0, 0.93, 0.8), strength=5000000.0)
pvc = comp.mat("floodlight_conduit", (0.2, 0.2, 0.21), rough=0.5)
H = 8.0
M("floodlight_column", lathe([(0.0, 0.0), (0.11, 0.0), (0.11, 0.02), (0.1, 0.03), (0.055, H), (0.0, H)], seg=20), galv)
M("floodlight_flange", comp.merge(rbox((0.4, 0.4, 0.02), at=(0, 0, 0.01), r=0.004, seg=1), *[comp.cyl(0.018, 0.03, at=(sx * 0.15, sy * 0.15, 0.02), seg=6) for sx in (-1, 1) for sy in (-1, 1)],
                                  *[comp.box((0.008, 0.1, 0.14), at=(0, sy * 0.14, 0.09)) for sy in (-1, 1)], *[comp.box((0.1, 0.008, 0.14), at=(sx * 0.14, 0, 0.09)) for sx in (-1, 1)]), galv, smooth=False)
M("floodlight_handhole", comp.merge(rbox((0.1, 0.012, 0.22), at=(0, -0.098, 0.75), r=0.004, seg=2), comp.cyl(0.006, 0.006, at=(0, -0.106, 0.82), seg=6, axis="Y"), comp.cyl(0.006, 0.006, at=(0, -0.106, 0.68), seg=6, axis="Y")), galv, smooth=False)
cond = [rod((0.1, 0.03, 0.0), (0.085, 0.03, 2.6), 0.011, seg=8), rbox((0.12, 0.07, 0.16), at=(0.1, 0.035, 2.68), r=0.006, seg=2)]
cond += [comp.box((0.03, 0.02, 0.012), at=(0.094, 0.03, z)) for z in (0.5, 1.3, 2.1)]
M("floodlight_conduit", comp.merge(*cond), pvc, smooth=False)
M("floodlight_pegs", comp.merge(*[rod((sx * 0.05, 0, z), (sx * 0.2, 0, z), 0.008, seg=6) for z, sx in ((3.0 + i * 0.4, 1 if i % 2 else -1) for i in range(11))]), galv)
pan = comp.pivot(col, root, "floodlight_pan", (0, 0, H))
AZ = H - 0.25
arm = [comp.cyl(0.065, 0.3, at=(0, 0, H - 0.3), seg=20), rod((0, 0, AZ), (0, -0.55, AZ + 0.1), 0.03, seg=10), rod((0, -0.05, AZ - 0.25), (0, -0.4, AZ + 0.05), 0.016, seg=8), comp.cyl(0.062, 0.02, at=(0, 0, H), seg=20, r2=0.02)]
M("floodlight_arm", comp.merge(*arm), galv, parent=pan)
LY, LZ = -0.55, AZ - 0.22
yoke = [comp.box((0.72, 0.04, 0.008), at=(0, LY, AZ + 0.07)), comp.box((0.008, 0.04, 0.3), at=(-0.356, LY, AZ - 0.08)), comp.box((0.008, 0.04, 0.3), at=(0.356, LY, AZ - 0.08)),
        comp.cyl(0.02, 0.02, at=(-0.375, LY, LZ), seg=8, axis="X"), comp.cyl(0.02, 0.02, at=(0.355, LY, LZ), seg=8, axis="X")]
M("floodlight_yoke", comp.merge(*yoke), galv, parent=pan, smooth=False)
tilt = comp.pivot(col, root, "floodlight_tilt", (0, LY, LZ), parent=pan)
W, HH, D = 0.6, 0.45, 0.2
body = comp.box((W, D, HH), at=(0, LY, LZ))
for v in body.verts:                                   # the housing narrows to its back
    if v.co.y > LY:
        v.co.x *= 0.72
        v.co.z = LZ + (v.co.z - LZ) * 0.66
bd = M("floodlight_body", body, body_m, parent=tilt, smooth=False)
comp.bevel(bd, 0.012, 2)
fins = [comp.box((0.006, D * 0.8, HH * 0.6), at=(-W * 0.3 + i * W * 0.6 / 9, LY + 0.07, LZ)) for i in range(10)]
fins += [comp.box((W + 0.03, 0.03, HH + 0.03), at=(0, LY - D / 2, LZ)), comp.box((W + 0.05, 0.16, 0.006), at=(0, LY - D / 2 - 0.08, LZ + HH / 2 + 0.018)), rbox((0.14, 0.09, 0.1), at=(0, LY + D / 2 + 0.03, LZ), r=0.01, seg=2)]
fins += [comp.cyl(0.009, 0.012, at=(sx * (W / 2 + 0.002), LY - D / 2 - 0.02, LZ + sz * (HH / 2 + 0.002)), seg=6, axis="Y") for sx in (-1, 1) for sz in (-1, 1)]
M("floodlight_fins", comp.merge(*fins), body_m, parent=tilt, smooth=False)
M("floodlight_reflector", comp.box((W - 0.04, 0.004, HH - 0.04), at=(0, LY - D / 2 + 0.03, LZ)), refl, parent=tilt, smooth=False)
M("floodlight_lens", comp.box((W - 0.03, 0.006, HH - 0.03), at=(0, LY - D / 2 - 0.013, LZ)), lens, parent=tilt, smooth=False)
tilt.rotation_euler[0] = math.radians(50)
_lib.channel("tilt", [(tilt, "rotation_euler", 0, math.radians(50), math.radians(25))])
_lib.channel("pan", [(pan, "rotation_euler", 2, 0, math.radians(40))])
comp.export(col, root, "court", "floodlight", made="blender/components/court/floodlight.py", source="own geometry (a generic column floodlight)", license="ours", credit="",
            rig={"tilt": "the lamp rises 25 degrees on its trunnion (from 50 degrees below level to 25)", "pan": "the arm and lamp turn 40 degrees about the column",
                 "on": "in the scene: the material floodlight_lens's glow and a spot light at the lamp (0, 7.53, 0.55 in raea's frame), a key per state"},
            notes="origin: the column's foot; the lamp is 7.53 m up, 0.55 m out toward the court (-y in Blender, +z in raea)")
