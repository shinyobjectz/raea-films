# sea/gulls: a loose flock of seven herring gulls, 1.35 m across the wings, modelled by hand: a white body and head, a
# yellow bill with its red spot, a fanned tail, tucked feet, and each wing in two parts (arm and hand) so it can flap,
# grey above with black tips. They are spread over 16 m, heading +x, each at its own height, bank and point in its
# wingbeat. Its origin is the flock's middle. Rig: "fly" takes every flapping bird's wings through one stroke (those
# that start with wings up end with them down and the other way; two glide and only trim); "glide" carries the flock
# 14 m forward and 1.2 m up.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

random.seed(11)
col, root = comp.fresh("gulls")
M = _lib.maker(col, root)
white = comp.mat("gull_white", (0.86, 0.86, 0.84), rough=0.7)
grey = comp.mat("gull_grey", (0.42, 0.45, 0.5), rough=0.7)
black = comp.mat("gull_black", (0.03, 0.03, 0.035), rough=0.7)
bill = comp.mat("gull_bill", (0.85, 0.62, 0.1), rough=0.5)
spot = comp.mat("gull_bill_spot", (0.7, 0.08, 0.05), rough=0.5)
pink = comp.mat("gull_feet", (0.75, 0.5, 0.45), rough=0.6)

def body():
    prof = [(0.0, -0.21), (0.02, -0.2), (0.045, -0.13), (0.066, -0.04), (0.07, 0.03), (0.062, 0.1), (0.046, 0.15), (0.036, 0.19), (0.04, 0.22), (0.038, 0.245), (0.022, 0.268), (0.0, 0.275)]
    b = _lib.turn(prof, seg=14)
    xf(b, R(90, "Y"))            # its length along +x, head forward
    xf(b, S(1, 1, 0.92))
    return b
def wing_part(span, c0, c1, sweep, side, seg=5):
    """a wing panel from its root (at the origin) out along side*y: chord c0 to c1, the tip swept back by """
    bm = bmesh.new()
    rows = []
    for i in range(seg + 1):
        t = i / seg
        c = c0 + (c1 - c0) * t
        y = side * span * t
        x0 = 0.04 - sweep * t
        rows.append([bm.verts.new((x0 - c * u, y, 0.012 * math.sin(math.pi * u) * (1 - 0.5 * t))) for u in (0, 0.33, 0.66, 1.0)])
    for i in range(seg):
        for j in range(3):
            q = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]]
            bm.faces.new(q if side > 0 else q[::-1])
    return bm
glide_p = comp.pivot(col, root, "gulls_glide", (0, 0, 0))
# (x, y, z, heading, bank, wings-up angle at rest, at full)   a glider keeps near 6 degrees
BIRDS = [(0, 0, 0, 0, 4, 34, -26), (-3.5, 2.5, 0.9, 6, -8, -24, 32), (3.2, -2.0, -0.7, -5, 6, 8, 3), (-6.5, -1.5, 1.6, 10, 10, 20, -28), (6.8, 2.8, 0.5, -8, -5, -18, 30), (-1.5, -4.0, 2.2, 3, -12, 5, 9), (1.8, 4.5, -1.2, -12, 14, 30, -20)]
keys, gk = [], []
for n, (x, y, z, head, bank, up0, up1) in enumerate(BIRDS):
    i = n + 1
    bp = comp.pivot(col, root, f"gull_{i}", (x, y, z), parent=glide_p)
    bp.rotation_euler = (math.radians(bank), math.radians(-3), math.radians(head))
    bpy.context.view_layer.update()
    mw = bp.matrix_world.copy()
    def put(name, bm, m, parent=bp):
        xf(bm, mw if parent is bp else parent.matrix_world)
        return M(name, bm, m, parent=parent, smooth=True)
    put(f"gull_{i}_body", body(), white)
    put(f"gull_{i}_bill", comp.merge(xf(comp.cyl(0.013, 0.05, seg=8, r2=0.004, axis="X"), T(0.265, 0, -0.004))), bill)
    put(f"gull_{i}_bill_spot", _lib.sphere(0.006, at=(0.3, 0, -0.011), u=6, v=4), spot)
    put(f"gull_{i}_eyes", comp.merge(_lib.sphere(0.006, at=(0.235, 0.03, 0.012), u=6, v=4), _lib.sphere(0.006, at=(0.235, -0.03, 0.012), u=6, v=4)), black)
    tail = bmesh.new()
    tv = [tail.verts.new(p) for p in [(-0.17, 0.0, 0.005), (-0.33, -0.075, 0.0), (-0.35, -0.03, 0.002), (-0.355, 0.03, 0.002), (-0.33, 0.075, 0.0)]]
    tail.faces.new(tv)
    to = put(f"gull_{i}_tail", tail, white)
    comp.solidify(to, 0.008)
    put(f"gull_{i}_feet", comp.merge(xf(comp.cyl(0.006, 0.09, seg=6, axis="X"), T(-0.2, 0.018, -0.052)), xf(comp.cyl(0.006, 0.09, seg=6, axis="X"), T(-0.2, -0.018, -0.052))), pink)
    for side, sn in ((1, "l"), (-1, "r")):
        # the shoulder and the wrist turn about the bird's own length, so they take the bird's heading and bank
        sh = comp.pivot(col, root, f"gull_{i}_wing_{sn}", (0, 0, 0), parent=bp)
        sh.matrix_world = mw @ T(0.05, side * 0.05, 0.035)
        bpy.context.view_layer.update()
        arm = put(f"gull_{i}_arm_{sn}", wing_part(0.27, 0.17, 0.155, 0.01, side), grey, parent=sh)
        comp.solidify(arm, 0.012)
        wr = comp.pivot(col, root, f"gull_{i}_hand_{sn}_pivot", (0, 0, 0), parent=sh)
        wr.matrix_world = sh.matrix_world @ T(-0.01, side * 0.27, 0)
        bpy.context.view_layer.update()
        hand = wing_part(0.36, 0.155, 0.03, 0.12, side, seg=6)
        for f in hand.faces:
            f.material_index = 1 if abs(f.calc_center_median().y) > 0.22 else 0
        xf(hand, wr.matrix_world)
        ho = comp.mesh(col, root, f"gull_{i}_hand_{sn}", hand, [grey, black], parent=wr, smooth=True)
        comp.solidify(ho, 0.009)
        a0, a1 = math.radians(up0) * side, math.radians(up1) * side
        # the hand trails the arm: drooped while the wing is up, lifted on the way down
        h0, h1 = -0.45 * a0, -0.45 * a1
        bx, hx = sh.rotation_euler[0], wr.rotation_euler[0]
        keys += [(sh, "rotation_euler", 0, bx + a0, bx + a1), (wr, "rotation_euler", 0, hx + h0, hx + h1)]
bpy.context.view_layer.update()
_lib.channel("fly", keys)
_lib.channel("glide", [(glide_p, "location", 0, 0.0, 14.0), (glide_p, "location", 2, 0.0, 1.2)])
comp.export(col, root, "sea", "gulls", made="blender/components/sea/gulls.py", source="own geometry (seven generic gulls)", license="ours", credit="",
            rig={"fly": "one wing stroke for each of the five flapping birds (wings up to wings down, or down to up: run it there and back for a beat); the two gliders trim a few degrees",
                 "glide": "the flock moves 14 m along its heading (+x) and climbs 1.2 m"})
