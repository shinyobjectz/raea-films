# diner/stool: a counter stool bolted to the floor, modelled by hand: a chrome floor flange on four bolts, a trumpet
# column, a foot ring on three spokes, the swivel bearing, and a round seat: a steel pan, a ribbed chrome band, a red
# vinyl cushion with white piping, a covered button, and a strip of silver tape over an old split (so its turn reads).
# Seat 0.76 m up, 36 cm across. Rig: "spin" turns the seat one whole turn about the column (the cursor's flick);
# "wobble" rocks the seat 3 degrees on its worn bearing.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, torus, rod, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("stool")
M = _lib.maker(col, root)
chrome = comp.mat("stool_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
steel = comp.mat("stool_steel", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
vinyl = _lib.ph_plain("stool_vinyl", "leather_red_03", (0.3, 0.006, 0.01))
piping = comp.mat("stool_piping", (0.85, 0.83, 0.78), rough=0.45)
tape = comp.mat("stool_tape", (0.62, 0.63, 0.65), rough=0.35, metal=0.6)

M("stool_flange", lathe([(0, 0), (0.115, 0), (0.115, 0.005), (0.105, 0.011), (0.06, 0.02), (0.047, 0.032), (0.047, 0.04), (0, 0.04)], seg=48), chrome)
M("stool_bolts", comp.merge(*[comp.cyl(0.009, 0.008, at=(0.088 * math.cos(a), 0.088 * math.sin(a), 0.009), seg=6) for a in (math.radians(45 + 90 * i) for i in range(4))]), steel, smooth=False)
M("stool_column", lathe([(0.046, 0.03), (0.04, 0.07), (0.034, 0.14), (0.031, 0.26), (0.03, 0.62), (0, 0.62)], seg=40), chrome)
RING_Z, RING_R = 0.27, 0.2
M("stool_foot_ring", torus(RING_R, 0.011, seg=64, sides=10, at=(0, 0, RING_Z)), chrome)
M("stool_spokes", comp.merge(*[rod((0.028 * math.cos(a), 0.028 * math.sin(a), RING_Z + 0.05), (RING_R * math.cos(a), RING_R * math.sin(a), RING_Z), 0.008) for a in (math.radians(90 + 120 * i) for i in range(3))],
                             lathe([(0.031, RING_Z + 0.03), (0.04, RING_Z + 0.035), (0.04, RING_Z + 0.065), (0.031, RING_Z + 0.07)], seg=32)), chrome)
M("stool_bearing", lathe([(0.03, 0.6), (0.05, 0.605), (0.05, 0.64), (0.03, 0.645)], seg=40), steel)

SZ = 0.66
seat = comp.pivot(col, root, "stool_seat", (0, 0, SZ))
M("stool_pan", lathe([(0, SZ - 0.015), (0.06, SZ - 0.015), (0.15, SZ), (0.176, SZ + 0.02), (0.176, SZ + 0.03), (0, SZ + 0.03)], seg=64), steel, parent=seat)
# the band: chrome, ribbed round
band = [(0.178, SZ + 0.018)]
for i in range(5):
    z = SZ + 0.022 + i * 0.011
    band += [(0.1815, z), (0.1835, z + 0.004), (0.1815, z + 0.008)]
band += [(0.178, SZ + 0.078)]
M("stool_band", lathe(band, seg=64), chrome, parent=seat)
cush = [(0.179, SZ + 0.07), (0.1795, SZ + 0.082), (0.176, SZ + 0.097), (0.165, SZ + 0.108), (0.14, SZ + 0.114), (0.09, SZ + 0.118), (0.04, SZ + 0.1195), (0.012, SZ + 0.118), (0, SZ + 0.1165)]
c = M("stool_cushion", lathe(cush, seg=64), vinyl, parent=seat)
comp.uv_box(c, 0.3)
M("stool_piping", torus(0.1795, 0.004, seg=64, sides=8, at=(0, 0, SZ + 0.08)), piping, parent=seat)
bt = M("stool_button", lathe([(0.012, SZ + 0.117), (0.011, SZ + 0.1205), (0.006, SZ + 0.1225), (0, SZ + 0.123)], seg=20), vinyl, parent=seat)
comp.uv_box(bt, 0.3)  # a textured material on a part with no UVs exports texCoord -1, which raea refuses


def top(r):
    for (r0, z0), (r1, z1) in zip(cush[::-1], cush[::-1][1:]):
        if r0 <= r <= r1:
            return z0 + (z1 - z0) * (r - r0) / max(1e-9, r1 - r0)
    return cush[0][1]


tp = bmesh.new()
bmesh.ops.create_grid(tp, x_segments=5, y_segments=14, size=0.5)
xf(tp, S(0.048, 0.2, 1))
xf(tp, R(22, "Z"))
xf(tp, T(0.085, -0.02, 0))
for v in tp.verts:
    v.co.z = top(math.hypot(v.co.x, v.co.y)) + 0.0012
M("stool_tape", tp, tape, parent=seat)

comp.channel("spin", [(seat, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("wobble", [(seat, "rotation_euler", 0, 0, math.radians(3))])
comp.export(col, root, "diner", "stool", made="blender/components/diner/stool.py",
            source="own geometry (a generic floor-mounted counter stool); vinyl: https://polyhaven.com/a/leather_red_03", license="ours; texture CC0", credit="Poly Haven (leather_red_03)",
            rig={"spin": "the seat (pan, band, cushion, its tape) one whole turn about the column: the cursor's flick, and the BR circle",
                 "wobble": "the seat tips 3 degrees on its bearing"})
