# cathedral/rose-window: the nave's end wall and its rose window, modelled by hand. The wall is 10 m wide, 14 m high
# and 0.7 m thick in limestone ashlar, standing on the floor with its back at y 0; the rose is 5 m across with its
# centre 8.6 m up: a splayed, moulded reveal, and bar tracery in dressed stone (an eight-foil eye, twelve petal
# lights with pointed heads between spokes carrying colonettes, twelve quatrefoil roundels and twelve eyelets).
# Behind the tracery are two leaves of stained glass painted here (blue quarries, ruby medallions, gold): the lit
# leaf (rose_glass_lit, which glows) and before it the unlit leaf (rose_glass_dark). Under the window a string
# course and a blind dado arcade of seven pointed arches on colonettes.
# Rig: "light" draws the unlit leaf back through the lit one, its far edge first, so the light crosses the window
# from one side to the other (the sun swung until the rose lights); how bright it is is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bpy, bmesh
import numpy as np
from comp import T, R, S, xf

col, root = comp.fresh("rose_window")
stone = L.stone()
dressed = L.plain_stone()
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)

W, H, TH = 10.0, 14.0, 0.7
CZ, RR = 8.6, 2.5          # the rose's centre height and the radius of its glass
SPLAY = 0.45
PY0, PD = -0.18, 0.24       # the tracery's back face and its thickness

# --- the wall ---------------------------------------------------------------------------------------------------
wall = M("rose_window_wall", L.plate([L.rect(-W / 2, 0, W / 2, H), L.circle(RR + SPLAY, (0, CZ), 72)], TH), stone)
L.finish(wall, 1.0)
reveal = L.lathe([(RR + SPLAY, TH), (RR + 0.03, -PY0 + PD), (RR + 0.03, 0.0)], seg=72, cap=False)
bmesh.ops.reverse_faces(reveal, faces=reveal.faces)
xf(reveal, R(90, "X"))
xf(reveal, T(0, 0, CZ))
M("rose_window_reveal", reveal, dressed, smooth=True)
rings = comp.merge(
    xf(L.torus(RR + SPLAY + 0.05, 0.075, 72, 10), T(0, -TH, CZ)),
    xf(L.torus(RR + SPLAY + 0.19, 0.04, 72, 8), T(0, -TH, CZ)),
    xf(L.torus(RR + 0.27, 0.05, 72, 8), T(0, -TH + 0.14, CZ)),
    xf(L.torus(RR + 0.06, 0.055, 72, 8), T(0, PY0 - PD, CZ)),
)
M("rose_window_mouldings", rings, dressed, smooth=True)

# --- the tracery ------------------------------------------------------------------------------------------------
def foil(r, n, at, depth=0.24, turn=0.0, pts=96):
    out = []
    for i in range(pts):
        a = 2 * math.pi * i / pts
        k = abs(math.cos(n * (a - turn) / 2)) ** 0.6
        out.append((at[0] + r * (1 - depth + depth * k) * math.cos(a), at[1] + r * (1 - depth + depth * k) * math.sin(a)))
    return out

SPOKE = 0.065               # half a spoke's thickness
R1, R2 = 0.62, 1.3

def petal(alpha):
    d = lambda rho: math.radians(15) - math.asin(SPOKE / rho)
    loc = []
    n = 6
    for i in range(n + 1):
        rho = R1 + (R2 - R1) * i / n
        loc.append((rho * math.cos(d(rho)), rho * math.sin(d(rho))))
    w = R2 * math.sin(d(R2))
    head, _ = L.arch(2 * w, R2 * math.cos(d(R2)), 0, n=10)
    for x, z in head[3:-1]:
        loc.append((z, x))
    for i in range(n + 1):
        rho = R2 - (R2 - R1) * i / n
        loc.append((rho * math.cos(d(rho)), -rho * math.sin(d(rho))))
    for i in range(1, 5):
        a = -d(R1) + 2 * d(R1) * i / 5
        loc.append((R1 * math.cos(a), R1 * math.sin(a)))
    ca, sa = math.cos(alpha), math.sin(alpha)
    return [(u * ca - v * sa, CZ + u * sa + v * ca) for u, v in loc]

holes = [foil(0.4, 8, (0, CZ), 0.26, pts=128)]
RND, EYE = 2.0, 2.13
for k in range(12):
    a = math.radians(30 * k)
    holes.append(petal(a))
    s = a + math.radians(15)
    holes.append(foil(0.3, 4, (RND * math.cos(s), CZ + RND * math.sin(s)), 0.3, turn=s, pts=64))
    holes.append(L.circle(0.13, (EYE * math.cos(a), CZ + EYE * math.sin(a)), 24))
tr = M("rose_window_tracery", xf(L.plate([L.circle(RR + 0.035, (0, CZ), 96)] + holes, PD), T(0, PY0, 0)), dressed)
comp.bevel(tr, 0.022, 2, angle=50)

# colonettes down the spokes, a ring round the eye
FY = PY0 - PD
cols = []
for k in range(12):
    s = math.radians(30 * k + 15)
    shaft = L.lathe([(0.062, 0.0), (0.062, 0.03), (0.04, 0.05), (0.04, 0.62), (0.05, 0.635), (0.07, 0.69), (0.075, 0.72), (0.0, 0.72)], seg=12)
    xf(shaft, T(0, 0, R1 + 0.02))          # along +z from the hub
    xf(shaft, R(math.degrees(s) - 90, "Y").inverted())
    xf(shaft, T(0, FY - 0.02, CZ))
    cols.append(shaft)
M("rose_window_colonettes", comp.merge(*cols), dressed, smooth=True)
M("rose_window_eye_ring", comp.merge(xf(L.torus(0.5, 0.05, 48, 8), T(0, FY, CZ)), xf(L.torus(0.4, 0.028, 48, 6), T(0, FY, CZ))), dressed, smooth=True)

# --- the glass ----------------------------------------------------------------------------------------------------
N = 1024
RG = RR + 0.04
yy, xx = np.mgrid[0:N, 0:N]
u = ((xx + 0.5) / N * 2 - 1) * RG
v = ((yy + 0.5) / N * 2 - 1) * RG
r = np.hypot(u, v)
th = np.arctan2(v, u)
P = math.radians(30)
frac = lambda a: a - np.floor(a)
hsh = lambda a, b: frac(np.sin(a * 12.9898 + b * 78.233) * 43758.5453)
BLUE, RUBY, GOLD, GREEN, VIOLET, WHITE = (np.array(c) for c in ((0.03, 0.12, 0.75), (0.75, 0.03, 0.05), (0.95, 0.62, 0.08), (0.05, 0.5, 0.16), (0.42, 0.08, 0.55), (0.92, 0.9, 0.78)))
g1 = r * 5.5 + th * 24 / (2 * math.pi)
g2 = r * 5.5 - th * 24 / (2 * math.pi)
h1 = hsh(np.floor(g1), np.floor(g2))
h2 = hsh(np.floor(g2) + 7.0, np.floor(g1) + 3.0)
img = np.zeros((N, N, 3))
img[:] = BLUE
for lo, hi, c in ((0.0, 0.2, RUBY), (0.2, 0.3, GOLD), (0.3, 0.37, GREEN), (0.37, 0.42, VIOLET)):
    img[(h1 >= lo) & (h1 < hi)] = c
lead = (frac(g1) < 0.07) | (frac(g2) < 0.07)
# petal medallions and their borders
tp = (th + P / 2) % P - P / 2
pu, pv = r * np.cos(tp), r * np.sin(tp)
dm = np.hypot(pu - 0.98, pv)
img[dm < 0.2] = WHITE
img[dm < 0.165] = RUBY
img[dm < 0.08] = GOLD
lead |= (np.abs(dm - 0.2) < 0.012) | (np.abs(dm - 0.165) < 0.008) | (np.abs(dm - 0.08) < 0.008)
edge = np.abs(np.abs(tp) * r - (math.radians(15) * r - SPOKE)) < 0.05       # a white fillet inside each light's edge
img[edge & (r > R1) & (r < 1.75)] = WHITE
de = np.hypot(pu - EYE, pv)
img[de < 0.2] = GOLD
# the roundels on the spokes' lines
ts = (th - P / 2 + P / 2) % P - P / 2
ts = (th) % P - P / 2
su, sv = r * np.cos(ts), r * np.sin(ts)
dr = np.hypot(su - RND, sv)
img[dr < 0.36] = BLUE
img[dr < 0.24] = WHITE
img[dr < 0.21] = RUBY
img[dr < 0.1] = GOLD
lead |= (np.abs(dr - 0.24) < 0.01) | (np.abs(dr - 0.1) < 0.008) | ((dr < 0.21) & (dr > 0.1) & (np.abs(frac(np.arctan2(sv, su - RND) * 8 / (2 * math.pi)) - 0.5) > 0.46))
# the eye: a gold sun on ruby
star = 0.2 + 0.12 * np.abs(np.cos(th * 4))
img[r < 0.46] = RUBY
img[r < star] = GOLD
img[r < 0.09] = WHITE
lead |= ((np.abs(r - star) < 0.01) & (r < 0.46)) | (np.abs(r - 0.09) < 0.007)
img *= (0.72 + 0.5 * h2)[..., None]          # no two quarries the same
img[lead] = (0.012, 0.012, 0.012)
img = np.clip(img, 0, 1)
rgba = np.dstack([img, np.ones((N, N))])
lit_png = L.save_png(os.path.join(L.TEX, "rose_glass_lit.png"), rgba)
dark = np.dstack([img * 0.09 + 0.004, np.ones((N, N))])
dark_png = L.save_png(os.path.join(L.TEX, "rose_glass_dark.png"), dark)
# what the tracery lets through, for the pool of light the window throws (cathedral/light-shaft reads rose_pool.png)
d2 = math.radians(15) - math.asin(SPOKE / R2)
z0h, wh = R2 * math.cos(d2), R2 * math.sin(d2)
apv = np.abs(pv)
opening = (r < 0.36) | (dr < 0.26) | (de < 0.13)
opening |= (r > R1) & (pu < z0h) & (apv < pu * math.tan(math.radians(15)) - SPOKE / math.cos(math.radians(15)))
opening |= (pu >= z0h) & ((apv + wh) ** 2 + (pu - z0h) ** 2 < (2 * wh) ** 2)
soft = opening.astype(float)
pool = img * soft[..., None]
for _ in range(3):      # the sun's disc softens the edges
    soft = (soft + np.roll(soft, 4, 0) + np.roll(soft, -4, 0) + np.roll(soft, 4, 1) + np.roll(soft, -4, 1)) / 5
    pool = (pool + np.roll(pool, 4, 0) + np.roll(pool, -4, 0) + np.roll(pool, 4, 1) + np.roll(pool, -4, 1)) / 5
pool = np.clip(pool * 1.6 + 0.25 * soft[..., None] * np.array((1.0, 0.85, 0.6)), 0, 1)
L.save_png(os.path.join(L.TEX, "rose_pool.png"), np.dstack([pool, soft * 0.9])[::2, ::2])
lit_m = L.picture("rose_glass_lit", lit_png, emit=3000.0, rough=0.3)
dark_m = L.picture("rose_glass_dark", dark_png, emit=0.0, rough=0.12)

def leaf(name, m, y, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, cap_tris=True, segments=64, radius=RG)
    xf(bm, R(90, "X"))
    xf(bm, T(0, y, CZ))
    for f in bm.faces:
        if f.normal.y > 0:
            f.normal_flip()
    o = M(name, bm, m, parent=parent)
    L.uv_planar(o, -RG, CZ - RG, 2 * RG, 2 * RG)
    return o

leaf("rose_window_glass_lit", lit_m, -0.10)
TILT, REST, FULL = 0.02 / RG, -0.125, -0.075
slide = comp.pivot(col, root, "rose_window_unlit_leaf", (0, REST, CZ))
slide.rotation_euler[2] = TILT
bpy.context.view_layer.update()
d = leaf("rose_window_glass_dark", dark_m, 0.0)
d.parent = slide
d.matrix_parent_inverse.identity()
d.location = (0, 0, -CZ)
d.rotation_euler = (0, 0, 0)

# --- under the window: a string course, a dado arcade, a plinth ----------------------------------------------------
sc = M("rose_window_string_course", comp.merge(comp.box((W, 0.16, 0.1), at=(0, -TH - 0.08, 5.25)), comp.box((W, 0.09, 0.08), at=(0, -TH - 0.045, 5.16)), xf(comp.cyl(0.045, W, at=(-W / 2, -TH - 0.12, 5.2), seg=12, axis="X"), T(0, 0, 0))), dressed)
comp.bevel(sc, 0.012, 2)
NA, SPAN, Z0A, ZB = 7, 0.98, 3.3, 0.55
pitch = W / NA
loops = [L.rect(-W / 2, ZB, W / 2, 4.75)]
shafts = []
for i in range(NA):
    cx = -W / 2 + pitch * (i + 0.5)
    pts, apex = L.arch(SPAN, Z0A, ZB, at=cx, n=12)
    loops.append(pts)
for i in range(NA + 1):
    cx = max(-W / 2 + 0.11, min(W / 2 - 0.11, -W / 2 + pitch * i))
    sh = L.lathe([(0.11, 0.0), (0.11, 0.06), (0.085, 0.1), (0.1, 0.14), (0.065, 0.2), (0.065, Z0A - ZB - 0.3), (0.08, Z0A - ZB - 0.28), (0.07, Z0A - ZB - 0.24), (0.12, Z0A - ZB - 0.06), (0.13, Z0A - ZB), (0, Z0A - ZB)], seg=16)
    shafts.append(xf(sh, T(cx, -TH - 0.2, ZB)))
da = M("rose_window_dado_arcade", xf(L.plate(loops, 0.2), T(0, -TH, 0)), dressed)
comp.bevel(da, 0.025, 2, angle=50)
M("rose_window_dado_shafts", comp.merge(*shafts), dressed, smooth=True)
pl = M("rose_window_plinth", comp.merge(comp.box((W, 0.3, ZB), at=(0, -TH - 0.15, ZB / 2)), comp.box((W, 0.36, 0.12), at=(0, -TH - 0.18, 0.06))), stone)
comp.bevel(pl, 0.03, 2)
L.finish(pl, 1.0)

L.channel("light", [(slide, "location", 1, REST, FULL)])
comp.export(col, root, "cathedral", "rose_window", made="blender/components/cathedral/rose_window.py",
            source="own geometry and glass painting (a twelve-light Gothic rose in bar tracery); stone: https://polyhaven.com/a/large_sandstone_blocks_01",
            license="ours; texture CC0", credit="Poly Haven (large_sandstone_blocks_01)",
            rig={"light": "the unlit leaf of glass (rose_window_unlit_leaf) draws back 5 cm through the lit leaf, tilted, so the light crosses the window from its right edge to its left between 0.1 and 0.9",
                 "glow": "in the scene: the material rose_glass_lit's glow (3000 here, for a scene exposed for daylight), and the sun that throws it on the floor (cathedral/light-shaft)"},
            notes="The rose's centre is 8.6 m above the origin, its glass 5.08 m across. rose_glass_dark is the same painting at a tenth of the brightness.")
