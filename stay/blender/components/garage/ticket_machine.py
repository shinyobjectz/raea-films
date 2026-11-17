# garage/ticket-machine: the entry ticket dispenser by the barrier, 1.3 m high, modelled by hand: a grey steel column
# with a hazard-striped foot on a plinth, a black head under a visor with a small green screen (machine_screen), a
# lit green button in a chrome ring (machine_button), a ticket throat with a paper ticket in it, a card slot, an
# intercom grille and its call button, and PRESS FOR TICKET lettered under the screen. Its face is toward -y.
# Rig: "ticket" feeds the ticket 6 cm out of the throat; "press" pushes the green button in 6 mm.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("ticket_machine")
M = L.maker(col, root)
grey = comp.mat("machine_body", (0.42, 0.43, 0.45), rough=0.45, metal=0.5)
black = comp.mat("machine_face", (0.02, 0.02, 0.022), rough=0.4)
yellow = comp.mat("machine_yellow", (0.92, 0.72, 0.04), rough=0.5)
chrome = comp.mat("machine_chrome", (0.9, 0.9, 0.92), rough=0.1, metal=1.0)
screen = comp.mat("machine_screen", (0.05, 0.3, 0.1), rough=0.2, emit=(0.15, 0.95, 0.3), strength=2.0)
button = comp.mat("machine_button", (0.05, 0.6, 0.15), rough=0.3, emit=(0.1, 0.9, 0.25), strength=2.5)
paper = comp.mat("machine_ticket", (0.92, 0.9, 0.82), rough=0.8)
white = comp.mat("machine_letters", (0.9, 0.9, 0.88), rough=0.5)
conc = comp.ph_texture("machine_plinth", "garage_floor", tile=1.886, res="1k", tint=(0.74, 0.86, 1.0))
p = M("ticket_machine_plinth", comp.box((0.5, 0.46, 0.1), at=(0, 0, 0.05)), conc)
comp.bevel(p, 0.012, 2)
comp.uv_box(p, 1.0)
b = M("ticket_machine_column", comp.box((0.3, 0.26, 0.86), at=(0, 0, 0.53)), grey)
comp.bevel(b, 0.01, 3)
a, k = L.stripes(0.3, 0.16, 5, t=0.002)
M("ticket_machine_hazard_yellow", xf(a, T(0, -0.13, 0.2)), yellow)
M("ticket_machine_hazard_black", xf(k, T(0, -0.13, 0.2)), black)
head = comp.box((0.34, 0.3, 0.36), at=(0, 0, 1.14))
for v in head.verts:
    if v.co.z > 1.2 and v.co.y < 0:
        v.co.y += 0.07       # the face leans back
h = M("ticket_machine_head", head, grey)
comp.bevel(h, 0.012, 3)
F = lambda z: -0.15 + 0.07 * (z - 0.96) / 0.36   # the face's y at height z
LEAN = math.degrees(math.atan(0.07 / 0.36))
def on_face(bm, x, z, out=0.0):
    return xf(bm, T(x, F(z) - out, z) @ R(-LEAN, "X"))
M("ticket_machine_face", on_face(comp.box((0.3, 0.004, 0.32)), 0, 1.14, 0.002), black)
vis = M("ticket_machine_visor", comp.box((0.36, 0.12, 0.012), at=(0, -0.1, 1.33)), grey)
comp.bevel(vis, 0.004, 2)
M("ticket_machine_screen", on_face(comp.box((0.17, 0.003, 0.085)), -0.04, 1.24, 0.005), screen)
M("ticket_machine_screen_bezel", on_face(L.sweep([(-0.09, 0, -0.047), (0.09, 0, -0.047), (0.09, 0, 0.047), (-0.09, 0, 0.047)], L.rrect(0.006, 0.006, 0.001, 1), closed=True, up=(0, -1, 0)), -0.04, 1.24, 0.006), chrome)
M("ticket_machine_letters", on_face(comp.text("PRESS FOR TICKET", 0.021, 0.001), -0.04, 1.172, 0.005), white)
M("ticket_machine_button_ring", on_face(L.lathe([(0.03, 0), (0.036, 0), (0.036, 0.008), (0.03, 0.008)], 24, axis="Y"), 0.1, 1.235, 0.012), chrome, smooth=True)
bp = comp.pivot(col, root, "ticket_machine_button", (0.1, F(1.235) - 0.012, 1.235))
M("ticket_machine_button_cap", on_face(L.lathe([(0, 0.0), (0.02, 0.001), (0.028, 0.006), (0.029, 0.016), (0, 0.016)], 24, axis="Y"), 0.1, 1.235, 0.02), button, parent=bp, smooth=True)
M("ticket_machine_throat", on_face(comp.box((0.11, 0.012, 0.022)), -0.04, 1.1, 0.006), chrome)
M("ticket_machine_throat_slot", on_face(comp.box((0.09, 0.013, 0.006)), -0.04, 1.1, 0.0065), black)
tp = comp.pivot(col, root, "ticket_machine_ticket", (-0.04, F(1.1) - 0.01, 1.1))
tk = xf(comp.box((0.08, 0.085, 0.0008)), T(-0.04, F(1.1) + 0.02, 1.1 + 0.0) @ R(-LEAN, "X"))
M("ticket_machine_ticket_paper", tk, paper, parent=tp)
M("ticket_machine_card_slot", comp.merge(on_face(comp.box((0.07, 0.008, 0.05)), 0.09, 1.1, 0.004), on_face(comp.box((0.055, 0.009, 0.004)), 0.09, 1.1, 0.0045)), chrome)
holes = [on_face(comp.cyl(0.003, 0.002, seg=8, axis="Y"), -0.09 + i * 0.012, 1.0 + j * 0.012, 0.005) for i in range(7) for j in range(3)]
M("ticket_machine_intercom", comp.merge(*holes, on_face(comp.cyl(0.011, 0.006, seg=14, axis="Y"), 0.06, 1.012, 0.008)), chrome)
M("ticket_machine_side_lock", comp.cyl(0.012, 0.006, at=(0.15, 0.03, 0.7), seg=14, axis="X"), chrome)
comp.channel("ticket", [(tp, "location", 1, tp.location.y, tp.location.y - 0.06)])
comp.channel("press", [(bp, "location", 1, bp.location.y, bp.location.y + 0.006)])
L.look(col, "ticket-machine", eye=(0.8, -1.9, 1.5), target=(0, 0, 0.85), lens=45, frame=None)
comp.export(col, root, "garage", "ticket_machine", made="blender/components/garage/ticket_machine.py",
            source="own geometry (a generic ticket dispenser); plinth: https://polyhaven.com/a/garage_floor", license="ours; texture CC0", credit="Poly Haven (garage_floor)",
            rig={"ticket": "the paper ticket feeds 6 cm out of the throat toward the driver", "press": "the green button goes in 6 mm",
                 "screen": "in the scene: the glow of machine_screen and machine_button"})
