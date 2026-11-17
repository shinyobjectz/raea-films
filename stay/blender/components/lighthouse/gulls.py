# lighthouse/gulls: three herring gulls on the wind off the cliff, modelled by hand: each a white body tapering to a
# fanned tail, a head with a yellow bill and dark eyes, tucked feet, and two grey wings 1.35 m tip to tip, each in two
# parts (the arm and the black-tipped hand) on its own joints. They hang in a loose group 7 m wide; the origin is the
# leading bird's body, so the Model's position is where it flies. Rig: "flap" takes every wing from the top of its
# stroke to the bottom (the arm 55 degrees, the hand folding 25 more), each bird a little out of step.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, sphere
from mathutils import Vector

col, root = comp.fresh("gulls")
white = comp.mat("gull_white", (0.86, 0.86, 0.84), rough=0.7)
grey = comp.mat("gull_grey", (0.38, 0.41, 0.45), rough=0.7)
black = comp.mat("gull_black", (0.02, 0.02, 0.022), rough=0.6)
yellow = comp.mat("gull_bill", (0.85, 0.6, 0.08), rough=0.5)
M = _lib.maker(col, root)


def wing_part(span, c0, c1, sweep, side, tip=False):
    """A cambered wing panel from the joint outward along side*x: chord c0 at the joint to c1, its leading edge swept."""
    bm = bmesh.new()
    n, m = 6, 5
    rows = []
    for i in range(n + 1):
        u = i / n
        ch = c0 + (c1 - c0) * u if not tip else c0 * (1 - u ** 2.2) + 0.015
        row_t, row_b = [], []
        for j in range(m + 1):
            w = j / m
            x = side * span * u
            y = -sweep * u - ch * 0.3 + ch * w          # leading edge forward (-y)
            th = 0.022 * (1 - u * 0.6) * math.sin(math.pi * (w * 0.9 + 0.05))
            cam = 0.03 * ch / 0.2 * math.sin(math.pi * w) * 0.5
            row_t.append(bm.verts.new((x, y, cam + th / 2)))
            row_b.append(bm.verts.new((x, y, cam - th / 2)))
        rows.append((row_t, row_b))
    for i in range(n):
        for j in range(m):
            bm.faces.new((rows[i][0][j], rows[i][0][j + 1], rows[i + 1][0][j + 1], rows[i + 1][0][j]))
            bm.faces.new((rows[i][1][j], rows[i + 1][1][j], rows[i + 1][1][j + 1], rows[i][1][j + 1]))
        for j in (0, m):
            bm.faces.new((rows[i][0][j], rows[i + 1][0][j], rows[i + 1][1][j], rows[i][1][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


keys = []
for g, (gx, gy, gz, yaw, size, phase) in enumerate(((0, 0, 0, 20, 1.0, 0.0), (3.4, 1.8, 1.1, -10, 0.93, 0.25), (-3.2, 2.6, -0.7, 35, 1.05, 0.5))):
    bird = comp.pivot(col, root, f"gulls_bird_{g + 1}", (gx, gy, gz))
    bird.rotation_euler[2] = math.radians(yaw)
    bird.scale = (size, size, size)
    bpy.context.view_layer.update()
    mw = bird.matrix_world.copy()

    def put(bm):
        return xf(bm, mw)

    body = lathe([(0.0, -0.3), (0.035, -0.27), (0.07, -0.18), (0.085, -0.05), (0.08, 0.08), (0.055, 0.2), (0.03, 0.28), (0.0, 0.3)], seg=18)
    xf(body, R(90, "X"))                                    # the head end to -y
    for v in body.verts:
        v.co.z *= 0.9
    head = sphere(0.055, (0, -0.31, 0.03), u=14, v=10, squash=(0.9, 1.15, 0.9))
    tail = bmesh.new()
    tv = [tail.verts.new(p) for p in ((-0.03, 0.24, 0.012), (0.03, 0.24, 0.012), (0.09, 0.44, 0.004), (-0.09, 0.44, 0.004), (-0.03, 0.24, -0.008), (0.03, 0.24, -0.008), (0.09, 0.44, -0.004), (-0.09, 0.44, -0.004))]
    for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        tail.faces.new([tv[i] for i in q])
    M(f"gulls_body_{g + 1}", put(comp.merge(body, head, tail)), white, parent=bird, smooth=True)
    bill = lathe([(0.018, 0.0), (0.014, 0.04), (0.0, 0.075)], seg=8)
    xf(bill, R(90, "X")); xf(bill, T(0, -0.355, 0.022))
    M(f"gulls_bill_{g + 1}", put(bill), yellow, parent=bird, smooth=True)
    M(f"gulls_eyes_{g + 1}", put(comp.merge(sphere(0.009, (-0.04, -0.335, 0.045), u=8, v=6), sphere(0.009, (0.04, -0.335, 0.045), u=8, v=6),
                                              comp.box((0.025, 0.07, 0.012), at=(-0.025, 0.1, -0.075)), comp.box((0.025, 0.07, 0.012), at=(0.025, 0.1, -0.075)))), black, parent=bird)
    for side, name in ((-1, "l"), (1, "r")):
        sh = comp.pivot(col, root, f"gulls_wing_{name}_{g + 1}", mw @ Vector((side * 0.06, -0.06, 0.04)), parent=bird)
        sh.rotation_euler[2] = math.radians(yaw)
        bpy.context.view_layer.update()
        arm = wing_part(0.3, 0.2, 0.17, 0.02, side)
        xf(arm, T(side * 0.06, -0.06, 0.04))
        M(f"gulls_arm_{name}_{g + 1}", put(arm), grey, parent=sh, smooth=True)
        el = comp.pivot(col, root, f"gulls_hand_joint_{name}_{g + 1}", mw @ Vector((side * 0.36, -0.08, 0.04)), parent=sh)
        el.rotation_euler[2] = math.radians(yaw)
        bpy.context.view_layer.update()
        hand = wing_part(0.34, 0.17, 0.03, 0.1, side, tip=True)
        xf(hand, T(side * 0.36, -0.08, 0.04))
        ho = M(f"gulls_hand_{name}_{g + 1}", put(hand), [grey, black], parent=el, smooth=True)
        lim = (mw @ Vector((side * 0.6, 0, 0)) - mw @ Vector((0, 0, 0))).length
        cx = mw @ Vector((0, 0, 0))
        _lib.paint_by(ho, lambda n, p: 1 if (ho.matrix_world @ p - cx).length > lim else 0)
        # the stroke: up at rest, down at full; a bird out of step starts part-way down
        up, down = math.radians(28 - 40 * phase), math.radians(-27 + 40 * phase)
        keys += [(sh, "rotation_euler", 1, -side * up, -side * down), (el, "rotation_euler", 1, -side * math.radians(-8), -side * math.radians(-25 if phase < 0.4 else 12))]

comp.channel("flap", keys)
comp.export(col, root, "lighthouse", "gulls", made="blender/components/lighthouse/gulls.py", source="own geometry (three generic gulls)", license="ours", credit="",
            rig={"flap": "every wing from the top of its stroke to the bottom: the arm about the shoulder, the hand folding at the wrist, the three birds out of step",
                 "position": "the Model's own position in the scene (where the group flies)"},
            notes="origin: the leading bird's body; they face -y (the camera), each turned a little")
