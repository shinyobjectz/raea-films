# garage/markings: the floor paint for a run of eight bays (20 m): white bay lines 0.1 m wide and 5 m long with a
# cross tick at each mouth, the bay numbers 61 to 68 stencilled at the mouths to be read from the aisle, two one-way
# arrows in the aisle, a yellow hatched KEEP CLEAR box over the last bay, a SLOW across the aisle, and three oil
# stains where engines stand. All lie 2 to 3 mm proud of the floor. The origin is the middle of the row's back line
# (the wall's foot); the bays run out toward -y. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

random.seed(7)
col, root = comp.fresh("markings")
M = L.maker(col, root)
white = comp.mat("markings_white", (0.8, 0.8, 0.76), rough=0.7)
yellow = comp.mat("markings_yellow", (0.85, 0.6, 0.04), rough=0.7)
oil = comp.mat("markings_oil", (0.012, 0.01, 0.008), rough=0.22, alpha=0.78)
Z, BAY, LEN, N = 0.002, 2.5, 5.0, 8
X0 = -N * BAY / 2
P = lambda w, d, x, y: comp.box((w, d, 0.0012), at=(x, y, Z))
lines = []
for k in range(N + 1):
    x = X0 + k * BAY + (0.05 if k == 0 else -0.05 if k == N else 0)
    lines.append(P(0.1, LEN, x, -LEN / 2 - 0.05))
    lines.append(P(0.5 if 0 < k < N else 0.3, 0.1, x + (0.1 if k == 0 else -0.1 if k == N else 0), -LEN - 0.05))
M("markings_lines", comp.merge(*lines), white)
nums = [xf(L.floor_text(str(61 + k), 0.5, 0.0012), T(X0 + (k + 0.5) * BAY, -LEN - 0.55, Z)) for k in range(N - 1)]
M("markings_numbers", comp.merge(*nums), white)
def arrow(x, y, turn):
    a = L.plate([(-0.9, -0.08), (0.3, -0.08), (0.3, -0.28), (0.9, 0), (0.3, 0.28), (0.3, 0.08), (-0.9, 0.08)], 0.0012)
    return xf(a, T(x, y, Z) @ R(turn, "Z"))
M("markings_arrows", comp.merge(arrow(-5.5, -8.3, 0), arrow(4.0, -8.3, 0)), white)
M("markings_slow", xf(L.floor_text("SLOW", 0.9, 0.0012), T(-0.8, -8.3, Z) @ S(0.8, 1.6, 1)), white)
# the hatched box over the last bay
bx0, bx1, by0, by1 = X0 + 7 * BAY + 0.12, X0 + 8 * BAY - 0.17, -LEN + 0.1, -0.2
hatch = [P(0.08, by1 - by0, bx0, (by0 + by1) / 2), P(0.08, by1 - by0, bx1, (by0 + by1) / 2), P(bx1 - bx0, 0.08, (bx0 + bx1) / 2, by0), P(bx1 - bx0, 0.08, (bx0 + bx1) / 2, by1)]
a, b = L.stripes(bx1 - bx0 - 0.1, by1 - by0 - 0.1, 22, t=0, lean=0.45)
b.free()
xf(a, R(-90, "X"))            # the panel lies down
xf(a, T((bx0 + bx1) / 2, (by0 + by1) / 2, Z + 0.0006))
for f in a.faces:
    if f.normal.z < 0:
        f.normal_flip()
M("markings_keep_clear", comp.merge(*hatch, a), yellow)
M("markings_keep_clear_text", xf(L.floor_text("KEEP CLEAR", 0.34, 0.0012), T((bx0 + bx1) / 2, -LEN - 0.45, Z)), yellow)
def blot(cx, cy, r, seed):
    rs = random.Random(seed)
    ph = [rs.uniform(0, 6.28) for _ in range(4)]
    out = []
    for k in range(40):
        t = 2 * math.pi * k / 40
        rr = r * (1 + 0.22 * math.sin(2 * t + ph[0]) + 0.16 * math.sin(3 * t + ph[1]) + 0.1 * math.sin(5 * t + ph[2]) + 0.06 * math.sin(9 * t + ph[3]))
        out.append((cx + rr * math.cos(t), cy + rr * 0.8 * math.sin(t)))
    return L.plate(out, 0.0, at=(0, 0, Z + 0.0012))
M("markings_oil_stains", comp.merge(blot(X0 + 1.5 * BAY, -1.6, 0.28, 1), blot(X0 + 3.5 * BAY + 0.1, -1.9, 0.36, 2), blot(X0 + 3.5 * BAY - 0.2, -1.4, 0.14, 5), blot(X0 + 5.5 * BAY, -1.5, 0.22, 3)), oil)
L.look(col, "markings", eye=(3, -16, 9), target=(0, -4, 0), lens=28)
comp.export(col, root, "garage", "markings", made="blender/components/garage/markings.py", source="own geometry", license="ours", credit="", rig={},
            notes="Origin at the middle of the row's back line; the bays run 5 m toward -y, the aisle's arrows 8.3 m out.")
