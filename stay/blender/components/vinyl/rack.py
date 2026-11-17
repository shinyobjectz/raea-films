# vinyl/rack: a crate-digging browser bin, modelled by hand: a plywood unit 1.2 m wide and 0.62 deep, a sloped tray
# on top in three columns of LPs leaning back (about 100 sleeves in twelve inks, designs of our own on the ones that
# show), white divider cards with tabbed labels standing 4 cm proud of the sleeves (the hook's vertical line), a price
# strip on the lip, and a lower shelf of overstock spine out. Its front faces -y.
# Rig: "flip" tips the middle column's front seven sleeves forward onto the lip, front ones furthest (a hand flicking
# through); "divider" lifts the middle column's first divider card 12 cm.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("rack")
rng = random.Random(7)
ply = comp.ph_texture("rack_plywood", "plywood", tile=0.5, res="1k")
card = comp.mat("rack_divider", (0.9, 0.9, 0.87), rough=0.5)
ink = comp.mat("rack_ink", (0.04, 0.04, 0.04), rough=0.6)
strip = comp.mat("rack_price_strip", (0.93, 0.8, 0.2), rough=0.55)
INK = inks()
W, D = 1.2, 0.62
TRAY, LIP, BACK, TH = 0.72, 0.86, 1.0, 0.018

def P(name, size, at, bev=0.002):
    o = M(name, comp.box(size, at=at), ply)
    comp.uv_box(o, 1.0)
    comp.bevel(o, bev, 2)
    return o
for i, sx in enumerate((-1, 1)):
    # a side: full height at the back, cut down to the lip at the front
    bm = bmesh.new()
    x0, x1 = sx * (W / 2 - TH), sx * W / 2
    prof = [(-D / 2, 0), (D / 2, 0), (D / 2, BACK), (D / 2 - 0.1, BACK), (-D / 2, LIP)]
    a = [bm.verts.new((x0, y, z)) for y, z in prof]
    b = [bm.verts.new((x1, y, z)) for y, z in prof]
    bm.faces.new(a); bm.faces.new(reversed(b))
    for k in range(len(prof)):
        bm.faces.new((a[k], b[k], b[(k + 1) % len(prof)], a[(k + 1) % len(prof)]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = M(f"rack_side_{i + 1}", bm, ply)
    comp.uv_box(o, 1.0)
P("rack_tray", (W - 2 * TH, D - 2 * TH, TH), (0, 0, TRAY - TH / 2))
P("rack_lip", (W - 2 * TH, TH, LIP - TRAY + 0.1), (0, -D / 2 + TH / 2, (LIP + TRAY - 0.1) / 2))
P("rack_back", (W - 2 * TH, TH, BACK - 0.1), (0, D / 2 - TH / 2, (BACK + 0.1) / 2))
P("rack_shelf", (W - 2 * TH, D - 2 * TH, TH), (0, 0, 0.14))
P("rack_kick", (W - 2 * TH, TH, 0.13), (0, -D / 2 + 0.05, 0.065))
CX = (-0.388, 0.0, 0.388)
for i, x in enumerate((-0.194, 0.194)):
    P(f"rack_partition_{i + 1}", (0.012, D - 2 * TH, 0.2), (x, 0, TRAY + 0.1))
M("rack_price_strip", comp.box((0.34, 0.001, 0.05), at=(0, -D / 2 - 0.0005, LIP - 0.045)), strip)
M("rack_price_words", xf(comp.text("USED LPS  -  ALL GENRES", 0.02, depth=0.0006), T(0, -D / 2 - 0.0014, LIP - 0.045)), ink)

LEAN = 13
Y0, Y1 = -D / 2 + 0.115, D / 2 - 0.1
TABS = [["A - D", "E - K", "L - R"], ["JAZZ", "SOUL", "FUNK"], ["ROCK", "NEW IN", "S - Z"]]

def divider(label, tab_x):
    c = comp.merge(comp.box((0.335, 0.0016, 0.325), at=(0, 0, 0.1625)), comp.box((0.1, 0.0016, 0.034), at=(tab_x, 0, 0.341)))
    t = xf(comp.text(label, 0.017, depth=0.0005), T(tab_x, -0.0012, 0.34))
    return c, t

flips, lift = [], None
for c, cx in enumerate(CX):
    stack, cards, words = [], [], []
    y, n, tab = Y0, 0, 0
    next_div = 7 if c == 1 else rng.randrange(3, 6)
    while y < Y1:
        if n == next_div and tab < 3:
            cb, tb = divider(TABS[c][tab], (-0.1, 0.0, 0.1)[tab])
            m = T(cx, y, TRAY) @ R(-LEAN, "X")
            if c == 1 and tab == 0:
                lift = comp.pivot(col, root, "rack_divider_lift", (cx, y, TRAY))
                lift.rotation_euler[0] = math.radians(-LEAN)
                bpy.context.view_layer.update()
                M("rack_divider_card", xf(cb, m), card, parent=lift)
                M("rack_divider_label", xf(tb, m), ink, parent=lift)
            else:
                cards.append(xf(cb, m)); words.append(xf(tb, m))
            tab += 1
            next_div = n + rng.randrange(9, 14)
            y += 0.006
            continue
        first = n == 0 or rng.random() < 0.12
        if first and n:
            y += rng.uniform(0.012, 0.03)
        if c == 1 and n < 7:      # the ones a hand flicks through: each on its own hinge along its bottom edge
            pv = comp.pivot(col, root, f"rack_flip_{n + 1}", (cx, y, TRAY))
            pv.rotation_euler[0] = math.radians(-LEAN)
            bpy.context.view_layer.update()
            o = M(f"rack_flip_{n + 1}_sleeve", xf(sleeve(rng, art=True), T(cx, y, TRAY) @ R(-LEAN, "X")), INK, parent=pv)
            flips.append((pv, "rotation_euler", 0, math.radians(-LEAN), math.radians(34 - n * 3.2)))
            y += 0.0075
        else:
            s = sleeve(rng, art=first or rng.random() < 0.3)
            xf(s, T(cx + rng.uniform(-0.006, 0.006), y, TRAY + rng.choice((0, 0, 0, 0.004, 0.012))) @ R(-LEAN + rng.uniform(-1.5, 1.5), "X"))
            stack.append(s)
            y += rng.choice((0.0058, 0.0064, 0.0072))
        n += 1
    M(f"rack_sleeves_{c + 1}", comp.merge(*stack), INK)
    if cards:
        M(f"rack_dividers_{c + 1}", comp.merge(*cards), card)
        M(f"rack_divider_labels_{c + 1}", comp.merge(*words), ink)
# the overstock on the lower shelf, spines out
spines = []
x = -W / 2 + TH + 0.02
while x < W / 2 - TH - 0.02:
    s = sleeve(rng, art=False)
    xf(s, T(x, -0.02, 0.149) @ R(rng.uniform(-3, 3), "Y") @ R(90, "Z"))
    spines.append(s)
    x += rng.choice((0.0058, 0.0066, 0.008, 0.03 if rng.random() < 0.06 else 0.006))
M("rack_overstock", comp.merge(*spines), INK)

channel("flip", flips)
channel("divider", [(lift, "location", 2, lift.location.z, lift.location.z + 0.12)])
done(col, root, "rack", "own geometry (a generic plywood record browser; plywood https://polyhaven.com/a/plywood, CC0)",
     rig={"flip": "the middle column's front seven sleeves tip forward about their bottom edges, the front one 47 degrees and each behind it 3 less",
          "divider": "the middle column's first divider card (JAZZ) lifts 12 cm along its lean"})
