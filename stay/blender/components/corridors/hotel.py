# corridors/hotel: an old grand hotel's corridor, 60 m of it, modelled by hand: wall-to-wall carpet (burgundy with a
# gold diamond lattice and a navy border, drawn here), walnut wainscot with raised panel frames, a chair rail and a
# skirting, striped wallpaper above, a cream crown moulding and a beamed ceiling; oxblood lacquered room doors in white
# casings on alternate sides every 4.4 m, each with a brass lever, peephole and numbered plate; a pair of brass sconces
# with lit drum shades facing each other between the doors, a flush light on the ceiling between each pair, and at the
# far end a tall window of daylight between velvet curtains. The section is the corridors' (_lib.py): 3.0 m between the
# walls, 2.8 m to the ceiling. Origin: the floor's centre line where the lens starts; the corridor runs along +y.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, np, slab, sphere, prism, W2, H, Y0, L, save_image, image_mat, uv_set, noise

col, root = comp.fresh("hotel")
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
P = 4.4                                                   # the bay: a sconce pair every P, a door every P (sides alternate)
DW, DH, CAS = 0.95, 2.15, 0.09

# --- the carpet: 3.0 m across by 1.5 m along, 2 mm a pixel --------------------------------------------------------
h, w = 750, 1500
x = (np.arange(w, dtype=np.float32) + 0.5) / w * 3.0 - 1.5
y = (np.arange(h, dtype=np.float32) + 0.5) / h * 1.5
X, Y = np.meshgrid(x, y)
burg, gold, navy, cream = np.array([0.36, 0.055, 0.065]), np.array([0.72, 0.53, 0.2]), np.array([0.055, 0.075, 0.19]), np.array([0.8, 0.72, 0.56])
img = np.broadcast_to(burg, (h, w, 3)).copy()
dx, dy = np.mod(X / 0.5, 1.0) - 0.5, np.mod(Y / 0.5, 1.0) - 0.5
d = np.abs(dx) + np.abs(dy)
for m, c in ((np.abs(d - 0.36) < 0.009, cream), (np.abs(d - 0.5) < 0.026, gold), (d < 0.13, navy), (d < 0.045, gold), (np.abs(d - 0.2) < 0.008, gold)):
    img[m] = c
ax = np.abs(X)
img[ax > 1.18] = navy
for a, b in ((1.18, 1.2), (1.36, 1.38)):
    img[(ax > a) & (ax < b)] = gold
dot = (ax > 1.27) & (ax < 1.31) & (np.abs(np.mod(Y, 0.15) - 0.075) < 0.02)
img[dot] = gold
wear = 0.84 + 0.16 * noise(h, w, 60, 1)[:, :, None]
fibre = 0.95 + 0.05 * np.random.default_rng(2).random((h, w, 1)).astype(np.float32)
carpet = image_mat("hotel_carpet", save_image("hotel-carpet", img * wear * fibre), size=(3.0, 1.5), offset=(1.5, 0.0), rough=0.95)

# --- the wallpaper: stripes, 0.6 m by 0.6 m ---------------------------------------------------------------------
h, w = 600, 600
u = (np.arange(w, dtype=np.float32) + 0.5) / w * 0.6
v = (np.arange(h, dtype=np.float32) + 0.5) / h * 0.6
U, V = np.meshgrid(u, v)
wide, narrow, line = np.array([0.74, 0.69, 0.54]), np.array([0.62, 0.58, 0.44]), np.array([0.58, 0.47, 0.28])
img = np.broadcast_to(wide, (h, w, 3)).copy()
s = np.mod(U, 0.15)
img[s > 0.1] = narrow
img[(np.abs(s - 0.1) < 0.002) | (np.abs(s - 0.15) < 0.002) | (s < 0.002)] = line
# a small lozenge in the wide stripe every 0.3 m up
lz = (np.abs(np.mod(U, 0.15) - 0.05) / 0.022 + np.abs(np.mod(V, 0.3) - 0.15) / 0.045) < 1.0
img[lz] = img[lz] * 0.86
img *= (0.93 + 0.07 * noise(h, w, 80, 3))[:, :, None]
paper = image_mat("hotel_wallpaper", save_image("hotel-wallpaper", img), size=(0.6, 0.6), rough=0.75)

walnut = comp.mat("hotel_walnut", (0.12, 0.06, 0.032), rough=0.36)
paint = comp.mat("hotel_paint", (0.8, 0.76, 0.66), rough=0.7)
door_m = comp.mat("hotel_door", (0.2, 0.04, 0.035), rough=0.28)
brass = comp.mat("hotel_brass", (0.8, 0.58, 0.28), rough=0.26, metal=1.0)
ink = comp.mat("hotel_ink", (0.03, 0.025, 0.02), rough=0.4)
shade = comp.mat("hotel_shade", (1.0, 0.85, 0.62), rough=0.6, emit=(1.0, 0.72, 0.42), strength=30000.0)
dome = comp.mat("hotel_ceiling_light", (1.0, 0.92, 0.8), rough=0.4, emit=(1.0, 0.8, 0.55), strength=12000.0)
sky = comp.mat("hotel_window", (0.9, 0.95, 1.0), rough=0.2, emit=(0.86, 0.92, 1.0), strength=5000.0)
velvet = comp.mat("hotel_curtain", (0.28, 0.03, 0.045), rough=0.85)

parts = {k: [] for k in ("walnut", "paint", "door", "brass", "ink", "shade", "dome", "paper_r", "paper_l")}
DOORS = {1: [P * 1.5 + 2 * P * k for k in range(7) if P * 1.5 + 2 * P * k < L - 4], -1: [P * 0.5 + 2 * P * k for k in range(7) if P * 0.5 + 2 * P * k < L - 4]}


def X_(sign, d):
    """the x of a point `d` metres proud of a side's wall face, toward the corridor's middle"""
    return sign * (W2 - d)


def sl(sign, d0, d1, y0, y1, z0, z1):
    a, b = X_(sign, d0), X_(sign, d1)
    return slab(min(a, b), max(a, b), y0, y1, z0, z1)


def free(sign):
    """the stretches of a side's wall between its doors' casings"""
    out, at = [], Y0
    for yc in DOORS[sign]:
        out.append((at, yc - DW / 2 - CAS))
        at = yc + DW / 2 + CAS
    out.append((at, L))
    return [(a, b) for a, b in out if b - a > 0.05]


num = 101
for sign in (1, -1):
    parts["paper_r" if sign > 0 else "paper_l"].append(sl(sign, -0.1, 0.0, Y0, L, 1.0, 2.56))
    parts["walnut"].append(sl(sign, -0.1, 0.0, Y0, L, 0.0, 1.0))
    # the crown moulding: three steps out to 0.1 m under the ceiling
    for d, z0 in ((0.025, 2.56), (0.05, 2.64), (0.1, 2.72)):
        parts["paint"].append(sl(sign, 0.0, d, Y0, L, z0, H))
    for a, b in free(sign):
        parts["walnut"].append(sl(sign, 0.0, 0.02, a, b, 0.0, 0.15))                  # the skirting
        parts["walnut"].append(sl(sign, 0.0, 0.03, a, b, 0.95, 1.0))                  # the chair rail
        parts["walnut"].append(sl(sign, 0.0, 0.012, a, b, 0.985, 1.02))
        # raised panel frames, about a metre each
        n = max(1, round((b - a) / 1.0))
        pw = (b - a) / n
        for i in range(n):
            p0, p1 = a + i * pw + 0.07, a + (i + 1) * pw - 0.07
            if p1 - p0 < 0.2:
                continue
            for z0, z1 in ((0.24, 0.27), (0.83, 0.86)):
                parts["walnut"].append(sl(sign, 0.0, 0.012, p0, p1, z0, z1))
            for y_ in (p0, p1 - 0.03):
                parts["walnut"].append(sl(sign, 0.0, 0.012, y_, y_ + 0.03, 0.27, 0.83))
    for yc in DOORS[sign]:
        y0, y1 = yc - DW / 2, yc + DW / 2
        # the casing, the leaf in it, its two raised panels, and its brass
        parts["paint"] += [sl(sign, 0.0, 0.03, y0 - CAS, y0, 0.0, DH + CAS), sl(sign, 0.0, 0.03, y1, y1 + CAS, 0.0, DH + CAS), sl(sign, 0.0, 0.03, y0, y1, DH, DH + CAS),
                           sl(sign, 0.0, 0.045, y0 - CAS - 0.02, y1 + CAS + 0.02, DH + CAS, DH + CAS + 0.05)]
        parts["door"].append(sl(sign, 0.0, 0.012, y0, y1, 0.0, DH))
        for z0, z1 in ((0.18, 0.95), (1.1, 2.0)):
            parts["door"] += [sl(sign, 0.012, 0.02, y0 + 0.12, y1 - 0.12, z0, z0 + 0.04), sl(sign, 0.012, 0.02, y0 + 0.12, y1 - 0.12, z1 - 0.04, z1),
                              sl(sign, 0.012, 0.02, y0 + 0.12, y0 + 0.16, z0, z1), sl(sign, 0.012, 0.02, y1 - 0.16, y1 - 0.12, z0, z1)]
        hy = y0 + 0.1 if sign > 0 else y1 - 0.1                                        # (the lever on the side away from the hinge)
        lever_dir = 1 if sign > 0 else -1
        parts["brass"] += [comp.cyl(0.03, 0.012, at=(X_(sign, 0.012), hy, 1.02), seg=16, axis="X") if sign < 0 else xf(comp.cyl(0.03, 0.012, at=(0, 0, 0), seg=16, axis="X"), T(X_(sign, 0.024), hy, 1.02)),
                           sl(sign, 0.02, 0.065, hy - 0.008, hy + 0.008, 1.012, 1.028),
                           sl(sign, 0.055, 0.07, hy, hy + lever_dir * 0.13, 1.008, 1.03),
                           sl(sign, 0.012, 0.02, yc - 0.065, yc + 0.065, 1.5, 1.57),
                           comp.cyl(0.008, 0.01, at=(X_(sign, 0.012), yc, 1.45), seg=10, axis="X") if sign < 0 else xf(comp.cyl(0.008, 0.01, at=(0, 0, 0), seg=10, axis="X"), T(X_(sign, 0.022), yc, 1.45))]
        t = comp.text(str(num), 0.045, depth=0.002)
        xf(t, R(-90 * sign, "Z"))
        xf(t, T(X_(sign, 0.021), yc, 1.535))
        parts["ink"].append(t)
        num += 1
    # the sconces, a pair every bay, facing each other
    for k in range(int((L - 1) / P) + 1):
        yc = k * P
        if any(abs(yc - dy) < 0.9 for dy in DOORS[sign]) or yc < Y0 + 0.5:
            continue
        parts["brass"] += [sl(sign, 0.0, 0.015, yc - 0.05, yc + 0.05, 1.62, 1.84), sl(sign, 0.015, 0.14, yc - 0.008, yc + 0.008, 1.7, 1.716),
                           comp.cyl(0.012, 0.06, at=(X_(sign, 0.14), yc, 1.7), seg=10)]
        sh = comp.cyl(0.1, 0.17, at=(X_(sign, 0.14), yc, 1.74), seg=24, r2=0.075)
        parts["shade"].append(sh)

# the ceiling, its beams across between the sconce pairs, and a flush light in each bay's middle
parts["paint"].append(slab(-W2 - 0.1, W2 + 0.1, Y0, L, H, H + 0.1))
for k in range(int((L - 1) / P) + 1):
    yb = k * P + P / 2
    if yb < L - 0.3:
        parts["paint"] += [slab(-W2, W2, yb - 0.14, yb + 0.14, H - 0.18, H), slab(-W2, W2, yb - 0.17, yb + 0.17, H - 0.04, H)]
    yl = k * P
    if yl > Y0 + 0.5:
        parts["brass"].append(comp.cyl(0.15, 0.02, at=(0, yl, H - 0.02), seg=24))
        parts["dome"].append(xf(sphere(0.13, at=(0, 0, 0), scale=(1, 1, 0.45), u=24, v=10), T(0, yl, H - 0.025)))

# the far end: a wall of the same paper and wainscot, a tall window of daylight in it between velvet curtains
end = [slab(-W2 - 0.1, -0.55, L, L + 0.1, 1.0, 2.56), slab(0.55, W2 + 0.1, L, L + 0.1, 1.0, 2.56), slab(-0.55, 0.55, L, L + 0.1, 2.42, 2.56)]
o = M("hotel_end_paper", comp.merge(*end), paper)
uv_set(o, lambda p, n: (p.x, p.z))
parts["walnut"] += [slab(-W2, -0.55, L - 0.0, L + 0.1, 0.0, 1.0), slab(0.55, W2, L, L + 0.1, 0.0, 1.0), slab(-0.55, 0.55, L, L + 0.1, 0.0, 0.62)]
parts["paint"] += [slab(-0.6, 0.6, L - 0.06, L, 0.58, 0.64), slab(-0.6, -0.5, L - 0.06, L, 0.62, 2.46), slab(0.5, 0.6, L - 0.06, L, 0.62, 2.46), slab(-0.6, 0.6, L - 0.06, L, 2.4, 2.46),
                   slab(-0.02, 0.02, L - 0.04, L, 0.64, 2.4), slab(-0.5, 0.5, L - 0.04, L, 1.52, 1.56), slab(-0.5, 0.5, L - 0.04, L, 1.98, 2.01), slab(-0.5, 0.5, L - 0.04, L, 1.06, 1.09)]
M("hotel_window", slab(-0.5, 0.5, L + 0.02, L + 0.05, 0.62, 2.42), sky)
folds = []
for side in (-1, 1):
    for i in range(7):
        xc = side * (0.62 + 0.055 * i)
        folds.append(comp.cyl(0.045, 2.45, at=(xc, L - 0.12 - 0.03 * (i % 2), 0.02), seg=10))
    folds.append(slab(side * 0.58 - 0.0, side * 1.05, L - 0.2, L - 0.16, 2.47, 2.62) if side > 0 else slab(-1.05, -0.58, L - 0.2, L - 0.16, 2.47, 2.62))
M("hotel_curtains", comp.merge(*folds), velvet, smooth=True)

o = M("hotel_carpet", slab(-W2, W2, Y0, L, -0.02, 0.0), carpet)
uv_set(o, lambda p, n: (p.x, p.y))
for side, key in ((1, "paper_r"), (-1, "paper_l")):
    o = M(f"hotel_wallpaper_{'right' if side > 0 else 'left'}", comp.merge(*parts[key]), paper)
    uv_set(o, lambda p, n: (p.y, p.z))
M("hotel_wainscot", comp.merge(*parts["walnut"]), walnut)
M("hotel_paintwork", comp.merge(*parts["paint"]), paint)
M("hotel_doors", comp.merge(*parts["door"]), door_m)
M("hotel_brass", comp.merge(*parts["brass"]), brass, smooth=True)
M("hotel_numbers", comp.merge(*parts["ink"]), ink)
M("hotel_shades", comp.merge(*parts["shade"]), shade, smooth=True)
M("hotel_ceiling_lights", comp.merge(*parts["dome"]), dome, smooth=True)
comp.export(col, root, _lib.PLACE, "hotel", made="blender/components/corridors/hotel.py", source="own geometry; carpet and wallpaper drawn in numpy (blender/components/corridors/_lib.py); numbers in Blender's built-in font", license="ours", credit="",
            rig={"lights": "in the scene: the materials hotel_shade, hotel_ceiling_light and hotel_window glow"},
            notes="Shell part, the corridors' section (3.0 m wide, 2.8 m high); origin on the floor's centre line where the lens starts, the corridor running 60 m along +y (raea -z).")
