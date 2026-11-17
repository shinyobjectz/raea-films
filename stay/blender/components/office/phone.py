# office/phone: a desk telephone, modelled by hand: a wedge body with a display, a 4 x 3 keypad and a column of line
# keys, a cradle with the handset in it (a part of its own), and its curled cord. Rig: "lift" raises the handset
# 12 cm off the cradle and tips it (answered); "ring" is the scene's (the line key's glow).
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("phone")
body_m = comp.mat("phone_body", (0.1, 0.1, 0.11), rough=0.45)
key_m = comp.mat("phone_keys", (0.75, 0.75, 0.73), rough=0.5)
lcd = comp.mat("phone_display", (0.35, 0.42, 0.32), rough=0.25)
led = comp.mat("phone_line", (0.6, 0.1, 0.05), rough=0.3, emit=(1.0, 0.2, 0.1), strength=1.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D = 0.2, 0.22
SLOPE = lambda y: 0.03 + 0.045 * (y + D / 2) / D
body = comp.box((W, D, 0.03), at=(0, 0, 0.015))
for v in body.verts:
    if v.co.z > 0.015:
        v.co.z = SLOPE(v.co.y)
b = M("phone_body", body, body_m)
comp.bevel(b, 0.005, 3)
tiltdeg = math.degrees(math.atan(0.045 / D))
def on(bm, x, y, lift=0.0):
    xf(bm, R(tiltdeg, "X")); xf(bm, T(x, y, SLOPE(y) + lift)); return bm
M("phone_display_mesh", on(comp.box((0.085, 0.03, 0.002)), 0.035, 0.075, 0.0005), lcd)
keys = [on(comp.box((0.016, 0.012, 0.004)), 0.01 + c * 0.022, 0.035 - r * 0.02, 0.002) for r in range(4) for c in range(3)]
M("phone_keys_mesh", comp.merge(*keys), key_m)
M("phone_line_keys", comp.merge(*[on(comp.box((0.012, 0.008, 0.003)), 0.085, 0.035 - r * 0.015, 0.0015) for r in range(5)]), key_m)
M("phone_line", on(comp.box((0.004, 0.004, 0.0034)), 0.073, 0.035, 0.0016), led)
hp = comp.pivot(col, root, "phone_handset", (-0.062, 0, SLOPE(0) + 0.02))
hs = comp.merge(comp.box((0.042, 0.2, 0.022), at=(-0.062, 0, SLOPE(0) + 0.034)), comp.box((0.05, 0.05, 0.03), at=(-0.062, 0.078, SLOPE(0) + 0.022)), comp.box((0.05, 0.05, 0.03), at=(-0.062, -0.078, SLOPE(0) + 0.022)))
xf(hs, T(0.062, 0, -SLOPE(0))); xf(hs, R(tiltdeg, "X")); xf(hs, T(-0.062, 0, SLOPE(0)))
h = M("phone_handset_mesh", hs, body_m, parent=hp)
comp.bevel(h, 0.007, 3)
comp.subsurf(h, 1)
# the curled cord: a helix from the handset's foot round to the body's side
pts = []
for k in range(121):
    u = k / 120
    c = Vector((-0.062 - 0.07 * math.sin(math.pi * u), -0.1 - 0.06 * math.sin(math.pi * u) * (1 - u) - 0.02 * u, 0.012 + 0.03 * (1 - u) * (1 - u)))
    a = u * 2 * math.pi * 30
    pts.append((c.x + 0.005 * math.cos(a), c.y, c.z + 0.005 * math.sin(a)))
M("phone_cord", comp.tube(pts, 0.0011, res=2, sides=1), body_m, smooth=True)
comp.channel("lift", [(hp, "location", 2, hp.location.z, hp.location.z + 0.12), (hp, "rotation_euler", 1, 0, math.radians(25))])
comp.export(col, root, "office", "phone", made="blender/components/office/phone.py", source="own geometry (a generic desk telephone)", license="ours", credit="",
            rig={"lift": "the handset rises 12 cm off the cradle and tips 25 degrees", "ring": "in the scene: the material phone_line glows"})
