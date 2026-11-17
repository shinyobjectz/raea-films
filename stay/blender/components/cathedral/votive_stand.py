# cathedral/votive-stand: a wrought-iron votive candle stand, 0.95 m wide and 1.15 m high, modelled by hand: four legs
# with scrolled feet and stretchers, three stepped tiers each carrying nine votive lights (a ruby glass cup, the wax in
# it, a wick and a flame), a drip tray of sand under the tiers, a rack of unlit tapers and a brass offering box with
# its slot on the front rail. The cups are votive_glass (they glow a little), the flames votive_flame.
# Rig: "flicker" leans every flame its own way (up to 18 degrees) and draws it out, about its wick.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("votive_stand")
iron, brass, wax = L.iron_mat(), L.brass_mat(), L.wax_mat()
glass = comp.mat("votive_glass", (0.6, 0.03, 0.04), rough=0.08, alpha=0.72, emit=(1.0, 0.08, 0.04), strength=10.0)
flame_m = L.flame_mat("votive_flame", 900.0)
sand = comp.mat("votive_sand", (0.5, 0.44, 0.34), rough=0.95)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D = 0.95, 0.42
legs = []
for sx in (-1, 1):
    for sy, h in ((-1, 0.78), (1, 1.1)):
        x, y = sx * (W / 2 - 0.02), sy * (D / 2 - 0.02)
        legs.append(comp.box((0.022, 0.022, h), at=(x, y, h / 2)))
        legs.append(xf(xf(L.torus(0.035, 0.008, 16, 6, arc=math.pi * 1.5), R(90, "Z")), T(x, y + sy * 0.035, 0.04)))
    legs.append(comp.box((0.016, D - 0.04, 0.016), at=(sx * (W / 2 - 0.02), 0, 0.3)))
    legs.append(xf(xf(comp.box((0.012, 0.52, 0.012)), R(38, "X")), T(sx * (W / 2 - 0.02), 0, 0.94)))
legs += [comp.box((W - 0.04, 0.016, 0.016), at=(0, y, 0.3)) for y in (-D / 2 + 0.02, D / 2 - 0.02)]
for i in range(6):   # scrolls between the front legs
    legs.append(xf(xf(L.torus(0.05, 0.006, 20, 6), S(1, 1, 1.5)), T(-W / 2 + 0.11 + i * 0.146, -D / 2 + 0.02, 0.4)))
lg = M("votive_stand_frame", comp.merge(*legs), iron)
tray = M("votive_stand_tray", comp.merge(comp.box((W, D, 0.004), at=(0, 0, 0.7)), comp.box((W, 0.004, 0.03), at=(0, -D / 2, 0.715)), comp.box((W, 0.004, 0.03), at=(0, D / 2, 0.715)), comp.box((0.004, D, 0.03), at=(-W / 2, 0, 0.715)), comp.box((0.004, D, 0.03), at=(W / 2, 0, 0.715))), iron)
M("votive_stand_sand", comp.box((W - 0.01, D - 0.01, 0.012), at=(0, 0, 0.708)), sand)
random.seed(11)
flames = []
cups, waxes, wicks = [], [], []
for t in range(3):
    y, z = -0.12 + t * 0.12, 0.78 + t * 0.11
    M(f"votive_stand_tier_{t + 1}", comp.merge(comp.box((W - 0.03, 0.085, 0.006), at=(0, y, z)), comp.box((W - 0.03, 0.006, 0.02), at=(0, y - 0.042, z + 0.008)), comp.box((W - 0.03, 0.006, 0.02), at=(0, y + 0.042, z + 0.008))), iron)
    for i in range(9):
        x = -W / 2 + 0.075 + i * (W - 0.15) / 8
        cups.append(xf(L.lathe([(0.022, 0.0), (0.03, 0.004), (0.033, 0.06), (0.031, 0.06), (0.028, 0.006), (0.0, 0.006)], seg=16, cap=False), T(x, y, z + 0.003)))
        lvl = random.uniform(0.02, 0.045)
        waxes.append(comp.cyl(0.027, lvl, at=(x, y, z + 0.009), seg=14))
        wicks.append(comp.cyl(0.0012, 0.01, at=(x, y, z + 0.009 + lvl), seg=5))
        tip = (x, y, z + 0.014 + lvl)
        fp = comp.pivot(col, root, f"votive_stand_flame_{t + 1}_{i + 1}", tip)
        M(f"votive_stand_flame_{t + 1}_{i + 1}_mesh", L.flame(random.uniform(0.026, 0.036), at=tip), flame_m, parent=fp, smooth=True)
        flames.append((fp, random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(1.15, 1.5)))
M("votive_stand_cups", comp.merge(*cups), glass, smooth=True)
M("votive_stand_wax", comp.merge(*waxes), wax, smooth=True)
M("votive_stand_wicks", comp.merge(*wicks), comp.mat("cathedral_wick", (0.02, 0.02, 0.02), rough=0.9))
# tapers in a rack at the right, the offering box on the front rail
tp = [comp.box((0.12, 0.05, 0.004), at=(W / 2 + 0.07, 0, 0.72)), comp.box((0.004, 0.05, 0.05), at=(W / 2 + 0.13, 0, 0.745)), comp.box((0.02, 0.02, 0.02), at=(W / 2 + 0.01, 0, 0.71))]
M("votive_stand_taper_rack", comp.merge(*tp), iron)
M("votive_stand_tapers", comp.merge(*[xf(xf(comp.cyl(0.004, 0.2, seg=8, axis="Y"), R(random.uniform(-8, 8), "Z")), T(W / 2 + 0.03 + k * 0.012, -0.1, 0.727 + (k % 2) * 0.008)) for k in range(8)]), wax, smooth=True)
box = M("votive_stand_offering_box", comp.box((0.2, 0.11, 0.13), at=(0, -D / 2 - 0.06, 0.6)), brass)
comp.bevel(box, 0.006, 2)
M("votive_stand_offering_slot", comp.merge(comp.box((0.07, 0.008, 0.002), at=(0, -D / 2 - 0.06, 0.666)), comp.box((0.03, 0.002, 0.04), at=(0, -D / 2 - 0.116, 0.6))), comp.mat("cathedral_shadow", (0.02, 0.02, 0.022), rough=0.95))
keys = []
for fp, ax, ay, st in flames:
    keys += [(fp, "rotation_euler", 0, 0, math.radians(18 * ax)), (fp, "rotation_euler", 1, 0, math.radians(18 * ay)), (fp, "scale", 2, 1.0, st)]
L.channel("flicker", keys)
comp.export(col, root, "cathedral", "votive_stand", made="blender/components/cathedral/votive_stand.py", source="own geometry (a wrought-iron votive stand)", license="ours", credit="",
            rig={"flicker": "each of the 27 flames (votive_stand_flame_T_N) leans its own way, up to 18 degrees, and stretches up to half again, about its wick",
                 "glow": "in the scene: the materials votive_flame and votive_glass, and one warm light over the tiers"})
