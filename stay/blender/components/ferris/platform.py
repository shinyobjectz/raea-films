# ferris/platform: the wheel's loading platform, 6 x 3 m and 0.5 m up, modelled by hand: a chequer-plate steel deck
# (Poly Haven's metal_plate) on a frame of channel and eight screw-jack legs, a red and cream boarded skirt round
# it, four open-tread steps up the front with stringers, tube handrails with a mid rail down both ends and beside
# the steps, an entry and an exit gate, and a yellow edge line where the gondolas pass. Origin: on the ground under
# the wheel's axle (it is centred there); its front toward -y. Rig: "gate" swings the entry gate 90 degrees inward.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("platform")
plate = comp.ph_texture("platform_plate", "metal_plate", tile=1.0, res="1k")
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.5)
yellow = comp.mat("platform_yellow", (0.85, 0.65, 0.05), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D, Z = 6.0, 3.0, 0.5
d = M("platform_deck", comp.box((W, D, 0.012), at=(0, 0, Z - 0.006)), plate)
comp.uv_box(d, 1.0)
frame = [comp.box((W, 0.06, 0.12), at=(0, s * (D / 2 - 0.03), Z - 0.072)) for s in (-1, 1)] + [comp.box((0.06, D, 0.12), at=(x, 0, Z - 0.072)) for x in (-3 + 0.03, -1.5, 0, 1.5, 3 - 0.03)]
for x in (-2.9, -1.0, 1.0, 2.9):
    for y in (-1.4, 1.4):
        frame += [comp.cyl(0.03, Z - 0.13, at=(x, y, 0), seg=8), comp.box((0.16, 0.16, 0.012), at=(x, y, 0.006)), comp.cyl(0.045, 0.05, at=(x, y, 0.12), seg=6)]
M("platform_frame", comp.merge(*frame), galv)
boards = {0: [], 1: []}
def skirt(p0, p1, skip=None):
    p0, p1 = Vector(p0), Vector(p1)
    n = int(round((p1 - p0).length / 0.2))
    for k in range(n):
        c = p0.lerp(p1, (k + 0.5) / n)
        if skip and skip(c):
            continue
        b = comp.box((0.19, 0.02, Z - 0.05) if abs(p1.x - p0.x) > 0.1 else (0.02, 0.19, Z - 0.05), at=(c.x, c.y, (Z - 0.05) / 2 + 0.02))
        boards[k % 2].append(b)
skirt((-W / 2, -D / 2, 0), (W / 2, -D / 2, 0), skip=lambda c: abs(c.x) < 0.9)
skirt((-W / 2, D / 2, 0), (W / 2, D / 2, 0))
skirt((-W / 2, -D / 2, 0), (-W / 2, D / 2, 0))
skirt((W / 2, -D / 2, 0), (W / 2, D / 2, 0))
M("platform_skirt_red", comp.merge(*boards[0]), red)
M("platform_skirt_cream", comp.merge(*boards[1]), cream)
M("platform_edge_line", comp.merge(comp.box((W - 0.2, 0.08, 0.002), at=(0, -0.95, Z + 0.001)), comp.box((W - 0.2, 0.08, 0.002), at=(0, 0.95, Z + 0.001))), yellow)
steps = []
for k in range(4):
    z = Z - (k + 1) * (Z / 5) * 1.0
    steps.append(comp.box((1.7, 0.27, 0.03), at=(0, -D / 2 - 0.14 - k * 0.27, z + 0.1 - 0.015)))
st = M("platform_steps", comp.merge(*steps), plate)
comp.uv_box(st, 1.0)
M("platform_stringers", comp.merge(*[comp.taper((sx * 0.87, -D / 2, Z - 0.02), (sx * 0.87, -D / 2 - 1.2, 0.1), 0.04, 0.04, 0.16, 0.16) for sx in (-1, 1)]), galv)
rails = []
def rail(pts, posts=True):
    for a, b in zip(pts, pts[1:]):
        a, b = Vector(a), Vector(b)
        rails.append(L.seg(a + Vector((0, 0, 1.05)), b + Vector((0, 0, 1.05)), 0.021, 8))
        rails.append(L.seg(a + Vector((0, 0, 0.55)), b + Vector((0, 0, 0.55)), 0.016, 8))
        n = max(1, int(round((b - a).length / 1.2)))
        for k in range(n + 1):
            p = a.lerp(b, k / n)
            rails.append(L.seg(p, p + Vector((0, 0, 1.05)), 0.021, 8))
rail([(-W / 2 + 0.05, -D / 2 + 0.05, Z), (-W / 2 + 0.05, D / 2 - 0.05, Z)])
rail([(W / 2 - 0.05, -D / 2 + 0.05, Z), (W / 2 - 0.05, D / 2 - 0.05, Z)])
rail([(-W / 2 + 0.05, -D / 2 + 0.05, Z), (-0.9, -D / 2 + 0.05, Z)])
rail([(0.9, -D / 2 + 0.05, Z), (W / 2 - 0.05, -D / 2 + 0.05, Z)])
for sx in (-1, 1):
    rails.append(L.seg((sx * 0.9, -D / 2 + 0.05, Z + 1.05), (sx * 0.9, -D / 2 - 1.15, 0.1 + 1.0), 0.021, 8))
    rails.append(L.seg((sx * 0.9, -D / 2 - 1.15, 0.0), (sx * 0.9, -D / 2 - 1.15, 1.1), 0.021, 8))
M("platform_rails", comp.merge(*rails), galv, None, True)
gp = comp.pivot(col, root, "platform_gate", (-0.9, -D / 2 + 0.05, Z))
gate = [L.seg((-0.9, -D / 2 + 0.05, Z + z), (0.0, -D / 2 + 0.05, Z + z), 0.018, 8) for z in (0.25, 0.95)] + [L.seg((x, -D / 2 + 0.05, Z + 0.25), (x, -D / 2 + 0.05, Z + 0.95), 0.012, 6) for x in (-0.75, -0.6, -0.45, -0.3, -0.15, 0.0)]
M("platform_gate_bars", comp.merge(*gate), red, gp, True)
M("platform_gate_exit", xf(comp.merge(*[L.seg((0.9, -D / 2 + 0.05, Z + z), (0.02, -D / 2 + 0.05, Z + z), 0.018, 8) for z in (0.25, 0.95)], *[L.seg((x, -D / 2 + 0.05, Z + 0.25), (x, -D / 2 + 0.05, Z + 0.95), 0.012, 6) for x in (0.75, 0.6, 0.45, 0.3, 0.15, 0.02)]), comp.Matrix.Identity(4)), red, None, True)
comp.channel("gate", [(gp, "rotation_euler", 2, 0, math.radians(90))])
comp.export(col, root, "ferris", "platform", made="blender/components/ferris/platform.py", source="own geometry; texture: https://polyhaven.com/a/metal_plate", license="ours; texture CC0", credit="Poly Haven (metal_plate)",
            rig={"gate": "the entry gate swings 90 degrees in over the deck"}, notes="origin: on the ground under the wheel's axle")
