# garage/ticket-booth: the attendant's kiosk by the barrier, empty, modelled by hand: 1.5 m wide, 2 m deep and 2.5 m
# high on a kerbed concrete plinth; teal steel posts and rails, cream lower panels with a teal band, glass on every
# side from 1.05 m (booth_glass), a sliding pay hatch in the front with a steel ledge under it, a half-glazed door in
# the right side with a lever handle, a flat roof with a deep fascia lettered TICKETS, and a strip light inside under
# the roof (booth_light). Inside: a counter along the front, an old till with a small lit display (booth_screen), a
# swivel stool, a key board on the back wall and a fan heater. Its front is toward -y.
# Rig: "hatch" slides the pay hatch 0.42 m open; "door" swings the door 80 degrees out about its rear hinges.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("ticket_booth")
M = L.maker(col, root)
teal = comp.mat("booth_frame", (0.02, 0.2, 0.22), rough=0.45)
cream = comp.mat("booth_panel", (0.8, 0.76, 0.62), rough=0.5)
glass = comp.mat("booth_glass", (0.6, 0.75, 0.78), rough=0.04, alpha=0.22)
steel = comp.mat("booth_steel", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
dark = comp.mat("booth_dark", (0.03, 0.03, 0.035), rough=0.6)
light = comp.mat("booth_light", (1.0, 0.95, 0.85), rough=0.4, emit=(1.0, 0.9, 0.7), strength=5.0)
screen = comp.mat("booth_screen", (0.05, 0.3, 0.12), rough=0.2, emit=(0.2, 0.95, 0.35), strength=2.0)
white = comp.mat("booth_letters", (0.92, 0.92, 0.88), rough=0.5)
wood = comp.ph_texture("booth_counter", "laminate_floor_02", tile=1.2, res="1k")
conc = comp.ph_texture("booth_plinth", "garage_floor", tile=1.886, res="1k", tint=(0.74, 0.86, 1.0))
W, D, P = 1.5, 2.0, 0.15
Z0, ZS, ZH, ZR = P, 1.05, 2.1, 2.3     # floor, sill, head, roof underside
pl = M("ticket_booth_plinth", comp.box((W + 0.3, D + 0.3, P), at=(0, 0, P / 2)), conc)
comp.bevel(pl, 0.015, 2)
comp.uv_box(pl, 1.0)
fr = []
for sx in (-1, 1):
    for sy in (-1, 1):
        fr.append(comp.box((0.06, 0.06, ZR - Z0), at=(sx * (W / 2 - 0.03), sy * (D / 2 - 0.03), (ZR + Z0) / 2)))
for z, h in ((ZS, 0.05), (ZH, 0.05), (Z0 + 0.03, 0.06)):
    fr += [comp.box((W, 0.06, h), at=(0, sy * (D / 2 - 0.03), z)) for sy in (-1, 1)] + [comp.box((0.06, D, h), at=(sx * (W / 2 - 0.03), 0, z)) for sx in (-1, 1)]
fr.append(comp.box((0.05, 0.05, ZH - ZS), at=(0, -D / 2 + 0.03, (ZH + ZS) / 2)))                 # front mullion
fr.append(comp.box((0.05, 0.05, ZH - ZS), at=(0, D / 2 - 0.03, (ZH + ZS) / 2)))                  # back mullion
fr.append(comp.box((0.05, 0.05, ZH - ZS), at=(-W / 2 + 0.03, 0, (ZH + ZS) / 2)))                 # left mullion
DY0, DY1 = -0.2, 0.7                                                                             # the door's opening on the right side
fr.append(comp.box((0.05, 0.05, ZH - Z0), at=(W / 2 - 0.03, DY0 - 0.025, (ZH + Z0) / 2)))
fr.append(comp.box((0.05, 0.05, ZH - Z0), at=(W / 2 - 0.03, DY1 + 0.025, (ZH + Z0) / 2)))
f = M("ticket_booth_frame", comp.merge(*fr), teal)
comp.bevel(f, 0.004, 2)
pan = [comp.box((W - 0.12, 0.03, ZS - Z0 - 0.06), at=(0, sy * (D / 2 - 0.03), (ZS + Z0) / 2)) for sy in (-1, 1)]
pan.append(comp.box((0.03, D - 0.12, ZS - Z0 - 0.06), at=(-W / 2 + 0.03, 0, (ZS + Z0) / 2)))
pan += [comp.box((0.03, DY0 + D / 2 - 0.11, ZS - Z0 - 0.06), at=(W / 2 - 0.03, (DY0 - D / 2) / 2, (ZS + Z0) / 2)), comp.box((0.03, D / 2 - DY1 - 0.11, ZS - Z0 - 0.06), at=(W / 2 - 0.03, (DY1 + D / 2) / 2, (ZS + Z0) / 2))]
pan += [comp.box((W - 0.12, 0.03, ZR - ZH - 0.03), at=(0, sy * (D / 2 - 0.03), (ZR + ZH) / 2 + 0.01)) for sy in (-1, 1)] + [comp.box((0.03, D - 0.12, ZR - ZH - 0.03), at=(sx * (W / 2 - 0.03), 0, (ZR + ZH) / 2 + 0.01)) for sx in (-1, 1)]
M("ticket_booth_panels", comp.merge(*pan), cream)
band = [comp.box((W - 0.12, 0.034, 0.1), at=(0, sy * (D / 2 - 0.03), 0.8)) for sy in (-1, 1)] + [comp.box((0.034, D - 0.12, 0.1), at=(-W / 2 + 0.03, 0, 0.8))]
M("ticket_booth_band", comp.merge(*band), teal)
gl = [comp.box((W / 2 - 0.08, 0.006, ZH - ZS - 0.05), at=(-W / 4, -D / 2 + 0.03, (ZH + ZS) / 2))]
gl += [comp.box((W / 2 - 0.08, 0.006, ZH - ZS - 0.05), at=(sx * W / 4, D / 2 - 0.03, (ZH + ZS) / 2)) for sx in (-1, 1)]
gl += [comp.box((0.006, D / 2 - 0.08, ZH - ZS - 0.05), at=(-W / 2 + 0.03, sy * D / 4, (ZH + ZS) / 2)) for sy in (-1, 1)]
gl += [comp.box((0.006, DY0 + D / 2 - 0.11, ZH - ZS - 0.05), at=(W / 2 - 0.03, (DY0 - D / 2) / 2, (ZH + ZS) / 2)), comp.box((0.006, D / 2 - DY1 - 0.11, ZH - ZS - 0.05), at=(W / 2 - 0.03, (DY1 + D / 2) / 2, (ZH + ZS) / 2))]
M("ticket_booth_glass", comp.merge(*gl), glass)
# the pay hatch: the right half of the front, sliding left behind the fixed pane
hp = comp.pivot(col, root, "ticket_booth_hatch", (W / 4, -D / 2 + 0.045, (ZH + ZS) / 2))
HW, HH = W / 2 - 0.06, ZH - ZS - 0.05
M("ticket_booth_hatch_glass", comp.box((HW - 0.06, 0.006, HH - 0.06), at=(W / 4, -D / 2 + 0.045, (ZH + ZS) / 2)), glass, parent=hp)
hf = L.sweep([(W / 4 - HW / 2 + 0.015, -D / 2 + 0.045, ZS + 0.04), (W / 4 + HW / 2 - 0.015, -D / 2 + 0.045, ZS + 0.04), (W / 4 + HW / 2 - 0.015, -D / 2 + 0.045, ZH - 0.04), (W / 4 - HW / 2 + 0.015, -D / 2 + 0.045, ZH - 0.04)], L.rrect(0.03, 0.02, 0.003, 1), closed=True, up=(0, -1, 0))
M("ticket_booth_hatch_frame", hf, steel, parent=hp)
M("ticket_booth_hatch_pull", comp.box((0.015, 0.02, 0.12), at=(W / 4 + HW / 2 - 0.05, -D / 2 + 0.03, 1.3)), dark, parent=hp)
led = M("ticket_booth_ledge", comp.merge(comp.box((W / 2 + 0.05, 0.2, 0.02), at=(W / 4, -D / 2 - 0.09, ZS + 0.01)), *[comp.taper((x, -D / 2, ZS), (x, -D / 2 - 0.16, ZS), 0.01, 0.01, 0.12, 0.012) for x in (0.12, 0.62)]), steel)
# the door
hinge = (W / 2 - 0.03, DY1, 0)
dp = comp.pivot(col, root, "ticket_booth_door", hinge)
DL = DY1 - DY0
dfr = [comp.box((0.04, 0.05, ZH - Z0 - 0.05), at=(W / 2 - 0.03, y, (ZH + Z0) / 2)) for y in (DY0 + 0.027, DY1 - 0.027)]
dfr += [comp.box((0.04, DL - 0.05, 0.05), at=(W / 2 - 0.03, (DY0 + DY1) / 2, z)) for z in (Z0 + 0.06, ZS, ZH - 0.05)]
d = M("ticket_booth_door_frame", comp.merge(*dfr), teal, parent=dp)
comp.bevel(d, 0.004, 2)
M("ticket_booth_door_panel", comp.box((0.025, DL - 0.1, ZS - Z0 - 0.1), at=(W / 2 - 0.03, (DY0 + DY1) / 2, (ZS + Z0) / 2 + 0.03)), cream, parent=dp)
M("ticket_booth_door_glass", comp.box((0.006, DL - 0.1, ZH - ZS - 0.1), at=(W / 2 - 0.03, (DY0 + DY1) / 2, (ZH + ZS) / 2 - 0.025)), glass, parent=dp)
M("ticket_booth_door_handle", comp.merge(comp.cyl(0.011, 0.05, at=(W / 2 - 0.01, DY0 + 0.07, 1.0), seg=12, axis="X"), comp.box((0.012, 0.11, 0.018), at=(W / 2 + 0.04, DY0 + 0.12, 1.0)), comp.box((0.004, 0.04, 0.16), at=(W / 2 - 0.008, DY0 + 0.07, 1.0))), steel, parent=dp)
M("ticket_booth_door_hinges", comp.merge(*[comp.cyl(0.01, 0.09, at=(W / 2 + 0.0, DY1 + 0.0, z), seg=10) for z in (0.4, 1.1, 1.8)]), steel, parent=dp)
# the roof
rf = M("ticket_booth_roof", comp.merge(comp.box((W + 0.4, D + 0.4, 0.06), at=(0, 0, ZR + 0.19)), comp.box((W + 0.3, D + 0.3, 0.16), at=(0, 0, ZR + 0.08))), teal)
comp.bevel(rf, 0.006, 2)
M("ticket_booth_fascia", comp.box((W + 0.1, 0.012, 0.13), at=(0, -D / 2 - 0.156, ZR + 0.08)), cream)
M("ticket_booth_letters", xf(comp.text("TICKETS", 0.1, 0.003), T(0, -D / 2 - 0.164, ZR + 0.08)), teal)
M("ticket_booth_gutter", comp.merge(comp.cyl(0.02, ZR - 0.1, at=(-W / 2 - 0.05, D / 2 + 0.05, 0.16), seg=10), comp.box((0.05, 0.03, 0.03), at=(-W / 2 - 0.05, D / 2 + 0.03, 1.2))), steel, smooth=False)
M("ticket_booth_ceiling", comp.box((W - 0.06, D - 0.06, 0.02), at=(0, 0, ZR - 0.01)), cream)
M("ticket_booth_light", comp.merge(comp.cyl(0.016, 1.0, at=(-0.5, 0.0, ZR - 0.05), seg=12, axis="X")), light, smooth=True)
M("ticket_booth_light_batten", comp.box((1.1, 0.06, 0.03), at=(0, 0, ZR - 0.025)), white)
# inside
M("ticket_booth_floor", comp.box((W - 0.06, D - 0.06, 0.01), at=(0, 0, P + 0.005)), dark)
ct = M("ticket_booth_counter", comp.merge(comp.box((W - 0.12, 0.45, 0.035), at=(0, -D / 2 + 0.28, ZS - 0.04)), comp.box((0.03, 0.4, ZS - 0.08 - P), at=(-W / 2 + 0.3, -D / 2 + 0.28, (ZS - 0.06 + P) / 2))), wood)
comp.uv_box(ct, 1.0)
till = M("ticket_booth_till", comp.merge(comp.box((0.34, 0.36, 0.13), at=(-0.35, -D / 2 + 0.3, ZS + 0.045)), xf(comp.box((0.3, 0.16, 0.1)), T(-0.35, -D / 2 + 0.38, ZS + 0.15) @ R(-25, "X")), comp.box((0.12, 0.03, 0.1), at=(-0.35, -D / 2 + 0.44, ZS + 0.24))), cream)
comp.bevel(till, 0.008, 2)
M("ticket_booth_till_keys", comp.merge(*[xf(comp.box((0.022, 0.022, 0.012)), T(-0.44 + i * 0.03, -D / 2 + 0.345 + j * 0.03, ZS + 0.19 + j * 0.014) @ R(-25, "X")) for i in range(7) for j in range(3)]), dark)
M("ticket_booth_till_display", comp.merge(comp.box((0.1, 0.004, 0.035), at=(-0.35, -D / 2 + 0.423, ZS + 0.25)), comp.box((0.1, 0.004, 0.035), at=(-0.35, -D / 2 + 0.457, ZS + 0.25))), screen)
st = comp.merge(L.lathe([(0.0, 0.0), (0.2, 0.0), (0.2, 0.015), (0.03, 0.03), (0.02, 0.5), (0.0, 0.5)], 20, at=(0.15, 0.15, P + 0.01)), comp.cyl(0.16, 0.05, at=(0.15, 0.15, P + 0.5), seg=24))
M("ticket_booth_stool", st, dark, smooth=False)
comp.uv_box(M("ticket_booth_key_board", comp.box((0.4, 0.015, 0.3), at=(-0.3, D / 2 - 0.07, 0.75)), wood), 1.0)
M("ticket_booth_keys", comp.merge(*[comp.box((0.012, 0.004, 0.05), at=(-0.44 + i * 0.07, D / 2 - 0.082, 0.8 - (i % 2) * 0.1)) for i in range(5)]), steel)
ht = M("ticket_booth_heater", comp.box((0.3, 0.14, 0.26), at=(0.4, D / 2 - 0.2, P + 0.14)), cream)
comp.bevel(ht, 0.01, 2)
M("ticket_booth_heater_grille", comp.merge(*[comp.box((0.24, 0.004, 0.008), at=(0.4, D / 2 - 0.272, P + 0.06 + i * 0.022)) for i in range(8)]), dark)
comp.channel("hatch", [(hp, "location", 0, hp.location.x, hp.location.x - 0.42)])
comp.channel("door", [(dp, "rotation_euler", 2, 0, math.radians(80))])
L.look(col, "ticket-booth", eye=(3.6, -4.4, 2.3), target=(0, 0, 1.2), lens=40, frame=None)
comp.export(col, root, "garage", "ticket_booth", made="blender/components/garage/ticket_booth.py",
            source="own geometry (a generic car park kiosk); https://polyhaven.com/a/garage_floor, https://polyhaven.com/a/laminate_floor_02", license="ours; textures CC0",
            credit="Poly Haven (garage_floor, laminate_floor_02)",
            rig={"hatch": "the pay hatch (the front's right pane) slides 0.42 m to the left behind the fixed pane",
                 "door": "the door in the right side swings 80 degrees outward about its rear hinges",
                 "light": "in the scene: the glow of booth_light (the strip under the roof) and booth_screen (the till)"})
