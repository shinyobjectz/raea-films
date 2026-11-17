# court/hoop: a street court's goal, modelled by hand: a 114 mm gooseneck steel post on a bolted base plate in a concrete
# footing, reaching 2.1 m out to a fan-shaped steel backboard (1.37 x 0.9 m, white paint gone to rust at its bolts and
# edge, an orange shooter's square), its angle-iron frame and stay rods behind it, an orange rim (45.7 cm inside) on
# its bracket with two stays and twelve ram's-horn hooks, and a galvanised chain net: twelve chains of welded links
# in diamonds, drawn in to 27 cm at the skirt. The origin is the post's foot; the board faces -y and the rim is at
# 3.05 m, its centre 2.48 m out from the post.
# Rig: "net" swings the net back about the rim, bending down its three tiers (14, 10 and 10 degrees: the ball going
# through); "sway" swings it sideways the same way; "swish" bellies the net out round the ball (the middle tier 28%
# wider, the skirt 12%, 6% shorter); "rim" dips the rim, bracket and net 6 degrees about the board's face.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
import numpy as np
from _lib import lathe, torus, rod, rbox, pipe, fillet, T, R, S, xf, Vector

col, root = comp.fresh("hoop")
M = _lib.maker(col, root)
post_m = comp.mat("hoop_post", (0.035, 0.07, 0.05), rough=0.22, metal=0.6)
galv = comp.mat("hoop_galvanised", (0.62, 0.64, 0.66), rough=0.3, metal=1.0)
chain_m = comp.mat("hoop_chain", (0.78, 0.8, 0.82), rough=0.22, metal=1.0)
orange = comp.mat("hoop_rim", (0.82, 0.17, 0.02), rough=0.3, metal=0.3)
conc = comp.ph_texture("hoop_footing", "concrete_floor_worn_001", tile=1.0, res="1k", tint=(0.7, 0.7, 0.72))
RIM_Z, BY = 3.05, -2.1                 # the rim's height; the board's face
RR = 0.2286
RY = BY - 0.15 - RR                    # the rim's centre

# the post: footing, base plate and bolts, the gooseneck, a welded gusset, the cap
foot = M("hoop_footing", comp.cyl(0.32, 0.06, at=(0, 0, -0.03), seg=28), conc)
comp.uv_box(foot, 1.0)
plate = M("hoop_base_plate", rbox((0.3, 0.3, 0.016), at=(0, 0, 0.038), r=0.004, seg=1), galv, smooth=False)
M("hoop_base_bolts", comp.merge(*[comp.merge(comp.cyl(0.016, 0.014, at=(sx * 0.115, sy * 0.115, 0.046), seg=6), comp.cyl(0.008, 0.03, at=(sx * 0.115, sy * 0.115, 0.046), seg=8)) for sx in (-1, 1) for sy in (-1, 1)]), galv, smooth=False)
NECK_Z = RIM_Z + 0.42
path = fillet([(0, 0, 0.04), (0, 0, 2.35), (0, -1.25, NECK_Z), (0, BY + 0.17, NECK_Z)], 0.75, n=10)
M("hoop_post", pipe(path, 0.057, sides=5), post_m)
M("hoop_post_collar", comp.merge(comp.cyl(0.066, 0.09, at=(0, 0, 0.046), seg=24), *[comp.box((0.008, 0.11, 0.16), at=(0, sy * 0.1, 0.12)) for sy in (-1, 1)], *[comp.box((0.11, 0.008, 0.16), at=(sx * 0.1, 0, 0.12)) for sx in (-1, 1)]), post_m, smooth=False)

# the backboard: a fan of steel sheet with a rolled edge, painted from our own picture
BW, BTOP, BBOT = 1.37, 0.74, -0.16
def outline(n=28):
    pts = []
    for i in range(n + 1):                       # the top: half an ellipse
        a = math.pi * i / n
        pts.append((BW / 2 * math.cos(a), 0.3 + (BTOP - 0.3) * math.sin(a)))
    for i in range(1, 9):                        # the left side curving in to the flat bottom
        t = i / 8
        pts.append((-BW / 2 + (BW / 2 - 0.36) * (1 - math.cos(t * math.pi / 2)), 0.3 - (0.3 - BBOT) * math.sin(t * math.pi / 2)))
    for i in range(8, 0, -1):
        t = (i - 1) / 8
        pts.append((BW / 2 - (BW / 2 - 0.36) * (1 - math.cos(t * math.pi / 2)), 0.3 - (0.3 - BBOT) * math.sin(t * math.pi / 2)))
    return pts[:-1]
OUT = outline()

def board_picture(u, v):
    x, z = (u - 0.5) * BW, BBOT + v * (BTOP - BBOT)
    rng = np.random.default_rng(7)
    paint = np.array([0.8, 0.8, 0.76])
    rgb = np.ones(u.shape + (3,), np.float32) * paint
    # the shooter's square and a border line, in orange
    sq = ((np.abs(np.abs(x) - 0.28) < 0.025) & (z > 0.0) & (z < 0.46)) | ((np.abs(z - 0.435) < 0.025) & (np.abs(x) < 0.305)) | ((np.abs(z - 0.025) < 0.025) & (np.abs(x) < 0.305))
    rgb[sq] = (0.8, 0.22, 0.04)
    # grime: low-frequency blotches, vertical rain streaks, ball marks round the square
    yy, xx = np.mgrid[0:u.shape[0], 0:u.shape[1]]
    blot = sum(np.sin(xx / s + p) * np.sin(yy / (s * 1.3) + p * 2) for s, p in ((37, 1.0), (91, 2.2), (17, 0.4))) / 3
    streak = np.repeat(rng.normal(0, 1, (1, u.shape[1])), u.shape[0], 0)
    streak = (np.roll(streak, 1, 1) + streak + np.roll(streak, -1, 1)) / 3
    rgb *= (0.86 + 0.08 * blot + 0.05 * streak)[..., None]
    marks = rng.uniform(0, 1, (40, 3))
    for mx, mz, mr in marks:
        cx, cz, r = (mx - 0.5) * 0.9, 0.05 + mz * 0.5, 0.05 + mr * 0.07
        d = np.hypot(x - cx, z - cz)
        rgb *= (1 - 0.1 * np.exp(-((d - r) / 0.012) ** 2))[..., None]
    # rust: at the bolts, creeping in from the edge, running down from both
    rust = np.zeros(u.shape, np.float32)
    bolts = [(sx * bx, bz) for sx in (-1, 1) for bx, bz in ((0.1, -0.06), (0.1, 0.1), (0.45, 0.2), (0.45, 0.5), (0.2, 0.62))]
    for bx, bz in bolts:
        d = np.hypot(x - bx, z - bz)
        rust += np.exp(-(d / 0.022) ** 2) * 1.2
        run = np.exp(-((x - bx) / 0.012) ** 2) * np.clip((bz - z) / 0.25, 0, 1) * (z < bz) * np.clip(1 - (bz - z) / 0.3, 0, 1)
        rust += run * 0.7
    edge = np.minimum.reduce([BW / 2 - np.abs(x), z - BBOT, (BTOP - z) + 0.1])
    noise = rng.normal(0, 1, u.shape)
    for _ in range(3):
        noise = (noise + np.roll(noise, 2, 0) + np.roll(noise, -2, 0) + np.roll(noise, 2, 1) + np.roll(noise, -2, 1)) / 5
    noise = noise / (np.abs(noise).max() + 1e-6)
    rust += np.clip(1 - edge / (0.05 + 0.05 * noise), 0, 1) * 0.9
    rust += np.clip(noise * 3 - 1.6, 0, 1) * 0.8
    rust = np.clip(rust, 0, 1)[..., None]
    rc = np.array([0.33, 0.13, 0.05]) * (0.8 + 0.4 * noise[..., None])
    return rgb * (1 - rust) + rc * rust

board_m = _lib.image_mat("hoop_board", _lib.paint("hoop_board", 1024, 672, board_picture), rough=0.32, metal=0.2)
bm = bmesh.new()
vs = [bm.verts.new((x, BY, RIM_Z + z)) for x, z in OUT]
f = bm.faces.new(vs)
ex = bmesh.ops.extrude_face_region(bm, geom=[f])
bmesh.ops.translate(bm, vec=(0, 0.028, 0), verts=[e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
board = M("hoop_board", bm, board_m, smooth=False)
_lib.uv_planar(board, (-BW / 2, RIM_Z + BBOT), (BW / 2, RIM_Z + BTOP), axes=(0, 2))
edge_pts = [(x, BY + 0.014, RIM_Z + z) for x, z in OUT]
M("hoop_board_edge", pipe(edge_pts, 0.017, sides=3, cyclic=True), galv)
M("hoop_board_bolts", comp.merge(*[comp.cyl(0.011, 0.008, at=(sx * bx, BY - 0.007, RIM_Z + bz), seg=6, axis="Y") for sx in (-1, 1) for bx, bz in ((0.1, -0.06), (0.1, 0.1), (0.45, 0.2), (0.45, 0.5), (0.2, 0.62))]), galv, smooth=False)
# behind it: an angle-iron frame, the neck's flange, two stay rods back to the post
fr = [comp.box((0.04, 0.04, 0.82), at=(sx * 0.45, BY + 0.048, RIM_Z + 0.28)) for sx in (-1, 1)] + [comp.box((0.04, 0.04, 0.78), at=(sx * 0.1, BY + 0.048, RIM_Z + 0.26)) for sx in (-1, 1)]
fr += [comp.box((1.0, 0.04, 0.04), at=(0, BY + 0.048, RIM_Z + z)) for z in (-0.06, 0.2, 0.62)]
fr += [rbox((0.26, 0.014, 0.3), at=(0, BY + 0.165, NECK_Z), r=0.003, seg=1), comp.box((0.22, 0.1, 0.012), at=(0, BY + 0.115, NECK_Z + 0.1)), comp.box((0.22, 0.1, 0.012), at=(0, BY + 0.115, NECK_Z - 0.1))]
fr += [rod((sx * 0.45, BY + 0.07, RIM_Z + 0.6), (sx * 0.03, -1.0, NECK_Z - 0.12), 0.009, seg=8) for sx in (-1, 1)]
fr += [rod((sx * 0.1, BY + 0.07, RIM_Z - 0.06), (0, -0.75, RIM_Z - 0.02), 0.011, seg=8) for sx in (-1, 1)]
M("hoop_board_frame", comp.merge(*fr), post_m, smooth=False)

# the rim on its bracket, hinged at the board's face; the hooks; the chain net in three tiers
hinge = comp.pivot(col, root, "hoop_rim", (0, BY, RIM_Z))
M("hoop_rim_ring", torus(RR + 0.008, 0.008, seg=72, sides=10, at=(0, RY, RIM_Z)), orange, parent=hinge)
br = [rbox((0.2, 0.01, 0.2), at=(0, BY - 0.005, RIM_Z - 0.07), r=0.003, seg=1), rbox((0.13, 0.155, 0.01), at=(0, BY - 0.08, RIM_Z - 0.005), r=0.003, seg=1),
      comp.box((0.008, 0.15, 0.09), at=(-0.06, BY - 0.08, RIM_Z - 0.05)), comp.box((0.008, 0.15, 0.09), at=(0.06, BY - 0.08, RIM_Z - 0.05))]
br += [rod((sx * 0.07, BY - 0.012, RIM_Z - 0.15), (sx * 0.17, RY + 0.14, RIM_Z - 0.01), 0.007, seg=8) for sx in (-1, 1)]
br += [comp.cyl(0.009, 0.008, at=(sx * 0.07, BY - 0.018, RIM_Z - 0.07 + sz * 0.07), seg=6, axis="Y") for sx in (-1, 1) for sz in (-1, 1)]
M("hoop_rim_bracket", comp.merge(*br), orange, parent=hinge, smooth=False)
N = 12
hooks = []
for i in range(N):
    a = 2 * math.pi * (i + 0.5) / N
    c, s = math.cos(a), math.sin(a)
    p = [(RR + 0.008, 0, -0.008), (RR + 0.02, 0, -0.016), (RR + 0.022, 0, -0.03), (RR + 0.012, 0, -0.04), (RR + 0.002, 0, -0.032), (RR + 0.004, 0, -0.022)]
    hooks.append(pipe([(x * c, RY + x * s, RIM_Z + z) for x, _, z in p], 0.0028, sides=2))
M("hoop_net_hooks", comp.merge(*hooks), orange, parent=hinge)

NR = [RR + 0.008, 0.212, 0.19, 0.168, 0.15, 0.139, 0.135]
NZ = [-0.034, -0.105, -0.18, -0.255, -0.33, -0.4, -0.47]


def node(k, i):
    a = 2 * math.pi * (i + 0.5 * (k % 2) + 0.5) / N
    return Vector((NR[k] * math.cos(a), RY + NR[k] * math.sin(a), RIM_Z + NZ[k]))


def link_bm(p, d, twist, L=0.036, r=0.0027):
    b = torus(0.0058, r, seg=8, sides=4)             # a ring in xy, 17 mm across
    for v in b.verts:                                # drawn out along x to a welded link L long
        v.co.x += (L - 0.017) / 2 * (1 if v.co.x > 0 else -1)
    xf(b, R(twist, "X"))
    xf(b, Vector((1, 0, 0)).rotation_difference(d).to_matrix().to_4x4())
    xf(b, T(*p))
    return b


def chain(a, b, flip=0):
    d = b - a
    n = max(2, round(d.length / 0.026))              # each link threads the next: 26 mm pitch for 36 mm links
    u = d.normalized()
    return [link_bm(a + d * ((j + 0.5) / n), u, 90 * ((j + flip) % 2), L=d.length / n + 0.01) for j in range(n)]


tiers, piv = [], hinge
for t, (k0, k1) in enumerate(((0, 2), (2, 4), (4, 6))):
    piv = comp.pivot(col, root, f"hoop_net_{'abc'[t]}", (0, RY, RIM_Z + NZ[k0] + (0.02 if t == 0 else 0)), parent=piv)
    links = []
    for k in range(k0, k1):
        for i in range(N):
            # each node hangs two chains, to the two nodes under it either side
            a = node(k, i)
            for da in (-0.5, 0.5):
                ang = 2 * math.pi * (i + 0.5 * (k % 2) + 0.5 + da) / N
                b = Vector((NR[k + 1] * math.cos(ang), RY + NR[k + 1] * math.sin(ang), RIM_Z + NZ[k + 1]))
                links += chain(a, b, flip=int(da > 0))
    if t == 2:                                       # the skirt's last links hanging free
        for i in range(N):
            p = node(6, i)
            links += chain(p, p + Vector((0, 0, -0.045)))
    M(f"hoop_net_{'abc'[t]}_chain", comp.merge(*links), chain_m, parent=piv)
    tiers.append(piv)
A, B, C = tiers
rad = math.radians
_lib.channel("net", [(A, "rotation_euler", 0, 0, rad(14)), (B, "rotation_euler", 0, 0, rad(10)), (C, "rotation_euler", 0, 0, rad(10))])
_lib.channel("sway", [(A, "rotation_euler", 1, 0, rad(12)), (B, "rotation_euler", 1, 0, rad(9)), (C, "rotation_euler", 1, 0, rad(9))])
_lib.channel("swish", [(B, "scale", 0, 1, 1.28), (B, "scale", 1, 1, 1.28), (B, "scale", 2, 1, 0.94), (C, "scale", 0, 1, 0.875), (C, "scale", 1, 1, 0.875)])
_lib.channel("rim", [(hinge, "rotation_euler", 0, 0, rad(6))])
comp.export(col, root, "court", "hoop", made="blender/components/court/hoop.py", source="own geometry and our own painted backboard; Poly Haven texture concrete_floor_worn_001 on the footing", license="ours (texture CC0)", credit="Poly Haven (texture)",
            rig={"net": "the chain net swings back about the rim, bending down its three tiers (14, 10, 10 degrees)", "sway": "the net swings sideways, bending the same way (12, 9, 9 degrees)",
                 "swish": "the net bellies out round the ball: its middle tier 28% wider and 6% shorter, the skirt held to 12% wider", "rim": "the rim, bracket and net dip 6 degrees about the board's face"},
            notes="origin: the post's foot. the rim's centre is at (0, 3.05, 2.479) in raea's frame (2.479 m toward the camera); the board's face 2.1 m out")
