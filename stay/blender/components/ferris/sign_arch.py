# ferris/sign-arch: the fair's entrance arch, 8 m wide and 6 m high, modelled by hand: two square lattice towers on
# base plates with ballast blocks, a lattice arch sprung between them carrying a red fascia with FUNFAIR in raised
# gold letters, a star at its crown, 41 bulbs along the arch and up the towers, and across the way at 1 m a chain
# with a CLOSED board hung on it. Its front faces -y; origin on the ground at the middle of the way. The lit bulbs
# are parts of their own (sign_arch_lit_NN, material arch_bulb_glow), nothing at rest.
# Rig: "bulbs" lights the bulbs up one tower, over the arch and down the other; "swing" swings the CLOSED board
# 28 degrees on the chain; "star" turns the crown's star one whole turn.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("sign_arch")
white = comp.mat("wheel_steel_white", (0.82, 0.82, 0.78), rough=0.4, metal=0.2)
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
gold = comp.mat("fair_gold", (0.85, 0.6, 0.15), rough=0.35, metal=0.6)
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
conc = comp.ph_texture("pole_concrete", "concrete_floor_worn_001", tile=1.0, res="1k")
dark = comp.mat("booth_dark", (0.02, 0.02, 0.022), rough=0.8)
bulb = comp.mat("booth_bulb_glass", (0.75, 0.72, 0.62), rough=0.15)
glow = comp.mat("arch_bulb_glow", (1.0, 0.85, 0.55), rough=0.3, emit=(1.0, 0.72, 0.35), strength=40000.0)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
HW, TH, RISE = 4.0, 4.2, 1.6      # half width, the towers' height, the arch's rise over them
steel, plates, blocks = [], [], []
for sx in (-1, 1):
    steel.append(L.truss((sx * HW, 0, 0.05), (sx * HW, 0, TH), 0.5, 0.5, 9, r=0.03, lace=0.014))
    plates.append(comp.box((0.9, 0.9, 0.05), at=(sx * HW, 0, 0.025)))
    blocks += [comp.box((0.8, 0.4, 0.4), at=(sx * HW, sy * 0.66, 0.2)) for sy in (-1, 1)]
arc = lambda t, dr=0.0: Vector((-(HW + dr) * math.cos(math.pi * t), 0, TH + (RISE + dr) * math.sin(math.pi * t)))
NA = 14
for k in range(NA):
    for dr in (0.0, -0.4):
        for y in (-0.2, 0.2):
            steel.append(L.seg(arc(k / NA, dr) + Vector((0, y, 0)), arc((k + 1) / NA, dr) + Vector((0, y, 0)), 0.028, 8))
    for y in (-0.2, 0.2):
        steel.append(L.seg(arc(k / NA) + Vector((0, y, 0)), arc((k + 1) / NA, -0.4) + Vector((0, y, 0)), 0.012, 6))
        steel.append(L.seg(arc(k / NA, -0.4) + Vector((0, y, 0)), arc(k / NA) + Vector((0, y, 0)), 0.012, 6))
    steel.append(L.seg(arc(k / NA) + Vector((0, -0.2, 0)), arc(k / NA) + Vector((0, 0.2, 0)), 0.012, 6))
M("sign_arch_steel", comp.merge(*steel), white, None, True)
M("sign_arch_plates", comp.merge(*plates), galv)
b = M("sign_arch_ballast", comp.merge(*blocks), conc)
comp.bevel(b, 0.015, 2)
comp.uv_box(b, 1.0)
fa = M("sign_arch_fascia", comp.merge(comp.box((5.4, 0.05, 1.0), at=(0, -0.24, TH + 0.62)), comp.box((5.5, 0.07, 0.06), at=(0, -0.24, TH + 1.14)), comp.box((5.5, 0.07, 0.06), at=(0, -0.24, TH + 0.1))), red)
comp.bevel(fa, 0.008, 2)
M("sign_arch_letters", xf(comp.text("FUNFAIR", 0.78, depth=0.05), T(0, -0.29, TH + 0.62)), gold)
sp = comp.pivot(col, root, "sign_arch_star", (0, -0.27, TH + RISE + 0.55))
star = bmesh.new()
pts = [Vector((math.sin(math.pi * k / 5) * (0.5 if k % 2 == 0 else 0.2), 0, math.cos(math.pi * k / 5) * (0.5 if k % 2 == 0 else 0.2))) + Vector((0, -0.27, TH + RISE + 0.55)) for k in range(10)]
star.faces.new([star.verts.new(p) for p in pts])
so = M("sign_arch_star_plate", star, gold, sp)
comp.solidify(so, 0.05)
M("sign_arch_star_post", L.seg((0, -0.2, TH + RISE - 0.02), (0, -0.2, TH + RISE + 0.55), 0.025, 8), white, None, True)
# bulbs: up the left tower, over the arch, down the right
spots = [Vector((-HW, -0.28, 0.6 + 0.45 * i)) for i in range(8)] + [arc((i + 0.5) / 25, 0.06) + Vector((0, -0.24, 0)) for i in range(25)] + [Vector((HW, -0.28, 0.6 + 0.45 * (7 - i))) for i in range(8)]
holders, glasses, lit = [], [], []
lights = comp.pivot(col, root, "sign_arch_lights", (0, -0.25, TH))
for i, p in enumerate(spots):
    holders.append(comp.cyl(0.03, 0.05, at=(p.x, p.y + 0.01, p.z), seg=6, axis="Y"))
    glasses.append(L.ico(0.05, (p.x, p.y - 0.03, p.z), 1))
    lp = comp.pivot(col, root, f"sign_arch_lit_{i + 1:02d}", (p.x, p.y - 0.03, p.z), parent=lights)
    M(f"sign_arch_lit_{i + 1:02d}_glow", L.ico(0.062, (p.x, p.y - 0.03, p.z), 1), glow, lp, True)
    lit.append(lp)
M("sign_arch_bulb_holders", comp.merge(*holders), dark)
M("sign_arch_bulbs", comp.merge(*glasses), bulb, None, True)
# the chain across the way and its board
CH = lambda x: 1.05 - 0.22 * (1 - (x / (HW - 0.25)) ** 2)
links = []
NL = 60
for i in range(NL):
    x = -(HW - 0.25) + 2 * (HW - 0.25) * (i + 0.5) / NL
    links.append(L.torus(0.03, 0.006, seg_=8, sides=4, axis="Y" if i % 2 else "Z", at=(x, 0, CH(x))))
M("sign_arch_chain", comp.merge(*links, *[L.torus(0.04, 0.008, seg_=10, sides=4, axis="Y", at=(sx * (HW - 0.25), 0, 1.05)) for sx in (-1, 1)]), galv, None, True)
bp = comp.pivot(col, root, "sign_arch_closed", (0, 0, CH(0)))
bd = M("sign_arch_closed_board", comp.box((1.3, 0.02, 0.42), at=(0, 0, CH(0) - 0.33)), cream, bp)
comp.bevel(bd, 0.004, 2)
M("sign_arch_closed_letters", comp.merge(xf(comp.text("CLOSED", 0.24, depth=0.004), T(0, -0.012, CH(0) - 0.33)), xf(xf(comp.text("CLOSED", 0.24, depth=0.004), R(180, "Z")), T(0, 0.012, CH(0) - 0.33))), red, bp)
M("sign_arch_closed_hooks", comp.merge(*[L.seg((sx * 0.5, 0, CH(0.5) - 0.0), (sx * 0.5, 0, CH(0) - 0.12), 0.005, 6) for sx in (-1, 1)]), galv, bp, True)
for i, lp in enumerate(lit):
    L.clip("bulbs", lp, L.on_keys(0.03 + 0.92 * i / (len(lit) - 1)))
L.unlit(*lit)
comp.channel("swing", [(bp, "rotation_euler", 0, 0, math.radians(28))])
comp.channel("star", [(sp, "rotation_euler", 1, 0, 2 * math.pi)])
comp.export(col, root, "ferris", "sign_arch", made="blender/components/ferris/sign_arch.py", source="own geometry (a generic fair entrance arch); texture: https://polyhaven.com/a/concrete_floor_worn_001; letters in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (concrete_floor_worn_001)",
            rig={"bulbs": "the 41 bulbs light up the left tower, over the arch and down the right", "swing": "the CLOSED board swings 28 degrees on the chain", "star": "the crown's star turns one whole turn",
                 "glow": "in the scene: the material arch_bulb_glow glows, a key per state"})
