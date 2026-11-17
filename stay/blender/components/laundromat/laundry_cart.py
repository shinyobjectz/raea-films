# laundromat/laundry-cart: the laundromat's wire cart with its double pole rack, 1.78 m to the rail, modelled by hand
# in chromed steel: a tapered wire basket (a rim, two belts, a wire every 4.5 cm and a wire floor) on a tube
# undercarriage with four swivel casters, two poles up from its ends to a hanging rail, a wire hanger on the rail with
# a shirt on it, and a towel left over the rim. Its long side faces -y; it rolls along x.
# Rig: where it stands is the Model's own position (the cursor's push); "roll" turns the four wheels one whole turn on
# their axles; "swivel" turns the four casters a quarter on their stems (to roll toward the camera); "sway" swings
# the hanger and its shirt 14 degrees along the rail.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, path, rrect, rbox, wad, outline, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("laundry_cart")
M = _lib.maker(col, root)
chrome = comp.mat("cart_chrome", (0.82, 0.83, 0.85), rough=0.18, metal=0.85)
rubber = comp.mat("cart_wheel", (0.35, 0.36, 0.38), rough=0.6)
fork_m = comp.mat("cart_fork", (0.6, 0.61, 0.63), rough=0.3, metal=0.7)
bump = comp.mat("cart_bumper", (0.12, 0.25, 0.6), rough=0.5)
shirt_m = comp.ph_texture("cart_shirt", "gingham_check", tile=0.28, res="1k")
towel_m = comp.ph_texture("cart_towel", "waffle_pique_cotton", tile=0.28, res="1k")
LT, WT, LB, WB = 0.68, 0.5, 0.56, 0.4       # the basket's top and bottom
ZT, ZB = 0.86, 0.46
top = rrect(LT, WT, 0.06, ZT, n=5)
bot = rrect(LB, WB, 0.05, ZB, n=5)
mix = lambda k: [tuple(Vector(b).lerp(Vector(t), k)) for b, t in zip(bot, top)]
wires = [path(top, 0.006, seg=8, closed=True), path(bot, 0.004, seg=6, closed=True), path(mix(0.36), 0.0035, seg=6, closed=True), path(mix(0.7), 0.0035, seg=6, closed=True)]
def along(loop, step):
    """points every `step` along a closed loop"""
    pts = [Vector(p) for p in loop] + [Vector(loop[0])]
    total = sum((b - a).length for a, b in zip(pts[:-1], pts[1:]))
    n = round(total / step)
    out, want, run = [], 0.0, 0.0
    for a, b in zip(pts[:-1], pts[1:]):
        seg = (b - a).length
        while want <= run + seg and len(out) < n:
            out.append(a.lerp(b, (want - run) / seg))
            want += total / n
        run += seg
    return out
tp, bp = along(top, 0.045), along(bot, 0.045 * (LB + WB) / (LT + WT))
for a, b in zip(bp, tp):
    wires.append(rod(a, b, 0.0025, seg=5))
x = -LB / 2 + 0.03
while x < LB / 2 - 0.01:
    wires.append(rod((x, -WB / 2, ZB), (x, WB / 2, ZB), 0.0025, seg=5))
    x += 0.045
y = -WB / 2 + 0.04
while y < WB / 2 - 0.01:
    wires.append(rod((-LB / 2, y, ZB), (LB / 2, y, ZB), 0.0025, seg=5))
    y += 0.08
M("laundry_cart_basket", comp.merge(*wires), chrome, smooth=True)
M("laundry_cart_bumpers", comp.merge(*[_lib.sphere(0.022, at=(sx * (LT / 2 - 0.01), sy * (WT / 2 - 0.01), ZT), scale=(1, 1, 0.8)) for sx in (-1, 1) for sy in (-1, 1)]), bump, smooth=True)
# the undercarriage: a U of tube each end, down to a caster at each corner, with two long rails low
CXc, CYc, ZC = 0.3, 0.2, 0.135
frame = []
for sx in (-1, 1):
    frame.append(path([(sx * CXc, -CYc, ZC), (sx * (LB / 2 - 0.02), -WB / 2 + 0.03, ZB - 0.012), (sx * (LB / 2 - 0.02), WB / 2 - 0.03, ZB - 0.012), (sx * CXc, CYc, ZC)], 0.011, seg=10))
for sy in (-1, 1):
    frame.append(rod((-CXc, sy * CYc, ZC + 0.07), (CXc, sy * CYc, ZC + 0.07), 0.009, seg=8))
# the pole rack
PZ = 1.78
for sx in (-1, 1):
    frame.append(path([(sx * (LB / 2 - 0.02), 0, ZB - 0.012), (sx * (LT / 2 + 0.012), 0, ZT), (sx * (LT / 2 + 0.012), 0, PZ - 0.03), (sx * (LT / 2 - 0.02), 0, PZ)], 0.011, seg=10))
frame.append(rod((-LT / 2 + 0.02, 0, PZ), (LT / 2 - 0.02, 0, PZ), 0.011, seg=10))
M("laundry_cart_frame", comp.merge(*frame), chrome, smooth=True)
# the casters
forks, wheels = [], []
i = 0
for sx in (-1, 1):
    for sy in (-1, 1):
        i += 1
        cx, cy = sx * CXc, sy * CYc
        fp = comp.pivot(col, root, f"laundry_cart_caster_{i}", (cx, cy, ZC))
        fk = comp.merge(turn([(0.0, 0.0), (0.018, 0.0), (0.02, -0.012), (0.0, -0.012)], seg=16, at=(cx, cy, ZC)), rbox((0.05, 0.034, 0.008), at=(cx - 0.012, cy, ZC - 0.016), r=0.002),
                        *[rbox((0.04, 0.004, 0.075), at=(cx - 0.022, cy + s * 0.017, ZC - 0.055), r=0.0015) for s in (-1, 1)])
        M(f"laundry_cart_caster_{i}_fork", fk, fork_m, parent=fp)
        wp = comp.pivot(col, root, f"laundry_cart_wheel_{i}", (cx - 0.028, cy, 0.05), parent=fp)
        w = turn([(0.012, -0.012), (0.046, -0.012), (0.05, -0.006), (0.05, 0.006), (0.046, 0.012), (0.012, 0.012)], seg=28, axis="F", at=(cx - 0.028, cy, 0.05))
        M(f"laundry_cart_wheel_{i}_tyre", w, rubber, parent=wp, smooth=True)
        M(f"laundry_cart_wheel_{i}_hub", comp.merge(comp.cyl(0.014, 0.032, at=(cx - 0.028, cy + 0.016, 0.05), seg=12, axis="Y") if False else rod((cx - 0.028, cy - 0.016, 0.05), (cx - 0.028, cy + 0.016, 0.05), 0.013, seg=12),
                                                     *[rod((cx - 0.028, cy - 0.0125, 0.05), (cx - 0.028 + 0.04 * math.cos(a), cy - 0.0125, 0.05 + 0.04 * math.sin(a)), 0.004, seg=4) for a in (0.3, 2.4, 4.5)]), fork_m, parent=wp)
        forks.append(fp)
        wheels.append(wp)
# the hanger and its shirt, on the rail
hp = comp.pivot(col, root, "laundry_cart_hanger", (0.12, 0, PZ))
HX = 0.12
hook = path([(HX, 0, PZ - 0.1), (HX, 0, PZ - 0.035), (HX + 0.012, 0, PZ - 0.012), (HX + 0.012, 0, PZ + 0.012), (HX, 0, PZ + 0.02), (HX - 0.014, 0, PZ + 0.01)], 0.002, seg=5)
tri = path([(HX, 0, PZ - 0.1), (HX - 0.21, 0, PZ - 0.2), (HX + 0.21, 0, PZ - 0.2)], 0.002, seg=5, closed=True)
M("laundry_cart_hanger_wire", comp.merge(xf(hook, R(90, "Z") if False else T(0, 0, 0)), tri), chrome, parent=hp, smooth=True)
z0 = PZ - 0.105
sil = [(-0.05, 0.0), (-0.23, -0.075), (-0.33, -0.2), (-0.26, -0.26), (-0.2, -0.19), (-0.21, -0.72), (0.21, -0.72), (0.2, -0.19), (0.26, -0.26), (0.33, -0.2), (0.23, -0.075), (0.05, 0.0), (0.0, -0.05)]
sh = outline([(HX + x, z0 + z) for x, z in sil])
import bmesh
bmesh.ops.subdivide_edges(sh, edges=sh.edges[:], cuts=2, use_grid_fill=True)
for v in sh.verts:
    v.co.y += 0.012 * math.sin(v.co.x * 23) * (0.3 + (z0 - v.co.z))
so = M("laundry_cart_shirt", sh, shirt_m, parent=hp, smooth=True)
comp.solidify(so, 0.028, 0)
comp.uv_box(so, 1.0)
# a towel left over the rim
tw = _lib.loft([[(x, y0 + dy, z) for x in (-0.2 + 0.05 * k for k in range(9))][::1] + [(x, y0 + dy + 0.012, z) for x in (0.2 - 0.05 * k for k in range(9))] for y0, dy, z in
                ((-WT / 2 - 0.022, 0.0, ZT - 0.3), (-WT / 2 - 0.02, 0.0, ZT - 0.15), (-WT / 2 - 0.016, 0.0, ZT - 0.03), (-WT / 2 - 0.004, 0.0, ZT + 0.012), (-WT / 2 + 0.012, 0.0, ZT + 0.01), (-WT / 2 + 0.03, 0.0, ZT - 0.06), (-WT / 2 + 0.045, 0.0, ZT - 0.2))], cap_bottom=True, cap_top=True)
for v in tw.verts:
    v.co.y += 0.014 * math.sin(v.co.x * 27 + v.co.z * 7) * min(1.0, (ZT + 0.02 - v.co.z) * 6)
    v.co.z += 0.02 * math.sin(v.co.x * 9 + 1.0) * min(1.0, (ZT + 0.02 - v.co.z) * 4)
to = M("laundry_cart_towel", tw, towel_m, smooth=True)
comp.uv_box(to, 1.0)
_lib.channel("roll", [(w, "rotation_euler", 1, 0, 2 * math.pi) for w in wheels])
_lib.channel("swivel", [(f, "rotation_euler", 2, 0, math.pi / 2) for f in forks])
_lib.channel("sway", [(hp, "rotation_euler", 1, 0, math.radians(14))])
comp.export(col, root, _lib.PLACE, "laundry_cart", made="blender/components/laundromat/laundry_cart.py",
            source="own geometry (a generic wire laundry cart with a pole rack); cloth: https://polyhaven.com/a/gingham_check, https://polyhaven.com/a/waffle_pique_cotton", license="ours; textures CC0", credit="Poly Haven (gingham_check, waffle_pique_cotton)",
            rig={"position": "the Model's own position and turn in the scene (the cursor's push)",
                 "roll": "the four wheels one whole turn on their axles (it rolls along its length)",
                 "swivel": "the four casters a quarter turn on their stems",
                 "sway": "the hanger and its shirt swing 14 degrees along the rail, about the rail"})
