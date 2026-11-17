# pixel/door: the pixel world's door (v3/pixel.tsx; the director, 11-11: "maybe one could be a pixel art gaussian splat world").
# A round-topped door standing on its own in the meadow at sunset, as a door to somewhere in an old game would: an arch
# of dressed stone on stacked stone jambs, a keystone at its crown, and in it a door of six boards cut to the arch, with
# two ledges and a brace on the face toward us, black iron strap hinges and a ring pull, on a flat stone step. Plain
# colours: the scene's pass draws the frame in big pixels and snaps every colour to the world's palette.
# The opening is sky/door's (half-width 0.45, 2.05 high to the arch's crown), the origin the step's middle at the
# opening's foot, the door facing -y (toward the lens). It opens toward us: rig "open", the leaf swinging out 100 degrees
# on its left side.
import os, sys, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Matrix

OW, OH = 0.45, 2.05                 # the opening's half-width and height (to the crown)
SH = OH - OW                        # where the arch springs from the jambs
SD = 0.24                           # the stones' depth
LT = 0.05                           # the leaf's thickness (boards and ledges)
GAP = 0.005
HX, HY = -OW + GAP, -LT / 2         # the hinge's line: the leaf's front face at its left edge
KNOB = (OW - 0.11, -LT / 2 - 0.05, 0.98)

STONE = [comp.mat("pixel_door_stone_a", (0.47, 0.46, 0.53), rough=0.9), comp.mat("pixel_door_stone_b", (0.38, 0.37, 0.45), rough=0.9)]
KEY = comp.mat("pixel_door_key", (0.55, 0.53, 0.6), rough=0.85)
BOARD = [comp.mat("pixel_door_board_a", (0.62, 0.34, 0.14), rough=0.8), comp.mat("pixel_door_board_b", (0.5, 0.25, 0.1), rough=0.8)]
LEDGE = comp.mat("pixel_door_ledge", (0.2, 0.09, 0.04), rough=0.8)
IRON = comp.mat("pixel_door_iron", (0.04, 0.04, 0.045), rough=0.5, metal=0.8)

col, root = comp.fresh("pixel_door")


def prism(pts, y0, y1):
    """a solid from a convex outline in the x-z plane, from y0 to y1"""
    b = bmesh.new()
    lo = [b.verts.new((x, y0, z)) for x, z in pts]
    hi = [b.verts.new((x, y1, z)) for x, z in pts]
    b.faces.new(lo)
    b.faces.new(list(reversed(hi)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        b.faces.new([lo[i], lo[j], hi[j], hi[i]])
    bmesh.ops.recalc_face_normals(b, faces=b.faces)
    return b


def jit(k, s):
    return s * (math.sin(k * 12.9898 + 4.1) * 43758.5453 % 1.0 - 0.5)


# ---- the jambs: blocks stacked to the springing, long and short in turn
stones = [[], []]
for side in (-1, 1):
    z, k = 0.0, 0
    for h in (0.34, 0.3, 0.36, 0.3, SH - 1.3):
        w = 0.27 if k % 2 == 0 else 0.2
        x0 = OW + 0.006
        b = comp.box((w, SD + jit(k * 7 + side, 0.03), h - 0.012), (side * (x0 + w / 2), jit(k * 3 + side, 0.012), z + h / 2))
        stones[(k + (side > 0)) % 2].append(b)
        z += h
        k += 1
# ---- the arch: nine stones round from springing to springing, the keystone at the crown standing proud and longer
N = 9
for i in range(N):
    a0, a1 = math.pi * i / N + 0.008, math.pi * (i + 1) / N - 0.008
    key = i == N // 2
    r0, r1 = OW, OW + (0.27 if key else 0.21 + jit(i, 0.03))
    pts = [(r0 * math.cos(a), SH + r0 * math.sin(a)) for a in (a1, a0)] + [(r1 * math.cos(a), SH + r1 * math.sin(a)) for a in (a0, a1)]
    pts = [(-x, z) for x, z in pts]                   # (round the other way, so the outline runs convex)
    b = prism(pts, -SD / 2 - (0.025 if key else 0.0), SD / 2)
    if key:
        o = comp.mesh(col, root, "door_keystone", b, KEY)
    else:
        stones[i % 2].append(b)
for k in (0, 1):
    o = comp.mesh(col, root, f"door_stones_{k}", comp.merge(*stones[k]), STONE[k])
    comp.bevel(o, 0.012, 1)
o = comp.mesh(col, root, "door_step", comp.box((2 * OW + 0.7, 0.6, 0.08), (0.02, -0.12, -0.04)), STONE[1])
comp.bevel(o, 0.025, 2)

# ---- the leaf on its hinge: six boards cut to the arch, two ledges and a brace on the face toward us
hinge = comp.pivot(col, root, "door_hinge", (HX, HY, 0.0))


def on_hinge(bm):
    """a part built in the hinge's frame, put where it stands (comp keeps a part's world place when it hangs it)"""
    bmesh.ops.translate(bm, vec=(HX, HY, 0.0), verts=bm.verts)
    return bm


LW = 2 * OW - 2 * GAP
BW = LW / 6
R_IN = OW - GAP


def top(x):
    """the leaf's top at x (the hinge's frame): the arch less the gap"""
    X = x + HX
    return SH + math.sqrt(max(0.0, R_IN * R_IN - X * X))


for k in range(6):
    xa, xb = GAP + BW * k + 0.006, GAP + BW * (k + 1) - 0.006
    tops = [(xb - (xb - xa) * i / 5, top(xb - (xb - xa) * i / 5)) for i in range(6)]
    b = prism([(xa, 0.01), (xb, 0.01)] + tops, 0.011, LT)
    comp.mesh(col, root, f"door_board_{k}", on_hinge(b), BOARD[k % 2], parent=hinge)
L1, L2 = 0.3, 1.36
led = [comp.box((LW - 0.06, 0.022, 0.12), (GAP + LW / 2, 0.011, z)) for z in (L1, L2)]
b = comp.box((math.hypot(LW - 0.16, L2 - L1 - 0.12), 0.022, 0.1), (GAP + LW / 2, 0.011, (L1 + L2) / 2))
bmesh.ops.rotate(b, verts=b.verts, cent=(GAP + LW / 2, 0.011, (L1 + L2) / 2), matrix=Matrix.Rotation(-math.atan2(L2 - L1 - 0.12, LW - 0.16), 3, "Y"))
led.append(b)
o = comp.mesh(col, root, "door_ledges", on_hinge(comp.merge(*led)), LEDGE, parent=hinge)

# ---- iron: two strap hinges along the ledges, their knuckles, the ring pull and its plate
kx = KNOB[0] - HX
ir = []
for z in (L1, L2):
    ir.append(comp.box((0.52, 0.008, 0.045), (0.26, -0.004, z)))
    ir.append(comp.cyl(0.032, 0.008, at=(0.52, -0.004, z), seg=12, axis="Y"))
ir.append(comp.cyl(0.042, 0.006, at=(kx, -0.003, KNOB[2]), seg=16, axis="Y"))
ir.append(comp.cyl(0.008, 0.03, at=(kx, -0.018, KNOB[2]), seg=8, axis="Y"))
ir += [comp.box((0.016, 0.012, 0.016), (kx + 0.045 * math.cos(2 * math.pi * i / 16), -0.03, KNOB[2] - 0.05 + 0.045 * math.sin(2 * math.pi * i / 16))) for i in range(16)]
o = comp.mesh(col, root, "door_iron", on_hinge(comp.merge(*ir)), IRON, parent=hinge)
kn = [comp.cyl(0.014, 0.1, at=(0.0, -0.004, z), seg=10) for z in (L1, L2)]
o = comp.mesh(col, root, "door_knuckles", on_hinge(comp.merge(*kn)), IRON, parent=hinge, smooth=True)

comp.channel("open", [(hinge, "rotation_euler", 2, 0.0, -math.radians(100))])

comp.export(col, root, "pixel", "door", made="blender/components/pixel/door.py", source="own geometry", license="ours", credit="",
            rig={"open": "the leaf (door_hinge) swings out 100 degrees toward the lens on its left side"},
            notes=json.dumps({"hinge": [HX, HY, 0.0], "knob": [KNOB[0], KNOB[1], KNOB[2] - 0.05], "opening": {"half_width": OW, "sill": 0.0, "top": OH}, "face_y": -SD / 2}))
