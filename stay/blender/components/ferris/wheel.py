# ferris/wheel: a travelling fair's Ferris wheel, 16 m across with its axle 10.6 m up (18.7 m to the top of its rim),
# modelled by hand: two polygon rims 1.9 m apart, each with 16 spokes, two inner rings and tension rods crossing
# every bay; tie rods between the rims; a flanged hub with a 16-point sunburst on its face; two lattice A-frames
# on base plates with a sway brace each side and the bearing blocks at their heads; sixteen numbered gondolas in
# four colours, each hung on its own rod with a canopy (see _lib.gondola); and 568 festoon bulbs in their holders
# along the spokes, rings, rims and sunburst, alternately warm white and amber. Its front faces -y; origin on the
# ground under the axle. The lit bulbs are parts of their own in thirteen rings (wheel_lights_00 at the hub to _12
# at the sunburst; materials wheel_bulb_warm and wheel_bulb_amber), nothing at rest.
# Rig: "spin" turns the wheel one whole turn on its axle, every gondola turning back on its rod so it hangs true;
# "bulbs" lights the rings from the hub outward, the rim, then the sunburst; "spin and light" is the shot: the
# turn with the bulbs coming on through its first two thirds; "spin lit" is the turn with every bulb on; "upward"
# swings every gondola half a turn about its rod to stand upside down above it (the wrong wheel); "sway" swings
# the gondolas 9 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("wheel")
white = comp.mat("wheel_steel_white", (0.82, 0.82, 0.78), rough=0.4, metal=0.2)
red = comp.mat("wheel_steel_red", (0.55, 0.04, 0.04), rough=0.38, metal=0.2)
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
dark = comp.mat("wheel_dark", (0.03, 0.03, 0.035), rough=0.5)
cream = comp.mat("wheel_cream", (0.88, 0.82, 0.62), rough=0.45)
gold = comp.mat("wheel_gold", (0.85, 0.6, 0.15), rough=0.35, metal=0.6)
glass = comp.mat("wheel_bulb_glass", (0.75, 0.72, 0.62), rough=0.15)
warm = comp.mat("wheel_bulb_warm", (1.0, 0.85, 0.55), rough=0.3, emit=(1.0, 0.72, 0.35), strength=40000.0)
amber = comp.mat("wheel_bulb_amber", (1.0, 0.45, 0.2), rough=0.3, emit=(1.0, 0.3, 0.08), strength=40000.0)
BODY = [comp.mat("gondola_red", (0.6, 0.05, 0.04), rough=0.35), comp.mat("gondola_yellow", (0.85, 0.6, 0.06), rough=0.35), comp.mat("gondola_blue", (0.05, 0.2, 0.5), rough=0.35), comp.mat("gondola_teal", (0.03, 0.42, 0.4), rough=0.35)]


def M(name, bm, m, parent=None, smooth=False):
    return comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)


RW, HZ, HALF, NS = L.RW, L.HZ, L.HALF, L.NS
P = lambda r, deg, y: Vector((r * math.cos(math.radians(deg)), y, HZ + r * math.sin(math.radians(deg))))
turn = comp.pivot(col, root, "wheel_turn", (0, 0, HZ))
SP = 360.0 / NS
RINGS = (3.0, 5.6, RW)

# --- the wheel's steel: rims, rings, spokes, tension rods, ties -------------------------------------------------------
rimbars, spokes, rods = [], [], []
for y in (-HALF, HALF):
    for k in range(NS):
        a0, a1 = k * SP, (k + 1) * SP
        spokes.append(L.seg(P(0.5, a0, y), P(RW, a0, y), 0.05, 8))
        for r in RINGS:
            rimbars.append(L.seg(P(r, a0, y), P(r, a1, y), 0.07 if r == RW else 0.035, 8))
        rods.append(L.seg(P(5.6, a0, y), P(RW, a1, y), 0.014, 5))
        rods.append(L.seg(P(5.6, a1, y), P(RW, a0, y), 0.014, 5))
        rods.append(L.seg(P(3.0, a0, y), P(5.6, a1, y), 0.014, 5))
        rods.append(L.seg(P(3.0, a1, y), P(5.6, a0, y), 0.014, 5))
ties = []
for k in range(NS):
    for r in (3.0, 5.6):
        ties.append(L.seg(P(r, k * SP, -HALF), P(r, k * SP, HALF), 0.03, 6))
    ties.append(L.seg(P(5.6, k * SP, -HALF), P(3.0, (k + 1) * SP, HALF), 0.012, 5))
    for y in (-HALF, HALF):   # the gusset where a spoke meets the rim
        g = comp.box((0.3, 0.02, 0.22))
        xf(g, R(-k * SP, "Y"))
        xf(g, T(*P(RW - 0.1, k * SP, y)))
        ties.append(g)
M("wheel_rims", comp.merge(*rimbars), white, turn, True)
M("wheel_spokes", comp.merge(*spokes), red, turn, True)
M("wheel_rods", comp.merge(*rods), galv, turn, True)
M("wheel_ties", comp.merge(*ties), white, turn, True)
hub = comp.merge(comp.cyl(0.5, 2 * HALF + 0.3, at=(0, -HALF - 0.15, HZ), seg=32, axis="Y"), *[comp.cyl(0.85, 0.06, at=(0, y, HZ), seg=32, axis="Y") for y in (-HALF - 0.09, HALF + 0.03)],
                 *[comp.cyl(0.03, 0.1, at=(0.7 * math.cos(math.radians(22.5 * k)), y, HZ + 0.7 * math.sin(math.radians(22.5 * k))), seg=6, axis="Y") for k in range(16) for y in (-HALF - 0.13, HALF + 0.03)])
h = M("wheel_hub", hub, red, turn, False)
comp.bevel(h, 0.01, 2)
# the sunburst on the hub's face: sixteen long and short points in gold and cream on a red disc
YF = -HALF - 0.2
star_a, star_b = bmesh.new(), bmesh.new()
for k in range(32):
    bm = star_a if k % 2 == 0 else star_b
    a = 360.0 * k / 32
    ro = 1.55 if k % 2 == 0 else 1.15
    vs = [bm.verts.new(P(0.0, 0, YF)), bm.verts.new(P(0.42, a + 5.6, YF)), bm.verts.new(P(ro, a, YF - 0.02)), bm.verts.new(P(0.42, a - 5.6, YF))]
    bm.faces.new(vs)
for bm, nm, m in ((star_a, "gold", gold), (star_b, "cream", cream)):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = M(f"wheel_sunburst_{nm}", bm, m, turn, False)
    comp.solidify(o, 0.03)
M("wheel_sunburst_disc", comp.merge(comp.cyl(1.0, 0.05, at=(0, YF + 0.04, HZ), seg=40, axis="Y"), comp.cyl(0.3, 0.12, at=(0, YF - 0.1, HZ), seg=24, axis="Y", r2=0.2)), red, turn, False)

# --- the bulbs: a holder and a glass each, and the lit one over it in its ring -----------------------------------------
BULBS = []   # (position, stage, colour 0/1)
for y, out in ((-HALF, -1), (HALF, 1)):
    yb = y + out * 0.085
    for k in range(NS):
        for j in range(10):
            BULBS.append((P(1.25 + j * 0.68, k * SP, yb), j, k % 2))
        for r, stage, n in ((3.0, 10, 2), (5.6, 10, 3), (RW, 11, 5)):
            for i in range(n):
                f = (i + 0.5) / n
                p = P(r, k * SP, yb).lerp(P(r, (k + 1) * SP, yb), f)
                BULBS.append((p, stage, (k + i) % 2))
for k in range(24):
    BULBS.append((P(0.92, 15 * k, YF - 0.0 - 0.03), 12, k % 2))
holders, glasses = [], []
lit = {}
for p, stage, c in BULBS:
    out = -1 if p.y < 0 else 1
    holders.append(comp.cyl(0.03, 0.05, at=(p.x, p.y - (0.05 if out > 0 else 0), p.z), seg=6, axis="Y"))
    q = p + Vector((0, out * 0.06, 0))
    glasses.append(L.ico(0.05, q, 1))
    lit.setdefault((stage, c), []).append(L.ico(0.062, q, 1))
M("wheel_bulb_holders", comp.merge(*holders), dark, turn, False)
M("wheel_bulbs", comp.merge(*glasses), glass, turn, True)
STAGES = []
for s in range(13):
    sp = comp.pivot(col, root, f"wheel_lights_{s:02d}", (0, 0, HZ), parent=turn)
    for c, m in ((0, warm), (1, amber)):
        if (s, c) in lit:
            M(f"wheel_lights_{s:02d}_{'warm' if c == 0 else 'amber'}", comp.merge(*lit[(s, c)]), m, sp, True)
    STAGES.append(sp)

# --- the gondolas ------------------------------------------------------------------------------------------------------
ink = comp.mat("gondola_number", (0.95, 0.92, 0.8), rough=0.4)
seat = comp.mat("gondola_seat", (0.1, 0.07, 0.05), rough=0.6)
GONDOLAS = []
for k in range(NS):
    at = P(RW, k * SP, 0)
    gp = comp.pivot(col, root, f"wheel_gondola_{k + 1:02d}", tuple(at), parent=turn)
    L.gondola(M, f"wheel_gondola_{k + 1:02d}", at, BODY[k % 4], cream, galv, seat, BODY[k % 4], cream, gp, number=k + 1, ink=ink)
    GONDOLAS.append(gp)

# --- what stands still: the axle, the A-frames, their braces and feet --------------------------------------------------
YA = HALF + 0.75
M("wheel_axle", comp.merge(comp.cyl(0.16, 2 * YA + 0.5, at=(0, -YA - 0.25, HZ), seg=20, axis="Y")), galv, None, True)
frames, feet = [], []
for y in (-YA, YA):
    out = -1 if y < 0 else 1
    for sx in (-1, 1):
        foot = Vector((sx * 4.4, y + out * 0.5, 0.1))
        frames.append(L.truss(foot, (sx * 0.12, y, HZ - 0.25), 0.62, 0.3, 14, r=0.05, lace=0.022, up=(0, 1, 0)))
        feet.append(comp.box((1.0, 1.0, 0.06), at=(foot.x, foot.y, 0.03)))
        feet.append(comp.box((0.75, 0.75, 0.08), at=(foot.x, foot.y, 0.1)))
        feet += [comp.cyl(0.025, 0.05, at=(foot.x + dx * 0.4, foot.y + dy * 0.4, 0.06), seg=6) for dx in (-1, 1) for dy in (-1, 1)]
    frames.append(L.seg((-4.4 * 0.62, y + out * 0.19, HZ * 0.38), (4.4 * 0.62, y + out * 0.19, HZ * 0.38), 0.06, 8))
    frames.append(L.truss((0, y + out * 4.6, 0.1), (0, y + out * 0.1, HZ - 0.5), 0.5, 0.25, 12, r=0.04, lace=0.018, up=(1, 0, 0)))
    feet.append(comp.box((0.9, 0.9, 0.06), at=(0, y + out * 4.6, 0.03)))
    bb = comp.merge(comp.box((0.7, 0.34, 0.5), at=(0, y, HZ - 0.05)), comp.cyl(0.26, 0.38, at=(0, y - 0.19, HZ), seg=20, axis="Y"))
    b = M(f"wheel_bearing_{'front' if y < 0 else 'back'}", bb, red, None, False)
    comp.bevel(b, 0.015, 2)
M("wheel_frames", comp.merge(*frames), white, None, True)
M("wheel_feet", comp.merge(*feet), galv, None, False)

# --- the rig -----------------------------------------------------------------------------------------------------------
TWO_PI = 2 * math.pi
spin = lambda: {("rotation_euler", 1): [(0, 0), (1, TWO_PI)]}
back = lambda: {("rotation_euler", 1): [(0, 0), (1, -TWO_PI)]}
for nm in ("spin", "spin and light", "spin lit"):
    L.clip(nm, turn, spin())
    for g in GONDOLAS:
        L.clip(nm, g, back())
for s, sp in enumerate(STAGES):
    L.clip("bulbs", sp, L.on_keys(0.04 + 0.88 * s / 12))
    L.clip("spin and light", sp, L.on_keys(0.05 + 0.6 * s / 12))
    L.clip("spin lit", sp, {("scale", i): [(0, 1.0), (1, 1.002)] for i in range(3)})
for i, g in enumerate(GONDOLAS):
    L.clip("upward", g, {("rotation_euler", 1): [(0, 0), (1, math.pi)]})
    L.clip("sway", g, {("rotation_euler", 1): [(0, 0), (1, math.radians(9 if i % 2 else -9))]})
L.unlit(*STAGES)
comp.export(col, root, "ferris", "wheel", made="blender/components/ferris/wheel.py", source="own geometry (a generic travelling Ferris wheel); numbers in Blender's built-in font", license="ours", credit="",
            rig={"spin": "the wheel turns one whole turn on its axle (anticlockwise from the front); each gondola turns back on its rod, so it hangs true; loops",
                 "bulbs": "the lit bulbs come on ring by ring from the hub out to the rim, then the sunburst",
                 "spin and light": "the shot: the whole turn, the bulbs coming on ring by ring through its first two thirds",
                 "spin lit": "the whole turn with every bulb lit; loops",
                 "upward": "every gondola swings half a turn about its rod, to stand upside down above it (the wrong wheel)",
                 "sway": "the gondolas swing 9 degrees on their rods, alternate ones the other way",
                 "glow": "in the scene: the materials wheel_bulb_warm and wheel_bulb_amber glow, a key per state (a traced render holds its first frame's lights)"},
            notes="origin: on the ground under the axle, which is 10.6 m up; the rims are 8 m in radius; the lit bulbs are wheel_lights_00..12 under wheel_turn")
