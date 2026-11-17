# ferris/stall: a hoopla stall, 3.2 m wide, 2.2 m deep and 3 m to its ridge, modelled by hand: four timber posts
# and a ridge (Poly Haven's weathered_planks), a counter on a red and cream boarded front, canvas side and back
# walls, a pitched canvas roof in red and cream stripes with a scalloped valance, a sign board (PRIZES) with bulbs
# round it, three stepped shelves of prizes at the back (tin-can pyramids, striped balls, wooden blocks to ring),
# hoops on the counter, and the night flap: a canvas front hung from the eave. Its front faces -y. The lit bulbs
# are a part of their own (stall_lights, material stall_bulb_glow), nothing at rest.
# Rig: at rest the flap hangs shut over the front (the fair is closed); "flap" swings it 105 degrees up into an
# awning; "bulbs" brings the sign's bulbs on round it; "valance" lifts the valance 30 degrees in a gust.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(11)
col, root = comp.fresh("stall")
wood = comp.ph_texture("stall_timber", "weathered_planks", tile=1.0, res="1k")
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.5)
canvas_r = comp.mat("stall_canvas_red", (0.5, 0.06, 0.05), rough=0.75)
canvas_c = comp.mat("stall_canvas_cream", (0.84, 0.79, 0.62), rough=0.75)
gold = comp.mat("fair_gold", (0.85, 0.6, 0.15), rough=0.35, metal=0.6)
tin = comp.mat("stall_tin", (0.7, 0.71, 0.72), rough=0.3, metal=1.0)
blue = comp.mat("stall_blue", (0.06, 0.2, 0.5), rough=0.4)
dark = comp.mat("booth_dark", (0.02, 0.02, 0.022), rough=0.8)
bulb = comp.mat("booth_bulb_glass", (0.75, 0.72, 0.62), rough=0.15)
glow = comp.mat("stall_bulb_glow", (1.0, 0.85, 0.55), rough=0.3, emit=(1.0, 0.72, 0.35), strength=40000.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D, EAVE, RIDGE, CT = 3.2, 2.2, 2.35, 3.0, 0.95
fr = [comp.box((0.09, 0.09, EAVE), at=(sx * (W / 2 - 0.045), sy * (D / 2 - 0.045), EAVE / 2)) for sx in (-1, 1) for sy in (-1, 1)]
fr += [comp.box((W, 0.07, 0.11), at=(0, sy * (D / 2 - 0.045), EAVE - 0.055)) for sy in (-1, 1)] + [comp.box((W + 0.3, 0.06, 0.09), at=(0, 0, RIDGE - 0.05))]
fr += [comp.box((0.07, 0.07, RIDGE - 0.05), at=(sx * (W / 2 - 0.045), 0, (RIDGE - 0.05) / 2)) for sx in (-1, 1)]
fr += [comp.box((W - 0.1, 0.4, 0.045), at=(0, -D / 2 + 0.16, CT))]
f = M("stall_frame", comp.merge(*fr), wood)
comp.bevel(f, 0.004, 2)
comp.uv_box(f, 1.0)
boards = {0: [], 1: []}
for i in range(16):
    boards[i % 2].append(comp.box((W / 16 - 0.004, 0.022, CT - 0.06), at=(-W / 2 + (i + 0.5) * W / 16, -D / 2 + 0.012, (CT - 0.06) / 2 + 0.03)))
M("stall_front_red", comp.merge(*boards[0]), red)
M("stall_front_cream", comp.merge(*boards[1]), cream)
# canvas: the roof in stripes across x, each strip two slopes; the side and back walls
strips = {0: bmesh.new(), 1: bmesh.new()}
NSTR = 10
SW = (W + 0.3) / NSTR
for i in range(NSTR):
    bm = strips[i % 2]
    x0, x1 = -W / 2 - 0.15 + i * SW, -W / 2 - 0.15 + (i + 1) * SW
    for sy in (-1, 1):
        vs = [bm.verts.new(p) for p in ((x0, 0, RIDGE), (x1, 0, RIDGE), (x1, sy * (D / 2 + 0.25), EAVE - 0.02), (x0, sy * (D / 2 + 0.25), EAVE - 0.02))]
        bm.faces.new(vs if sy < 0 else vs[::-1])
for nm, bm, m in (("red", strips[0], canvas_r), ("cream", strips[1], canvas_c)):
    o = M(f"stall_roof_{nm}", bm, m)
    comp.solidify(o, 0.008)
walls = bmesh.new()
for pts in (((-W / 2, D / 2, 0.05), (W / 2, D / 2, 0.05), (W / 2, D / 2, EAVE), (-W / 2, D / 2, EAVE)),
            ((-W / 2, -D / 2 + 0.1, 0.05), (-W / 2, D / 2, 0.05), (-W / 2, D / 2, EAVE), (-W / 2, 0, RIDGE - 0.02), (-W / 2, -D / 2 + 0.1, EAVE)),
            ((W / 2, D / 2, 0.05), (W / 2, -D / 2 + 0.1, 0.05), (W / 2, -D / 2 + 0.1, EAVE), (W / 2, 0, RIDGE - 0.02), (W / 2, D / 2, EAVE))):
    walls.faces.new([walls.verts.new(p) for p in pts])
wo = M("stall_walls", walls, canvas_c)
comp.solidify(wo, 0.006)
# the valance: scallops along the front eave on their own hinge
vp = comp.pivot(col, root, "stall_valance", (0, -D / 2 - 0.25, EAVE - 0.02))
val = {0: bmesh.new(), 1: bmesh.new()}
for i in range(NSTR):
    bm = val[i % 2]
    x0, x1 = -W / 2 - 0.15 + i * SW, -W / 2 - 0.15 + (i + 1) * SW
    y = -D / 2 - 0.25
    pts = [(x0, y, EAVE - 0.02), (x1, y, EAVE - 0.02), (x1, y, EAVE - 0.2)] + [(x1 - (x1 - x0) * k / 6, y, EAVE - 0.2 - 0.1 * math.sin(math.pi * k / 6)) for k in range(1, 6)] + [(x0, y, EAVE - 0.2)]
    bm.faces.new([bm.verts.new(p) for p in pts])
for nm, bm, m in (("red", val[0], canvas_r), ("cream", val[1], canvas_c)):
    o = M(f"stall_valance_{nm}", bm, m, vp)
    comp.solidify(o, 0.006)
# the shelves and what stands on them
sh = []
for k in range(3):
    sh.append(comp.box((W - 0.3, 0.3, 0.03), at=(0, D / 2 - 0.2 - k * 0.28, 1.5 - k * 0.3)))
    sh += [comp.box((0.04, 0.3, 1.5 - k * 0.3), at=(sx * (W / 2 - 0.2), D / 2 - 0.2 - k * 0.28, (1.5 - k * 0.3) / 2)) for sx in (-1, 1)]
s = M("stall_shelves", comp.merge(*sh), wood)
comp.uv_box(s, 1.0)
cans, bands, balls_a, balls_b, blocks = [], [], [], [], []
def can(x, y, z):
    cans.append(comp.cyl(0.034, 0.1, at=(x, y, z), seg=14))
    bands.append(comp.cyl(0.0345, 0.06, at=(x, y, z + 0.02), seg=14))
for px in (-1.0, 0.9):
    y, z = D / 2 - 0.2, 1.515
    for row, n in enumerate((3, 2, 1)):
        for i in range(n):
            can(px + (i - (n - 1) / 2) * 0.072, y, z + row * 0.1)
for i in range(7):
    x = -1.2 + i * 0.4
    (balls_a if i % 2 else balls_b).append(L.sphere(0.06, at=(x, D / 2 - 0.48, 1.275), u=14, v=8))
for i in range(9):
    x = -1.25 + i * 0.31
    blocks.append(comp.box((0.11, 0.11, 0.09 + 0.02 * (i % 3)), at=(x, D / 2 - 0.76, 0.915 + 0.045 + 0.01 * (i % 3))))
    if i % 2 == 0:
        can(x, D / 2 - 0.76, 0.915 + 0.09 + 0.02 * (i % 3))
M("stall_cans", comp.merge(*cans), tin, None, True)
M("stall_can_labels", comp.merge(*bands), red, None, True)
M("stall_balls_red", comp.merge(*balls_a), red, None, True)
M("stall_balls_blue", comp.merge(*balls_b), blue, None, True)
b = M("stall_blocks", comp.merge(*blocks), wood)
comp.uv_box(b, 0.4)
hoops = []
for i in range(7):
    x, y = -0.9 + (i % 4) * 0.12 + random.uniform(-0.02, 0.02), -D / 2 + 0.16 + random.uniform(-0.05, 0.05)
    hoops.append(L.torus(0.085, 0.006, seg_=20, sides=5, at=(x if i < 4 else 0.7 + (i - 4) * 0.2, y, CT + 0.03 + (0.012 * i if i < 4 else 0))))
M("stall_hoops", comp.merge(*hoops), gold, None, True)
# the sign and its bulbs
sg = M("stall_sign_board", comp.merge(comp.box((1.9, 0.04, 0.46), at=(0, -D / 2 - 0.26, EAVE + 0.36)), *[comp.box((0.05, 0.05, 0.5), at=(sx * 0.8, -D / 2 - 0.22, EAVE + 0.15)) for sx in (-1, 1)]), red)
comp.bevel(sg, 0.006, 2)
M("stall_sign_letters", xf(comp.text("PRIZES", 0.26, depth=0.016), T(0, -D / 2 - 0.285, EAVE + 0.36)), gold)
lit, holders, glasses = [], [], []
lights = comp.pivot(col, root, "stall_lights", (0, -D / 2 - 0.28, EAVE + 0.36))
ring = [(-0.9 + i * 0.2, 0.19) for i in range(10)] + [(0.9, 0.19 - 0.19 * i) for i in range(1, 2)] + [(0.9 - i * 0.2, -0.19) for i in range(10)] + [(-0.9, 0.0)]
for i, (x, dz) in enumerate(ring):
    p = (x, -D / 2 - 0.3, EAVE + 0.36 + dz)
    holders.append(comp.cyl(0.016, 0.025, at=(p[0], p[1] + 0.005, p[2]), seg=6, axis="Y"))
    glasses.append(L.ico(0.026, p, 1))
    lp = comp.pivot(col, root, f"stall_light_{i + 1:02d}", p, parent=lights)
    M(f"stall_light_{i + 1:02d}_glow", L.ico(0.032, p, 1), glow, lp, True)
    lit.append(lp)
M("stall_bulb_holders", comp.merge(*holders), dark)
M("stall_bulbs", comp.merge(*glasses), bulb, None, True)
# the night flap, hung from the front eave beam; shut at rest
fp = comp.pivot(col, root, "stall_flap", (0, -D / 2 - 0.02, EAVE - 0.11))
flap = {0: [], 1: []}
for i in range(8):
    flap[i % 2].append(comp.box(((W - 0.2) / 8, 0.006, EAVE - 0.11 - CT - 0.03), at=(-(W - 0.2) / 2 + (i + 0.5) * (W - 0.2) / 8, -D / 2 - 0.02, (EAVE - 0.11 + CT + 0.03) / 2)))
M("stall_flap_red", comp.merge(*flap[0]), canvas_r, fp)
M("stall_flap_cream", comp.merge(*flap[1]), canvas_c, fp)
fb = M("stall_flap_batten", comp.merge(comp.box((W - 0.16, 0.03, 0.04), at=(0, -D / 2 - 0.02, CT + 0.05)), *[L.torus(0.02, 0.004, seg_=10, sides=4, axis="X", at=(sx * 1.2, -D / 2 - 0.045, CT + 0.05)) for sx in (-1, 1)]), wood, fp)
comp.uv_box(fb, 1.0)
comp.channel("flap", [(fp, "rotation_euler", 0, 0, math.radians(105))])
comp.channel("valance", [(vp, "rotation_euler", 0, 0, math.radians(30))])
for i, lp in enumerate(lit):
    L.clip("bulbs", lp, L.on_keys(0.04 + 0.9 * i / (len(lit) - 1)))
L.unlit(*lit)
comp.export(col, root, "ferris", "stall", made="blender/components/ferris/stall.py", source="own geometry (a generic hoopla stall); texture: https://polyhaven.com/a/weathered_planks; letters in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (weathered_planks)",
            rig={"flap": "the night flap swings 105 degrees up from shut over the front into an awning (the stall opens)", "bulbs": "the sign's bulbs come on one after another round it", "valance": "the scalloped valance lifts 30 degrees in a gust",
                 "glow": "in the scene: the material stall_bulb_glow glows, a key per state"})
