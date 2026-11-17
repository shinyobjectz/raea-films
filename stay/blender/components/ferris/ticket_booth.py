# ferris/ticket-booth: an eight-sided ticket booth, 1.9 m across and 3.4 m to its finial, modelled by hand: a
# boarded dado in red and cream, a serving window in the front face with a counter, a brass grille and a coin tray,
# glazed side lights, corner posts, a fascia with TICKETS on the front in raised letters and a row of bulbs under
# it, a twelve-gore canopy roof with a scalloped valance, a ball finial and a pennant, a price board, and a roller
# shutter in the window's head. Its front faces -y. The lit bulbs are a part of their own (ticket_booth_lights,
# material booth_bulb_glow), nothing at rest.
# Rig: "shutter" pulls the shutter 0.85 m down over the window (closed for the night); "bulbs" brings the fascia's
# bulbs on from left to right; "pennant" swings the pennant 50 degrees round its pole.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("ticket_booth")
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.5)
gold = comp.mat("fair_gold", (0.85, 0.6, 0.15), rough=0.35, metal=0.6)
glassm = comp.mat("booth_glass", (0.08, 0.1, 0.11), rough=0.06)
dark = comp.mat("booth_dark", (0.02, 0.02, 0.022), rough=0.8)
steel = comp.mat("booth_shutter", (0.6, 0.62, 0.63), rough=0.4, metal=1.0)
bulb = comp.mat("booth_bulb_glass", (0.75, 0.72, 0.62), rough=0.15)
glow = comp.mat("booth_bulb_glow", (1.0, 0.85, 0.55), rough=0.3, emit=(1.0, 0.72, 0.35), strength=40000.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
RI = 0.95                                 # to a face
FW = 2 * RI * math.tan(math.radians(22.5))   # a face's width
def face(k, bm):
    """Put a part built for the front face (centred on x, its outside at y 0, facing -y) on face k."""
    return xf(bm, R(45 * k, "Z") @ comp.Matrix.Translation((0, -RI, 0)))
Z_DADO, Z_HEAD, Z_TOP = 1.0, 2.05, 2.5
boards = {0: [], 1: []}
glass, frames, posts = [], [], []
for k in range(8):
    for i in range(6):
        boards[(i + k) % 2].append(face(k, comp.box((FW / 6 - 0.004, 0.025, Z_DADO - 0.08), at=(-FW / 2 + (i + 0.5) * FW / 6, 0.0125, 0.08 + (Z_DADO - 0.08) / 2))))
    frames.append(face(k, comp.box((FW, 0.05, 0.08), at=(0, 0.02, 0.04))))
    frames.append(face(k, comp.box((FW, 0.06, 0.06), at=(0, 0.02, Z_DADO + 0.03))))
    frames.append(face(k, comp.box((FW + 0.03, 0.05, Z_TOP - Z_HEAD), at=(0, 0.01, (Z_TOP + Z_HEAD) / 2))))
    posts.append(face(k, comp.box((0.07, 0.07, Z_TOP), at=(FW / 2, 0.02, Z_TOP / 2))))
    if k in (7, 1, 6, 2):      # side lights, glazed with a cross bar
        glass.append(face(k, comp.box((FW - 0.08, 0.006, Z_HEAD - Z_DADO - 0.06), at=(0, 0.03, (Z_HEAD + Z_DADO) / 2 + 0.03))))
        frames.append(face(k, comp.box((FW - 0.07, 0.03, 0.03), at=(0, 0.025, (Z_HEAD + Z_DADO) / 2 + 0.03))))
        frames.append(face(k, comp.box((0.03, 0.03, Z_HEAD - Z_DADO - 0.06), at=(0, 0.025, (Z_HEAD + Z_DADO) / 2 + 0.03))))
    elif k != 0:               # the back three faces boarded to the head
        for i in range(6):
            boards[(i + k + 1) % 2].append(face(k, comp.box((FW / 6 - 0.004, 0.025, Z_HEAD - Z_DADO - 0.06), at=(-FW / 2 + (i + 0.5) * FW / 6, 0.0125, (Z_HEAD + Z_DADO) / 2 + 0.03))))
M("ticket_booth_boards_red", comp.merge(*boards[0]), red)
M("ticket_booth_boards_cream", comp.merge(*boards[1]), cream)
f = M("ticket_booth_frame", comp.merge(*frames), cream)
comp.bevel(f, 0.005, 2)
M("ticket_booth_posts", comp.merge(*posts), red)
M("ticket_booth_glass", comp.merge(*glass), glassm)
M("ticket_booth_inside", comp.merge(comp.cyl(RI - 0.06, Z_TOP - 0.1, at=(0, 0, 0.05), seg=8), ), dark)
comp.bpy.data.objects["ticket_booth_inside"].rotation_euler[2] = math.radians(22.5)
# the window: a counter, a grille of brass bars with an arched hatch, a coin tray
c = M("ticket_booth_counter", comp.merge(comp.box((FW + 0.1, 0.3, 0.04), at=(0, -RI - 0.08, Z_DADO + 0.04)), *[comp.taper((x, -RI, Z_DADO + 0.02), (x, -RI - 0.2, Z_DADO + 0.02), 0.03, 0.03, 0.2, 0.03) for x in (-FW / 2 + 0.06, FW / 2 - 0.06)]), cream)
comp.bevel(c, 0.006, 2)
bars = [L.seg((x, -RI + 0.03, Z_DADO + (0.36 if abs(x) < 0.16 else 0.06)), (x, -RI + 0.03, Z_HEAD), 0.006, 6) for x in [-FW / 2 + 0.07 + i * (FW - 0.14) / 12 for i in range(13)]]
bars += [L.seg((-FW / 2 + 0.05, -RI + 0.03, z), (FW / 2 - 0.05, -RI + 0.03, z), 0.006, 6) for z in (Z_DADO + 0.36, Z_HEAD - 0.12)]
M("ticket_booth_grille", comp.merge(*bars), gold, None, True)
M("ticket_booth_coin_tray", comp.merge(comp.cyl(0.09, 0.012, at=(0, -RI - 0.1, Z_DADO + 0.06), seg=24, r2=0.11), comp.box((0.07, 0.035, 0.03), at=(0.25, -RI - 0.1, Z_DADO + 0.075))), gold, None, True)
# the fascia's sign and its bulbs
M("ticket_booth_sign", comp.merge(xf(comp.text("TICKETS", 0.2, depth=0.02), T(0, -RI - 0.03, (Z_TOP + Z_HEAD) / 2 + 0.03))), gold)
NB = 9
holders, glasses, lit = [], [], []
lights = comp.pivot(col, root, "ticket_booth_lights", (0, -RI, Z_HEAD + 0.06))
for i in range(NB):
    x = -FW / 2 + 0.06 + i * (FW - 0.12) / (NB - 1)
    holders.append(comp.cyl(0.018, 0.03, at=(x, -RI - 0.045, Z_HEAD + 0.06), seg=6, axis="Y"))
    glasses.append(L.ico(0.028, (x, -RI - 0.065, Z_HEAD + 0.06), 1))
    lp = comp.pivot(col, root, f"ticket_booth_light_{i + 1}", (x, -RI - 0.065, Z_HEAD + 0.06), parent=lights)
    M(f"ticket_booth_light_{i + 1}_glow", L.ico(0.034, (x, -RI - 0.065, Z_HEAD + 0.06), 1), glow, lp, True)
    lit.append(lp)
M("ticket_booth_bulb_holders", comp.merge(*holders), dark)
M("ticket_booth_bulbs", comp.merge(*glasses), bulb, None, True)
# the roof: a twelve-gore canopy, a finial and a pennant on its pole
ca, cb = L.gore_canopy(1.3, 0.72, 16, z=Z_TOP + 0.72, valance=0.16)
for nm, bm, m in (("red", ca, red), ("cream", cb, cream)):
    o = M(f"ticket_booth_roof_{nm}", xf(bm, R(11.25, "Z")), m)
    comp.solidify(o, 0.012)
M("ticket_booth_finial", comp.merge(L.sphere(0.07, at=(0, 0, Z_TOP + 0.76), u=14, v=8), comp.cyl(0.012, 0.55, at=(0, 0, Z_TOP + 0.8), seg=8), L.sphere(0.022, at=(0, 0, Z_TOP + 1.36), u=8, v=6)), gold, None, True)
pp = comp.pivot(col, root, "ticket_booth_pennant", (0, 0, Z_TOP + 1.2))
pen = bmesh.new()
pen.faces.new([pen.verts.new(p) for p in ((0.012, 0, Z_TOP + 1.32), (0.012, 0, Z_TOP + 1.1), (0.42, 0, Z_TOP + 1.2))])
po = M("ticket_booth_pennant_flag", pen, red, pp)
comp.solidify(po, 0.004)
# the price board beside the window, and the shutter in the head
M("ticket_booth_price_board", face(1, comp.merge(comp.box((0.34, 0.012, 0.46), at=(0, -0.012, 0.55)))), dark)
M("ticket_booth_price_text", face(1, comp.merge(xf(comp.text("RIDES", 0.07, depth=0.002), T(0, -0.02, 0.7)), *[comp.box((0.26 - 0.05 * (i % 2), 0.002, 0.014), at=(-0.025 * (i % 2), -0.019, 0.6 - i * 0.05)) for i in range(5)])), cream)
sp = comp.pivot(col, root, "ticket_booth_shutter", (0, -RI + 0.05, Z_HEAD))
slats = [comp.box((FW - 0.05, 0.012, 0.045), at=(0, -RI + 0.05, Z_HEAD + 0.025 + i * 0.05)) for i in range(18)]
M("ticket_booth_shutter_slats", comp.merge(*slats, comp.box((FW - 0.05, 0.03, 0.03), at=(0, -RI + 0.05, Z_HEAD + 0.0))), steel, sp)
# the shutter lives inside the head's fascia box; its box hides the raised curtain
M("ticket_booth_shutter_box", comp.box((FW - 0.02, 0.1, Z_TOP - Z_HEAD - 0.02), at=(0, -RI + 0.065, (Z_TOP + Z_HEAD) / 2 + 0.01)), cream)
sp.scale[2] = 0.48
comp.bpy.context.view_layer.update()
L.clip("shutter", sp, {("location", 2): [(0, sp.location.z), (1, sp.location.z - 0.95)], ("scale", 2): [(0, 0.48), (1, 1.06)]})
for i, lp in enumerate(lit):
    L.clip("bulbs", lp, L.on_keys(0.05 + 0.85 * i / (NB - 1)))
L.unlit(*lit)
comp.channel("pennant", [(pp, "rotation_euler", 2, 0, math.radians(50))])
comp.export(col, root, "ferris", "ticket_booth", made="blender/components/ferris/ticket_booth.py", source="own geometry (a generic fairground ticket booth); letters in Blender's built-in font", license="ours", credit="",
            rig={"shutter": "the roller shutter comes 0.95 m down out of the head to the counter (closed)", "bulbs": "the fascia's nine bulbs come on from left to right", "pennant": "the pennant swings 50 degrees round its pole",
                 "glow": "in the scene: the material booth_bulb_glow glows, a key per state"})
