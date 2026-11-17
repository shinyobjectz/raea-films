# court/gym-bag: what somebody left on the ground by the bench, modelled by hand: a 60 cm barrel duffel (a soft sagging
# tube with piped end panels, a zip along its top with its pull, two webbing handles and a shoulder strap fallen
# across it), a 750 ml squeeze bottle standing by it and a towel thrown over one end. On the ground at the origin,
# the bag's length along x. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, torus, pipe, fillet, rbox, T, R, S, xf

col, root = comp.fresh("gym_bag")
M = _lib.maker(col, root)
cloth = _lib.ph_plain("gym_bag_cloth", "denim_fabric", (0.05, 0.1, 0.32))
web = comp.mat("gym_bag_webbing", (0.03, 0.03, 0.035), rough=0.8)
zip_m = comp.mat("gym_bag_zip", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
towel_m = _lib.ph_plain("gym_bag_towel", "terry_cloth", (0.8, 0.78, 0.7))
bottle_m = comp.mat("gym_bag_bottle", (0.85, 0.3, 0.05), rough=0.35)
cap_m = comp.mat("gym_bag_bottle_cap", (0.08, 0.08, 0.09), rough=0.4)
L, RAD = 0.6, 0.15
# the barrel: a lathe along x, sagged flat on the ground and a little crumpled
prof = [(0.0, -L / 2), (RAD * 0.8, -L / 2), (RAD * 0.97, -L / 2 + 0.02), (RAD, -L / 2 + 0.06)] + [(RAD * (1 + 0.02 * math.sin(i * 1.7)), -L / 2 + 0.06 + (L - 0.12) * i / 10) for i in range(1, 10)] + [(RAD, L / 2 - 0.06), (RAD * 0.97, L / 2 - 0.02), (RAD * 0.8, L / 2), (0.0, L / 2)]
bag = lathe(prof, seg=36, axis="X")
rnd = random.Random(4)
for v in bag.verts:
    v.co.z = v.co.z * (0.86 if v.co.z > 0 else 0.62) + RAD * 0.62
    v.co.y *= 1.12
    v.co.z += 0.006 * math.sin(v.co.x * 31 + v.co.y * 17)
b = M("gym_bag_body", bag, cloth)
comp.uv_box(b, 0.25)
ZT = RAD * 0.62 + RAD * 0.86
M("gym_bag_zip", comp.merge(comp.box((L - 0.1, 0.012, 0.004), at=(0, 0, ZT + 0.001)), comp.box((0.012, 0.006, 0.03), at=(L / 2 - 0.09, -0.012, ZT + 0.004))), zip_m, smooth=False)
M("gym_bag_piping", comp.merge(*[xf(torus(RAD * 0.93, 0.006, seg=36, sides=4, axis="X"), T(sx * (L / 2 - 0.035), 0, RAD * 0.62) @ S(1, 1.12, 0.76)) for sx in (-1, 1)]), web)
hs = []
for sy in (-1, 1):
    pts = [(-0.11, sy * 0.1, ZT - 0.05), (-0.1, sy * 0.07, ZT + 0.03), (-0.05, sy * 0.13, ZT + 0.02), (0.06, sy * 0.19, ZT - 0.07), (0.11, sy * 0.1, ZT - 0.05)]
    hs.append(xf(pipe(fillet(pts, 0.04, n=4), 0.008, sides=2), S(1, 1, 1)))
strap = fillet([(-L / 2 + 0.02, 0, RAD * 0.9), (-L / 2 - 0.1, 0.05, 0.01), (-0.2, 0.34, 0.008), (0.25, 0.3, 0.008), (L / 2 + 0.08, 0.08, 0.01), (L / 2 - 0.02, 0, RAD * 0.9)], 0.08, n=5)
hs.append(xf(pipe(strap, 0.009, sides=2), S(1, 1, 1)))
M("gym_bag_straps", comp.merge(*hs), web)
# the towel over one end: a draped sheet
tw = bmesh.new()
bmesh.ops.create_grid(tw, x_segments=18, y_segments=26, size=0.5)
for v in tw.verts:
    x, y = v.co.x * 0.36, v.co.y * 0.62
    top = ZT - 0.01 - (y / (RAD * 1.12)) ** 2 * 0.1 if abs(y) < 0.19 else None
    z = top if top is not None else max(0.006, ZT - 0.11 - (abs(y) - 0.19) * 1.3)
    v.co = (x - 0.12 + 0.01 * math.sin(y * 20), y + 0.004 * math.sin(x * 40), z + 0.004 * math.sin(x * 55 + y * 23))
t = M("gym_bag_towel", tw, towel_m)
comp.solidify(t, 0.006)
comp.uv_box(t, 0.2)
# the bottle
bp = [(0.0, 0.0), (0.032, 0.0), (0.036, 0.008), (0.036, 0.07), (0.031, 0.085), (0.031, 0.12), (0.036, 0.135), (0.036, 0.18), (0.024, 0.205), (0.02, 0.21)]
M("gym_bag_bottle", lathe(bp, seg=24, at=(0.18, -0.3, 0)), bottle_m)
M("gym_bag_bottle_cap", lathe([(0.022, 0.208), (0.024, 0.21), (0.024, 0.228), (0.012, 0.234), (0.01, 0.25), (0.006, 0.252), (0.0, 0.252)], seg=20, at=(0.18, -0.3, 0)), cap_m)
comp.export(col, root, "court", "gym_bag", made="blender/components/court/gym_bag.py", source="own geometry; Poly Haven textures denim_fabric and terry_cloth for the weaves", license="ours (texture CC0)", credit="Poly Haven (texture)")
