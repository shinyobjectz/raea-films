# corridors/school: a school corridor, 60 m of it, modelled by hand: a polished terrazzo floor (drawn here: chips in a
# warm grey with brass divider strips every 1.2 m) with a dark green border; teal steel lockers down both walls on a
# black plinth, each with louvres, a lift handle and a number; painted block wall above; classroom doors on alternate
# sides every 4.4 m (oak leaves with a lit glass slot and transom in maroon steel frames, a corkboard of notices beside
# each and a round clock over it); a drop ceiling of fissured tiles with a fluorescent panel every 2.4 m down its
# middle; and at the far end a pair of fire doors with round porthole windows full of daylight under an exit sign.
# The corridors' section (_lib.py). Origin: the floor's centre line where the lens starts; the corridor runs along +y.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, np, slab, sphere, W2, H, Y0, L, save_image, image_mat, uv_set, noise

col, root = comp.fresh("school")
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
P = 4.4
DW, DH = 0.95, 2.15
LW, LZ0, LZ1 = 0.31, 0.1, 1.85                                # a locker's width; its plinth's top and its top

# --- terrazzo, 1.2 m square ----------------------------------------------------------------------------------------
n = 1024
rng = np.random.default_rng(7)
img = np.empty((n, n, 3), dtype=np.float32)
img[:] = np.array([0.7, 0.69, 0.65])
img *= (0.95 + 0.05 * noise(n, n, 40, 8))[:, :, None]
chips = [np.array(c) for c in ((0.12, 0.12, 0.12), (0.92, 0.91, 0.88), (0.5, 0.26, 0.18), (0.38, 0.42, 0.38), (0.82, 0.74, 0.6), (0.25, 0.25, 0.27))]
yy, xx = np.mgrid[-7:8, -7:8]
for i in range(9000):
    r = 1.0 + 5.5 * rng.random() ** 2.2
    cx, cy = rng.integers(8, n - 8, 2)
    e = rng.random() * 0.6 + 0.7
    m = (xx / r) ** 2 + (yy / (r * e)) ** 2 < 1
    c = chips[rng.integers(0, len(chips))] * (0.85 + 0.3 * rng.random())
    img[cy - 7:cy + 8, cx - 7:cx + 8][m] = c
brass_c = np.array([0.62, 0.5, 0.27])
img[:4] = brass_c; img[:, :4] = brass_c
terrazzo = image_mat("school_terrazzo", save_image("school-terrazzo", img), size=(1.2, 1.2), rough=0.14)

# --- painted block, two blocks by two courses (0.8 x 0.4 m) ---------------------------------------------------------
h, w = 256, 512
img = np.empty((h, w, 3), dtype=np.float32)
img[:] = np.array([0.84, 0.82, 0.74])
img *= (0.94 + 0.06 * noise(h, w, 12, 9))[:, :, None]
mortar = np.array([0.66, 0.64, 0.57])
for row, off in ((0, 0), (1, 128)):
    r0 = row * 128
    img[r0:r0 + 5] = mortar
    for k in range(3):
        x0 = (off + k * 256) % w
        img[r0:r0 + 128, x0:x0 + 5] = mortar
block = image_mat("school_block", save_image("school-block", img), size=(0.8, 0.4), rough=0.7)

# --- ceiling tile, 0.6 m square -----------------------------------------------------------------------------------
n = 384
img = np.empty((n, n, 3), dtype=np.float32)
img[:] = np.array([0.88, 0.88, 0.85])
f = noise(n, n, 6, 10)
img[f > 0.82] *= 0.72
img *= (0.96 + 0.04 * noise(n, n, 50, 11))[:, :, None]
grid_c = np.array([0.6, 0.6, 0.6])
img[:4] = grid_c; img[-4:] = grid_c; img[:, :4] = grid_c; img[:, -4:] = grid_c
tiles = image_mat("school_ceiling", save_image("school-ceiling", img), size=(0.6, 0.6), offset=(0.3, 0.0), rough=0.95)

teal = comp.mat("school_locker", (0.05, 0.33, 0.38), rough=0.42, metal=0.35)
dark = comp.mat("school_dark", (0.02, 0.022, 0.024), rough=0.5)
chrome = comp.mat("school_chrome", (0.8, 0.8, 0.82), rough=0.18, metal=1.0)
border = comp.mat("school_border", (0.07, 0.13, 0.1), rough=0.18)
frame_m = comp.mat("school_frame", (0.36, 0.06, 0.05), rough=0.4, metal=0.3)
oak = comp.mat("school_oak", (0.5, 0.33, 0.18), rough=0.45)
glass = comp.mat("school_glass", (0.9, 0.95, 1.0), rough=0.15, emit=(0.88, 0.94, 1.0), strength=3500.0)
panel = comp.mat("school_panel", (0.95, 0.98, 1.0), rough=0.3, emit=(0.9, 0.97, 1.0), strength=9000.0)
white = comp.mat("school_white", (0.86, 0.86, 0.84), rough=0.5)
cork = comp.mat("school_cork", (0.55, 0.38, 0.22), rough=0.9)
exit_m = comp.mat("school_exit", (0.2, 1.0, 0.4), rough=0.3, emit=(0.15, 1.0, 0.35), strength=6000.0)
papers = [comp.mat(f"school_paper_{i}", c, rough=0.8) for i, c in enumerate(((0.92, 0.9, 0.84), (0.95, 0.82, 0.3), (0.55, 0.78, 0.9), (0.95, 0.55, 0.5), (0.7, 0.88, 0.6)))]

parts = {k: [] for k in ("teal", "dark", "chrome", "frame", "oak", "glass", "white", "cork", "block", "border")}
pp = [[] for _ in papers]
DOORS = {1: [P * 1.5 + 2 * P * k for k in range(7) if P * 1.5 + 2 * P * k < L - 4], -1: [P * 0.5 + 2 * P * k for k in range(7) if P * 0.5 + 2 * P * k < L - 4]}
rnd = np.random.default_rng(12)


def X_(sign, d):
    return sign * (W2 - d)


def sl(sign, d0, d1, y0, y1, z0, z1):
    return slab(X_(sign, d0), X_(sign, d1), y0, y1, z0, z1)


for sign in (1, -1):
    parts["block"].append(sl(sign, -0.1, 0.0, Y0, L, 0.0, H))
    # the stretches of lockers between the doors (each door has 2.6 m of wall round it: the door and a corkboard)
    stops = [(yc - 0.75, yc + 1.85) if sign > 0 else (yc - 1.85, yc + 0.75) for yc in DOORS[sign]]
    at, runs = Y0, []
    for a, b in stops:
        runs.append((at, a)); at = b
    runs.append((at, L))
    for a, b in runs:
        k = int((b - a) / LW)
        if k < 1:
            continue
        a0 = a + ((b - a) - k * LW) / 2
        parts["dark"].append(sl(sign, 0.0, 0.03, a0, a0 + k * LW, 0.0, LZ0))                # the plinth
        parts["teal"] += [sl(sign, 0.0, 0.01, a0, a0 + k * LW, LZ0, LZ1), sl(sign, -0.0, 0.05, a0 - 0.01, a0 + k * LW + 0.01, LZ1, LZ1 + 0.04)]
        for i in range(k):
            y0 = a0 + i * LW
            parts["teal"].append(sl(sign, 0.01, 0.026, y0 + 0.012, y0 + LW - 0.012, LZ0 + 0.03, LZ1 - 0.03))   # the door
            for z in (LZ1 - 0.14, LZ1 - 0.11, LZ1 - 0.08, LZ0 + 0.1, LZ0 + 0.13, LZ0 + 0.16):
                parts["dark"].append(sl(sign, 0.026, 0.028, y0 + 0.08, y0 + LW - 0.08, z, z + 0.012))   # louvres
            hy = y0 + LW - 0.05
            parts["chrome"] += [sl(sign, 0.026, 0.045, hy - 0.012, hy + 0.012, 0.98, 1.12), sl(sign, 0.026, 0.03, y0 + 0.11, y0 + 0.2, 1.5, 1.53)]
    for yc in DOORS[sign]:
        y0, y1 = yc - DW / 2, yc + DW / 2
        parts["frame"] += [sl(sign, 0.0, 0.03, y0 - 0.06, y0, 0.0, DH + 0.06), sl(sign, 0.0, 0.03, y1, y1 + 0.06, 0.0, DH + 0.06), sl(sign, 0.0, 0.03, y0 - 0.06, y1 + 0.06, DH, DH + 0.06),
                           sl(sign, 0.0, 0.03, y0 - 0.06, y1 + 0.06, DH + 0.42, DH + 0.48), sl(sign, 0.0, 0.03, y0 - 0.06, y0, DH + 0.06, DH + 0.42), sl(sign, 0.0, 0.03, y1, y1 + 0.06, DH + 0.06, DH + 0.42)]
        parts["glass"] += [sl(sign, -0.01, 0.0, y0, y1, DH + 0.06, DH + 0.42)]
        gy = yc + 0.2 * (1 if sign > 0 else -1)
        parts["oak"] += [sl(sign, 0.0, 0.012, y0, gy - 0.09, 0.0, DH), sl(sign, 0.0, 0.012, gy + 0.09, y1, 0.0, DH), sl(sign, 0.0, 0.012, gy - 0.09, gy + 0.09, 0.0, 1.05), sl(sign, 0.0, 0.012, gy - 0.09, gy + 0.09, 1.95, DH)]
        parts["glass"].append(sl(sign, -0.005, 0.004, gy - 0.09, gy + 0.09, 1.05, 1.95))
        parts["chrome"] += [sl(sign, 0.012, 0.03, yc - 0.38 * (1 if sign > 0 else -1) - 0.02, yc - 0.38 * (1 if sign > 0 else -1) + 0.02, 1.0, 1.06), sl(sign, 0.03, 0.045, yc - 0.38 * (1 if sign > 0 else -1) - 0.1, yc - 0.38 * (1 if sign > 0 else -1) + 0.02, 1.01, 1.05)]
        # the corkboard beside it, its notices
        cb0, cb1 = (y1 + 0.25, y1 + 1.35) if sign > 0 else (y0 - 1.35, y0 - 0.25)
        parts["frame"].append(sl(sign, 0.0, 0.02, cb0 - 0.03, cb1 + 0.03, 0.97, 1.83))
        parts["cork"].append(sl(sign, 0.02, 0.024, cb0, cb1, 1.0, 1.8))
        for j in range(9):
            pw, ph = 0.14 + 0.08 * rnd.random(), 0.18 + 0.1 * rnd.random()
            py, pz = cb0 + 0.05 + (cb1 - cb0 - 0.1 - pw) * rnd.random(), 1.04 + (0.72 - ph) * rnd.random()
            pp[rnd.integers(0, len(papers))].append(sl(sign, 0.024, 0.026 + 0.0005 * j, py, py + pw, pz, pz + ph))
        # a round clock over the door
        cz = DH + 0.6 + 0.0
        if cz + 0.17 < H - 0.02:
            c1 = comp.cyl(0.16, 0.04, at=(0, 0, 0), seg=32, axis="X"); xf(c1, T(X_(sign, 0.04) if sign > 0 else X_(sign, 0.0), yc, cz))
            c2 = comp.cyl(0.14, 0.01, at=(0, 0, 0), seg=32, axis="X"); xf(c2, T(X_(sign, 0.05) if sign > 0 else X_(sign, 0.04), yc, cz))
            parts["dark"].append(c1); parts["white"].append(c2)
            parts["dark"] += [sl(sign, 0.05, 0.054, yc - 0.006, yc + 0.006, cz, cz + 0.1), sl(sign, 0.05, 0.054, yc, yc + 0.08, cz - 0.005, cz + 0.005)]

# the floor's border, the ceiling and its panels
parts["border"] += [slab(W2 - 0.22, W2, Y0, L, 0.0, 0.003), slab(-W2, -W2 + 0.22, Y0, L, 0.0, 0.003)]
ceil = slab(-W2 - 0.1, W2 + 0.1, Y0, L, H, H + 0.05)
lit = []
for k in range(int((L - 1.2) / 2.4) + 1):
    yc = 1.2 + 2.4 * k
    parts["white"].append(slab(-0.32, 0.32, yc - 0.62, yc + 0.62, H - 0.015, H))
    lit.append(slab(-0.29, 0.29, yc - 0.59, yc + 0.59, H - 0.02, H - 0.012))

# the far end: block wall, two fire doors with portholes, an exit sign
parts["block"] += [slab(-W2 - 0.1, -0.95, L, L + 0.1, 0.0, H), slab(0.95, W2 + 0.1, L, L + 0.1, 0.0, H), slab(-0.95, 0.95, L, L + 0.1, 2.25, H)]
for s_ in (-1, 1):
    x0, x1 = (0.0, 0.9) if s_ > 0 else (-0.9, 0.0)
    leaf = slab(x0 + 0.01 * s_, x1, L - 0.04, L, 0.0, 2.2)
    parts["frame"].append(leaf)
    parts["chrome"] += [slab(x0 + 0.08 * s_, x1 - 0.08 * s_, L - 0.1, L - 0.07, 1.0, 1.05), slab(x0 + 0.1 * s_, x0 + 0.13 * s_, L - 0.07, L - 0.04, 1.0, 1.05), slab(x1 - 0.13 * s_, x1 - 0.1 * s_, L - 0.07, L - 0.04, 1.0, 1.05)]
    ring = comp.cyl(0.18, 0.03, at=(0, 0, 0), seg=40, axis="Y"); xf(ring, T(s_ * 0.45, L - 0.05, 1.55))
    win = comp.cyl(0.15, 0.03, at=(0, 0, 0), seg=40, axis="Y"); xf(win, T(s_ * 0.45, L - 0.055, 1.55))
    parts["chrome"].append(ring); parts["glass"].append(win)
parts["frame"] += [slab(-0.97, 0.97, L - 0.05, L, 2.2, 2.26), slab(-0.97, -0.9, L - 0.05, L, 0.0, 2.2), slab(0.9, 0.97, L - 0.05, L, 0.0, 2.2)]
parts["dark"].append(slab(-0.25, 0.25, L - 0.1, L - 0.02, 2.36, 2.56))
sign_t = comp.text("EXIT", 0.13, depth=0.004); xf(sign_t, T(0, L - 0.105, 2.46))

o = M("school_floor", slab(-W2, W2, Y0, L, -0.02, 0.0), terrazzo)
uv_set(o, lambda p, n: (p.x, p.y))
o = M("school_ceiling", ceil, tiles)
uv_set(o, lambda p, n: (p.x, p.y))
o = M("school_walls", comp.merge(*parts["block"]), block)
uv_set(o, lambda p, n: (p.y, p.z) if abs(n.x) > 0.5 else (p.x, p.z))
M("school_panels", comp.merge(*lit), panel)
M("school_exit", sign_t, exit_m)
for key, m in (("teal", teal), ("dark", dark), ("chrome", chrome), ("frame", frame_m), ("oak", oak), ("glass", glass), ("white", white), ("cork", cork), ("border", border)):
    if parts[key]:
        M(f"school_{key}", comp.merge(*parts[key]), m, smooth=key == "chrome")
for i, ps in enumerate(pp):
    if ps:
        M(f"school_notices_{i}", comp.merge(*ps), papers[i])
comp.export(col, root, _lib.PLACE, "school", made="blender/components/corridors/school.py", source="own geometry; terrazzo, block and ceiling tile drawn in numpy (blender/components/corridors/_lib.py); EXIT in Blender's built-in font", license="ours", credit="",
            rig={"lights": "in the scene: the materials school_panel, school_glass and school_exit glow"},
            notes="Shell part, the corridors' section (3.0 m wide, 2.8 m high); origin on the floor's centre line where the lens starts, the corridor running 60 m along +y (raea -z).")
