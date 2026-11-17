# bedroom/lamp: the bent-necked desk lamp, modelled by hand: a weighted round base in red enamel with a rocker
# switch, a ribbed chrome gooseneck bent over in an arc, a red cone shade with a white inside and vent holes, and the
# bulb in it (lamp_bulb). 0.30 m high, reaching 0.26 m forward. Rig: "on" is the scene's: lamp_bulb's glow and a
# spot light at the shade (night in the second bedroom shot); "nod" tips the shade 35 degrees about the neck's end;
# "switch" rocks the switch.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy
from comp import T, R, xf
from mathutils import Vector
col, root = comp.fresh("lamp")
M = _lib.maker(col, root)
red = comp.mat("lamp_enamel", (0.42, 0.015, 0.012), rough=0.28)
white = comp.mat("lamp_inside", (0.92, 0.92, 0.88), rough=0.5)
chrome = comp.mat("lamp_chrome", (0.86, 0.86, 0.88), rough=0.12, metal=1.0)
bulb = comp.mat("lamp_bulb", (1.0, 0.95, 0.85), rough=0.3, emit=(1.0, 0.82, 0.55), strength=0.4)
black = comp.mat("lamp_black", (0.02, 0.02, 0.02), rough=0.5)
base = [(0.0, 0.0), (0.078, 0.0), (0.082, 0.004), (0.08, 0.018), (0.06, 0.03), (0.03, 0.036), (0.016, 0.04), (0.014, 0.05), (0.0, 0.05)]
M("lamp_base", _lib.turn(base, seg=40), red, smooth=True)
sw = comp.pivot(col, root, "lamp_switch", (0.045, -0.02, 0.028))
so = M("lamp_switch_rocker", xf(comp.box((0.012, 0.022, 0.008)), T(0.045, -0.02, 0.031) @ R(12, "X")), black, parent=sw)
comp.bevel(so, 0.002, 2)
# the gooseneck: up from the base, over and forward (toward -y)
pts, ribs = [], []
N = 40
RISE, BEND = 0.2, 0.085       # straight up 15 cm from the base, then over in an arc of 8.5 cm radius, 140 degrees round
for i in range(N + 1):
    t = i / N
    if t < 0.4:
        pts.append((0, 0, 0.05 + (RISE - 0.05) * t / 0.4))
    else:
        a = math.radians(140 * (t - 0.4) / 0.6)
        pts.append((0, -BEND + BEND * math.cos(a), RISE + BEND * math.sin(a)))
M("lamp_neck", comp.tube(pts, 0.0065, res=6, sides=4), chrome, smooth=True)
for i in range(2, N * 2 - 1):
    t = i / (N * 2)
    k = t * N
    a, b = pts[int(k)], pts[min(N, int(k) + 1)]
    p = Vector(a).lerp(Vector(b), k - int(k))
    d = (Vector(b) - Vector(a)).normalized()
    r = comp.cyl(0.0082, 0.0028, seg=10)
    xf(r, d.to_track_quat("Z", "Y").to_matrix().to_4x4()); xf(r, T(*p))
    ribs.append(r)
M("lamp_neck_ribs", comp.merge(*ribs), chrome, smooth=True)
end, prev = Vector(pts[-1]), Vector(pts[-3])
d = (end - prev).normalized()
head = comp.pivot(col, root, "lamp_head", tuple(end))
Q = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
shade = [(0.016, 0.0), (0.02, 0.03), (0.03, 0.05), (0.075, 0.14), (0.078, 0.142), (0.073, 0.14), (0.028, 0.052), (0.014, 0.03)]
sh = _lib.turn(shade, seg=36); xf(sh, Q); xf(sh, T(*end))
M("lamp_shade", sh, [red], parent=head, smooth=True)
ins = _lib.turn([(0.0745, 0.1395), (0.0285, 0.0515), (0.012, 0.03)], seg=36); xf(ins, Q); xf(ins, T(*end))
M("lamp_shade_inside", ins, white, parent=head, smooth=True)
cap = comp.merge(comp.cyl(0.018, 0.012, at=(0, 0, -0.008), seg=20), *[comp.cyl(0.003, 0.002, at=(0.024 * math.cos(i * math.pi / 3), 0.024 * math.sin(i * math.pi / 3), 0.04), seg=8) for i in range(6)])
xf(cap, Q); xf(cap, T(*end))
M("lamp_shade_cap", cap, black, parent=head)
bl = _lib.turn([(0.0, 0.03), (0.012, 0.032), (0.014, 0.055), (0.026, 0.085), (0.03, 0.105), (0.024, 0.124), (0.0, 0.132)], seg=24); xf(bl, Q); xf(bl, T(*end))
M("lamp_bulb", bl, bulb, parent=head, smooth=True)
M("lamp_lead", comp.tube([(0, 0.075, 0.012), (0, 0.1, 0.004), (0.04, 0.115, 0.004), (0.12, 0.11, 0.004)], 0.003), black, smooth=True)
comp.channel("nod", [(head, "rotation_euler", 0, 0, math.radians(-35))])
comp.channel("switch", [(sw, "rotation_euler", 0, 0, math.radians(-24))])
comp.export(col, root, _lib.PLACE, "lamp", made="blender/components/bedroom/lamp.py", source="own geometry (a generic gooseneck desk lamp)", license="ours", credit="",
            rig={"on": "in the scene: lamp_bulb's glow and a spot light under the shade", "nod": "the shade tips 35 degrees up about the end of the neck (lamp_head)", "switch": "the base's rocker switch rocks 24 degrees"})
