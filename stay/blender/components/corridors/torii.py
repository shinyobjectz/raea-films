# corridors/torii: a tunnel of vermilion torii gates up a forest path, 60 m of it, modelled by hand: a gate every 2 m,
# each two lacquered pillars on black bases, a tie beam through them, a strut, and a black kasagi with upswept ends on
# its vermilion shimaki (the opening between the pillars is the corridors' 3.0 m wide less a little, the kasagi's top
# 2.8 m up); a path of flagstones between mossy stone curbs, gravel and leaves out under the gates, and now and then a
# stone lantern outside them. The cedars and ferns round it are the forest's own parts (v3/places.tsx). Textures: Poly
# Haven grey_stone_path, leaf_scattered_gravel, mossy_rock (CC0). Origin: the path's centre line where the lens starts;
# the path runs along +y.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, np, slab, sphere, W2, H, Y0, L, uv_set

col, root = comp.fresh("torii")
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
G = 2.0                                                     # a gate every G metres
XP, RP = 1.42, 0.115                                        # the pillars' centres and radius (their inner faces at 1.3)

flags = comp.ph_texture("torii_path", "grey_stone_path", tile=2.0, tint=(0.8, 0.8, 0.78))
gravel = comp.ph_texture("torii_ground", "leaf_scattered_gravel", tile=2.5)
moss = comp.ph_texture("torii_stone", "mossy_rock", tile=1.2, res="1k")
verm = comp.mat("torii_vermilion", (0.78, 0.15, 0.04), rough=0.42)
black = comp.mat("torii_black", (0.018, 0.016, 0.015), rough=0.3)


def bent(x0, x1, y0, y1, z0, z1, lift, n=24):
    """a beam from x0 to x1, its ends lifted by `lift` (a kasagi's upswept line)"""
    bm = bmesh.new()
    rows = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        k = (2 * i / n - 1)
        dz = lift * k ** 4
        rows.append([bm.verts.new((x, y, z + dz)) for y, z in ((y0, z0), (y1, z0), (y1, z1), (y0, z1))])
    for i in range(n):
        a, b = rows[i], rows[i + 1]
        for p, q in ((0, 1), (1, 2), (2, 3), (3, 0)):
            bm.faces.new((a[p], a[q], b[q], b[p]))
    bm.faces.new(rows[0]); bm.faces.new(list(reversed(rows[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


red, blk = [], []
for y in np.arange(-2.0, L - 1.0, G):
    for s in (-1, 1):
        red.append(comp.cyl(RP, 2.36, at=(s * XP, y, 0.3), seg=20))
        blk.append(comp.cyl(RP + 0.025, 0.3, at=(s * XP, y, 0.0), seg=20))
        blk.append(comp.cyl(RP + 0.035, 0.03, at=(s * XP, y, 0.27), seg=20))
    red.append(slab(-1.78, 1.78, y - 0.05, y + 0.05, 2.22, 2.36))                   # the nuki, through the pillars
    red.append(slab(-0.07, 0.07, y - 0.05, y + 0.05, 2.36, 2.6))                     # the strut
    red.append(bent(-1.86, 1.86, y - 0.08, y + 0.08, 2.6, 2.68, 0.03))                # the shimaki
    blk.append(bent(-2.02, 2.02, y - 0.11, y + 0.11, 2.68, 2.8, 0.1))                 # the kasagi
M("torii_vermilion", comp.merge(*red), verm, smooth=False)
M("torii_black", comp.merge(*blk), black)

# the path, its curbs, the ground
o = M("torii_path", slab(-0.95, 0.95, Y0, L + 4, -0.03, 0.02), flags)
uv_set(o, lambda p, n: (p.x, p.y))
rng = np.random.default_rng(3)
curbs = []
for s in (-1, 1):
    y = Y0
    while y < L + 4:
        ln = 0.5 + 0.5 * rng.random()
        c = slab(s * 0.95, s * 1.12, y, y + ln - 0.02, -0.02, 0.07 + 0.03 * rng.random())
        curbs.append(c)
        y += ln
lanterns = []
for y in np.arange(5.0, L - 2.0, 14.0):
    for s in (-1, 1):
        if rng.random() < 0.6:
            xc = s * (2.15 + 0.2 * rng.random())
            yc = y + G / 2 + 2 * (rng.random() - 0.5)
            lanterns += [slab(xc - 0.22, xc + 0.22, yc - 0.22, yc + 0.22, 0.0, 0.12), comp.cyl(0.07, 0.75, at=(xc, yc, 0.12), seg=8),
                         slab(xc - 0.2, xc + 0.2, yc - 0.2, yc + 0.2, 0.87, 0.95), slab(xc - 0.15, xc + 0.15, yc - 0.15, yc + 0.15, 0.95, 1.2),
                         comp.cyl(0.3, 0.14, at=(xc, yc, 1.2), seg=6, r2=0.04), sphere(0.05, at=(xc, yc, 1.37), u=8, v=6)]
o = M("torii_stones", comp.merge(*curbs, *lanterns), moss)
comp.uv_box(o)
o = M("torii_ground", slab(-14, 14, Y0 - 6, L + 10, -0.05, -0.01), gravel)
uv_set(o, lambda p, n: (p.x, p.y))
comp.export(col, root, _lib.PLACE, "torii", made="blender/components/corridors/torii.py", source="own geometry; textures https://polyhaven.com/a/grey_stone_path, https://polyhaven.com/a/leaf_scattered_gravel, https://polyhaven.com/a/mossy_rock", license="ours; textures CC0", credit="textures: Poly Haven",
            notes="Shell part, the corridors' section (gates 2.6 m between the pillars, 2.8 m to the kasagi's top); origin on the path's centre line where the lens starts, the gates running 60 m along +y (raea -z).")
