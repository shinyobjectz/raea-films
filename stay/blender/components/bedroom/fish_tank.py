# bedroom/fish-tank: a 54-litre aquarium, 0.60 x 0.30 x 0.36 m with its hood, modelled by hand: five glass panes in
# black plastic rims, a black hood with a lift flap and a light strip (tank_light), the water a part of its own,
# blue aquarium gravel banked to the back, a grey castle with a doorway, three waving plants, a filter box and its
# intake tube, an airstone with its line, five goldfish each on its own pivot and a column of bubbles.
# Rig: "bubbles" lifts the bubble column 7.8 cm, three bubbles' spacing, so it loops; "swim" carries each fish along
# its own beat (10 to 16 cm) with a tail's turn; "flap" lifts the hood's feeding flap 60 degrees.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, noise
col, root = comp.fresh("fish_tank")
M = _lib.maker(col, root)
rnd = random.Random(54)
W, D, H = 0.6, 0.3, 0.3
glass = comp.mat("tank_glass", (0.8, 0.92, 0.9), rough=0.03, alpha=0.07)
water = comp.mat("tank_water", (0.3, 0.62, 0.7), rough=0.03, alpha=0.1)
black = comp.mat("tank_rim", (0.02, 0.02, 0.022), rough=0.4)
light = comp.mat("tank_light", (1.0, 1.0, 0.95), rough=0.3, emit=(0.85, 0.95, 1.0), strength=4.0)
gravel = comp.mat("tank_gravel", (0.03, 0.12, 0.5), rough=0.7)
stone = comp.mat("tank_castle", (0.28, 0.27, 0.25), rough=0.8)
leaf = comp.mat("tank_plant", (0.03, 0.3, 0.06), rough=0.5)
gold = comp.mat("tank_fish", (0.85, 0.2, 0.01), rough=0.35)
fin_m = comp.mat("tank_fin", (0.9, 0.35, 0.05), rough=0.4)
bub = comp.mat("tank_bubble", (0.95, 0.98, 1.0), rough=0.05, alpha=0.55)
RZ = 0.022
# rims and glass
rims = []
for z, h in ((0, RZ), (RZ + H, RZ)):
    rims += [comp.box((W, 0.012, h), at=(0, s * (D / 2 - 0.006), z + h / 2)) for s in (-1, 1)] + [comp.box((0.012, D, h), at=(s * (W / 2 - 0.006), 0, z + h / 2)) for s in (-1, 1)]
rims.append(comp.box((W - 0.01, D - 0.01, 0.006), at=(0, 0, 0.003)))
r = M("fish_tank_rims", comp.merge(*rims), black)
comp.bevel(r, 0.002, 2)
panes = [comp.box((W - 0.006, 0.005, H + 0.02), at=(0, s * (D / 2 - 0.006), RZ + H / 2)) for s in (-1, 1)] + [comp.box((0.005, D - 0.012, H + 0.02), at=(s * (W / 2 - 0.006), 0, RZ + H / 2)) for s in (-1, 1)]
M("fish_tank_glass", comp.merge(*panes), glass)
WT = RZ + H - 0.025    # the water's surface
M("fish_tank_water", comp.box((W - 0.022, D - 0.022, WT - 0.012), at=(0, 0, (WT + 0.012) / 2)), water)
# the hood
hood = comp.merge(comp.box((W + 0.004, D + 0.004, 0.012), at=(0, 0, RZ + H + RZ + 0.03)), comp.box((W + 0.004, 0.012, 0.034), at=(0, D / 2 - 0.004, RZ + H + RZ + 0.012)), comp.box((W + 0.004, 0.012, 0.034), at=(0, -D / 2 + 0.004, RZ + H + RZ + 0.012)),
                  comp.box((0.012, D, 0.034), at=(W / 2 - 0.004, 0, RZ + H + RZ + 0.012)), comp.box((0.012, D, 0.034), at=(-W / 2 + 0.004, 0, RZ + H + RZ + 0.012)),
                  comp.box((W - 0.1, 0.09, 0.03), at=(0, 0.06, RZ + H + RZ + 0.045)))
h = M("fish_tank_hood", hood, black)
comp.bevel(h, 0.004, 2)
M("fish_tank_light", comp.box((W - 0.12, 0.03, 0.006), at=(0, 0.04, RZ + H + RZ + 0.018)), light)
fp = comp.pivot(col, root, "fish_tank_flap", (0.17, -0.02, RZ + H + RZ + 0.037))
fl = M("fish_tank_flap_lid", comp.merge(comp.box((0.16, 0.1, 0.004), at=(0.17, -0.07, RZ + H + RZ + 0.038)), comp.box((0.04, 0.012, 0.006), at=(0.17, -0.11, RZ + H + RZ + 0.042))), comp.mat("tank_flap", (0.06, 0.06, 0.065), rough=0.35), parent=fp)
# gravel: a bumpy bed banked to the back
g = bmesh.new()
bmesh.ops.create_grid(g, x_segments=60, y_segments=30, size=0.5)
xf(g, S(W - 0.024, D - 0.024, 1))
for v in g.verts:
    v.co.z = 0.012 + 0.03 + 0.02 * (v.co.y / (D / 2)) + 0.006 * noise.noise(Vector((v.co.x * 14, v.co.y * 14, 0))) + 0.004 * noise.noise(Vector((v.co.x * 90, v.co.y * 90, 3)))
M("fish_tank_gravel", g, gravel, smooth=False)
M("fish_tank_gravel_edge", comp.merge(*[comp.box((W - 0.024, 0.002, 0.035), at=(0, -D / 2 + 0.0125, 0.03)), comp.box((W - 0.024, 0.002, 0.07), at=(0, D / 2 - 0.0125, 0.047)), comp.box((0.002, D - 0.024, 0.06), at=(-W / 2 + 0.0125, 0, 0.042)), comp.box((0.002, D - 0.024, 0.06), at=(W / 2 - 0.0125, 0, 0.042))]), gravel)
# the castle
cas = [comp.cyl(0.03, 0.11, at=(-0.17, 0.05, 0.05), seg=14), comp.cyl(0.022, 0.15, at=(-0.115, 0.07, 0.05), seg=12), comp.box((0.09, 0.04, 0.07), at=(-0.14, 0.05, 0.085))]
for cx, cy, cr, cz in ((-0.17, 0.05, 0.03, 0.16), (-0.115, 0.07, 0.022, 0.2)):
    cas += [comp.box((0.012, 0.012, 0.014), at=(cx + cr * 0.8 * math.cos(a), cy + cr * 0.8 * math.sin(a), cz + 0.007)) for a in [i * math.pi / 3 for i in range(6)]]
c = M("fish_tank_castle", comp.merge(*cas), stone)
M("fish_tank_castle_door", comp.merge(comp.box((0.022, 0.004, 0.035), at=(-0.17, 0.019, 0.07)), comp.box((0.01, 0.004, 0.016), at=(-0.115, 0.047, 0.15))), black)
# plants: blades that wave up from the gravel
blades = []
for px_, py_, n, hh in ((0.2, 0.08, 7, 0.2), (0.05, 0.09, 6, 0.16), (-0.25, -0.02, 5, 0.12), (0.26, -0.04, 4, 0.1)):
    for k in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        hgt = hh * rnd.uniform(0.7, 1.1)
        b = bmesh.new()
        prev = None
        for i in range(9):
            t = i / 8
            wv = 0.012 * (1 - t) * (0.3 + t) * 2.2 + 0.0015
            off = 0.03 * t * t + 0.008 * math.sin(t * 7 + k)
            p0 = Vector((off, -wv, hgt * t)); p1 = Vector((off, wv, hgt * t))
            cur = (b.verts.new(p0), b.verts.new(p1))
            if prev:
                b.faces.new((prev[0], prev[1], cur[1], cur[0]))
            prev = cur
        xf(b, T(px_ + rnd.uniform(-0.015, 0.015), py_ + rnd.uniform(-0.015, 0.015), 0.045) @ R(math.degrees(a), "Z"))
        blades.append(b)
pl = M("fish_tank_plants", comp.merge(*blades), leaf, smooth=True)
comp.solidify(pl, 0.0012)
# the filter and the airline
M("fish_tank_filter", comp.merge(comp.box((0.07, 0.035, 0.13), at=(0.24, D / 2 - 0.035, WT - 0.05)), comp.cyl(0.006, 0.16, at=(0.24, D / 2 - 0.06, 0.07), seg=10), comp.box((0.02, 0.02, 0.03), at=(0.24, D / 2 - 0.06, 0.07))), black)
AX, AY = -0.02, 0.06
M("fish_tank_airstone", comp.cyl(0.009, 0.03, at=(AX, AY, 0.055), seg=10), comp.mat("tank_airstone", (0.3, 0.45, 0.7), rough=0.9))
M("fish_tank_airline", comp.tube([(AX, AY, 0.08), (AX - 0.01, D / 2 - 0.02, 0.1), (AX - 0.01, D / 2 - 0.016, RZ + H + 0.02), (AX - 0.01, D / 2 + 0.01, RZ + H + 0.035), (AX, D / 2 + 0.02, 0.2)], 0.002), comp.mat("tank_airline", (0.85, 0.9, 0.88), rough=0.3, alpha=0.6), smooth=True)
# the bubbles: a column from the airstone to the surface, 2.6 cm apart, wandering a little
SP = 0.026
bp = comp.pivot(col, root, "fish_tank_bubbles", (AX, AY, 0.09))
bubs = []
nb = int((WT - 0.02 - 0.09 - 3 * SP) / SP)
for i in range(nb):
    for k in range(2):
        s = bmesh.new()
        bmesh.ops.create_uvsphere(s, u_segments=8, v_segments=6, radius=rnd.uniform(0.0025, 0.0045) * (1 + i / nb * 0.5))
        xf(s, T(AX + 0.008 * math.sin(i * 1.9 + k * 2.5), AY + 0.006 * math.cos(i * 2.3 + k), 0.09 + i * SP + k * SP * 0.45))
        bubs.append(s)
M("fish_tank_bubbles_mesh", comp.merge(*bubs), bub, parent=bp, smooth=True)
# the fish
fish, tails = [], []
SPOTS = [(-0.14, -0.05, 0.2, 0.075, 1, 0.14), (0.12, 0.0, 0.14, 0.06, -1, 0.16), (0.0, -0.08, 0.26, 0.055, 1, 0.1), (-0.12, 0.02, 0.27, 0.045, -1, 0.1), (0.1, -0.06, 0.1, 0.065, 1, 0.1)]
for i, (x, y, z, L, way, beat) in enumerate(SPOTS):
    p = comp.pivot(col, root, f"fish_tank_fish_{i + 1}", (x, y, z))
    b = bmesh.new()
    bmesh.ops.create_uvsphere(b, u_segments=14, v_segments=8, radius=1)
    xf(b, S(L / 2, L * 0.16, L * 0.26))
    for v in b.verts:
        if v.co.x < 0:
            v.co.z *= 1 + v.co.x / (L / 2) * 0.55; v.co.y *= 1 + v.co.x / (L / 2) * 0.6
    xf(b, T(x, y, z) @ S(way, 1, 1))
    M(f"fish_tank_fish_{i + 1}_body", b, gold if i != 2 else comp.mat("tank_fish_white", (0.92, 0.9, 0.85), rough=0.35), parent=p, smooth=True)
    tp = comp.pivot(col, root, f"fish_tank_fish_{i + 1}_tail", (x - way * L * 0.45, y, z), parent=p)
    tl = bmesh.new()
    vs = [tl.verts.new(c) for c in ((0, 0, 0.004), (-way * L * 0.4, 0, L * 0.3), (-way * L * 0.28, 0, 0), (-way * L * 0.4, 0, -L * 0.3), (0, 0, -0.004))]
    tl.faces.new(vs)
    xf(tl, T(x - way * L * 0.45, y, z))
    to = M(f"fish_tank_fish_{i + 1}_fin", tl, fin_m, parent=tp)
    tl2 = bmesh.new()
    d2 = [tl2.verts.new(c) for c in ((L * 0.15, 0, L * 0.2), (-L * 0.05, 0, L * 0.4), (-L * 0.2, 0, L * 0.18))]
    tl2.faces.new(d2)
    xf(tl2, T(x, y, z) @ S(way, 1, 1))
    M(f"fish_tank_fish_{i + 1}_dorsal", tl2, fin_m, parent=p)
    M(f"fish_tank_fish_{i + 1}_eyes", comp.merge(*[comp.cyl(L * 0.045, 0.0008, at=(x + way * L * 0.3, y + s * L * 0.125, z + L * 0.05), seg=8, axis="Y") for s in (-1, 1)]), black, parent=p)
    fish.append((p, way, beat)); tails.append(tp)
comp.channel("bubbles", [(bp, "location", 2, bp.location.z, bp.location.z + 3 * SP)])
comp.channel("swim", [(p, "location", 0, p.location.x, p.location.x + way * beat) for p, way, beat in fish])
comp.channel("swim", [(t, "rotation_euler", 2, math.radians(-22), math.radians(22)) for t in tails])
comp.channel("flap", [(fp, "rotation_euler", 0, 0, math.radians(60))])
comp.export(col, root, _lib.PLACE, "fish_tank", made="blender/components/bedroom/fish_tank.py", source="own geometry (a generic hooded aquarium)", license="ours", credit="",
            rig={"bubbles": "the bubble column rises 7.8 cm (three bubbles' spacing): loops", "swim": "each of the five fish goes 10 to 16 cm along its own beat, its tail swinging 44 degrees",
                 "flap": "the hood's feeding flap lifts 60 degrees", "light": "in the scene: tank_light is the hood's strip light, the tank's glow in the night shot"})
