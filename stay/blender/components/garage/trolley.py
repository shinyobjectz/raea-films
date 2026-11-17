# garage/trolley: a supermarket trolley left in the car park, 1.05 m to its handle, modelled by hand: a tapering wire
# basket (a tube rim, wires down and round every side and the floor), a wire rear gate hinged at its top with a red
# child-seat flap, a tube chassis with a wire lower tray, a handle in a red plastic sleeve with a coin lock, red
# corner bumpers, and four swivel casters (a fork, a grey tyre on a hub). Its nose points to -y.
# Rig: "roll" rolls it 0.39 m forward with every wheel turning one whole turn (no slip; where it is on the slope is
# the Model's position); "gate" swings the rear gate 55 degrees up into the basket (as when trolleys nest).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("trolley")
M = L.maker(col, root)
zinc = comp.mat("trolley_wire", (0.72, 0.73, 0.75), rough=0.25, metal=1.0)
red = comp.mat("trolley_plastic", (0.62, 0.04, 0.03), rough=0.45)
grey = comp.mat("trolley_tyre", (0.2, 0.2, 0.21), rough=0.7)
dark = comp.mat("trolley_fork", (0.3, 0.3, 0.32), rough=0.4, metal=1.0)
cart = comp.pivot(col, root, "trolley_cart", (0, 0, 0))
V = Vector
TFL, TFR, TRL, TRR = V((-0.22, -0.48, 0.96)), V((0.22, -0.48, 0.96)), V((-0.28, 0.42, 1.0)), V((0.28, 0.42, 1.0))
BFL, BFR, BRL, BRR = V((-0.18, -0.42, 0.58)), V((0.18, -0.42, 0.58)), V((-0.23, 0.38, 0.52)), V((0.23, 0.38, 0.52))
WIRE = L.circle(0.0022, 5)
def wire(a, b, prof=WIRE):
    d = (V(b) - V(a)).normalized()
    up = (0, 0, 1) if abs(d.z) < 0.9 else (0, 1, 0)
    return L.sweep([a, b], prof, up=up)
def panel(a, b, c, d, nu, nv):
    """Wires over the quad a-b (top), d-c (bottom): nu down it, nv along it."""
    out = []
    for i in range(nu + 1):
        t = i / nu
        out.append(wire(a.lerp(b, t), d.lerp(c, t)))
    for j in range(1, nv):
        t = j / nv
        out.append(wire(a.lerp(d, t), b.lerp(c, t)))
    return out
ws = panel(TFL, TRL, BRL, BFL, 18, 5) + panel(TRR, TFR, BFR, BRR, 18, 5) + panel(TFR, TFL, BFL, BFR, 9, 5) + panel(BFL, BFR, BRR, BRL, 8, 12)
M("trolley_basket_wires", comp.merge(*ws), zinc, parent=cart, smooth=True)
rim = L.sweep([TRL, TFL, TFR, TRR], L.circle(0.0065, 8))
low = L.sweep([BRL, BFL, BFR, BRR], L.circle(0.004, 6), closed=True)
posts = [wire(TRL, BRL, L.circle(0.005, 6)), wire(TRR, BRR, L.circle(0.005, 6)), wire(TRL, TRR, L.circle(0.005, 6))]
M("trolley_basket_frame", comp.merge(rim, low, *posts), zinc, parent=cart, smooth=True)
# the rear gate, hinged along its top
gate = comp.pivot(col, root, "trolley_gate", (0, 0.415, 0.99), parent=cart)
g0, g1, g2, g3 = V((-0.265, 0.412, 0.985)), V((0.265, 0.412, 0.985)), V((0.22, 0.375, 0.545)), V((-0.22, 0.375, 0.545))
gw = panel(g0, g1, g2, g3, 10, 5) + [L.sweep([g0, g1, g2, g3], L.circle(0.004, 6), closed=True)]
M("trolley_gate_wires", comp.merge(*gw), zinc, parent=gate, smooth=True)
flap = M("trolley_gate_flap", xf(comp.box((0.34, 0.008, 0.17)), T(0, 0.392, 0.74) @ R(-5, "X")), red, parent=gate)
comp.bevel(flap, 0.003, 2)
# the chassis
tube = L.circle(0.011, 10)
ch = []
for sx in (-1, 1):
    ch.append(L.sweep([(sx * 0.19, -0.42, 0.15), (sx * 0.26, 0.4, 0.15), (sx * 0.265, 0.44, 0.3), (sx * 0.27, 0.47, 0.6), (sx * 0.275, 0.53, 1.045)], tube))
    ch.append(L.sweep([(sx * 0.185, -0.36, 0.15), (sx * 0.185, -0.38, 0.4), (sx * 0.18, -0.4, 0.585)], L.circle(0.009, 8)))
    ch.append(L.sweep([(sx * 0.255, 0.33, 0.15), (sx * 0.24, 0.35, 0.52)], L.circle(0.009, 8)))
ch.append(L.sweep([(-0.19, -0.42, 0.15), (0.19, -0.42, 0.15)], tube))
ch.append(L.sweep([(-0.26, 0.4, 0.15), (0.26, 0.4, 0.15)], tube))
c = M("trolley_chassis", comp.merge(*ch), zinc, parent=cart, smooth=True)
L.sharp(c, 50)
tray = [wire((-(0.19 + 0.07 * t), -0.42 + 0.82 * t, 0.165), ((0.19 + 0.07 * t), -0.42 + 0.82 * t, 0.165)) for t in [i / 9 for i in range(1, 9)]]
tray += [wire((x * 0.19 / 0.26, -0.42, 0.167), (x, 0.4, 0.167)) for x in (-0.13, 0, 0.13)]
M("trolley_tray", comp.merge(*tray), zinc, parent=cart, smooth=True)
# the handle
M("trolley_handle_bar", comp.cyl(0.012, 0.55, at=(-0.275, 0.53, 1.045), seg=12, axis="X"), zinc, parent=cart, smooth=True)
sl = M("trolley_handle_sleeve", comp.merge(comp.cyl(0.0175, 0.44, at=(-0.22, 0.53, 1.045), seg=16, axis="X"), comp.box((0.075, 0.05, 0.04), at=(0.17, 0.5, 1.05))), red, parent=cart, smooth=True)
L.sharp(sl, 40)
M("trolley_coin_slot", comp.box((0.03, 0.004, 0.006), at=(0.17, 0.474, 1.055)), dark, parent=cart)
bump = [xf(comp.box((0.07, 0.035, 0.05)), T(sx * 0.2, -0.485, 0.955) @ R(sx * -20, "Z")) for sx in (-1, 1)]
bm_ = M("trolley_bumpers", comp.merge(*bump), red, parent=cart)
comp.bevel(bm_, 0.01, 3)
# the casters
WR_, wheels = 0.0625, []
for nm, x, y in (("fl", -0.19, -0.42), ("fr", 0.19, -0.42), ("rl", -0.26, 0.4), ("rr", 0.26, 0.4)):
    fork = comp.merge(comp.cyl(0.02, 0.012, at=(x, y, 0.128), seg=14), comp.box((0.05, 0.05, 0.004), at=(x, y + 0.012, 0.126)),
                      *[xf(comp.box((0.003, 0.03, 0.085)), T(x + s * 0.02, y + 0.02, 0.092) @ R(-22, "X")) for s in (-1, 1)])
    M(f"trolley_caster_{nm}", fork, dark, parent=cart)
    wp = comp.pivot(col, root, f"trolley_wheel_{nm}", (x, y + 0.035, WR_), parent=cart)
    tyre = L.lathe([(0.03, -0.014), (0.057, -0.015), (0.0625, -0.009), (0.0625, 0.009), (0.057, 0.015), (0.03, 0.014)], 28, axis="X", at=(x, y + 0.035, WR_))
    L.sharp(M(f"trolley_wheel_{nm}_tyre", tyre, grey, parent=wp, smooth=True), 40)
    hub = comp.merge(comp.cyl(0.03, 0.03, at=(x - 0.015, y + 0.035, WR_), seg=16, axis="X"), comp.cyl(0.005, 0.046, at=(x - 0.023, y + 0.035, WR_), seg=8, axis="X"),
                     *[xf(comp.box((0.032, 0.008, 0.05)), T(x, y + 0.035, WR_) @ R(a, "X")) for a in (0, 60, 120)])
    M(f"trolley_wheel_{nm}_hub", hub, zinc, parent=wp)
    wheels.append(wp)
TRAVEL = 2 * math.pi * WR_
comp.channel("roll", [(cart, "location", 1, 0, -TRAVEL)] + [(w, "rotation_euler", 0, 0, 2 * math.pi) for w in wheels])
comp.channel("gate", [(gate, "rotation_euler", 0, 0, math.radians(-55))])
L.look(col, "trolley", lens=50, frame=None)
comp.export(col, root, "garage", "trolley", made="blender/components/garage/trolley.py", source="own geometry (a generic wire supermarket trolley)", license="ours", credit="",
            rig={"roll": "it rolls 0.39 m toward its nose and each of the four wheels turns one whole turn on its axle (no slip)",
                 "gate": "the rear gate and its child-seat flap swing 55 degrees up into the basket about the gate's top hinge"})
