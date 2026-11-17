# gym/banners: three championship banners on the wall, modelled by hand: felt pennants 0.9 x 1.4 m with a swallow-tail
# foot, each on a wooden pole with a gold cord and two tassels, in the school's green, cream and green, sewn with a
# border and plain words (LEAGUE CHAMPIONS 1987, STATE FINALISTS 1991, LEAGUE CHAMPIONS 1994: no school's name). Its back
# at y 0; the origin is the middle pole. Rig: "sway" swings each banner out from the wall, 6 to 9 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import T, R, S, xf

col, root = comp.fresh("banners")
M = _lib.maker(col, root)
felt_g = comp.ph_texture("banners_green", "hessian_230", tile=0.4, res="1k", grey=True, tint=(0.05, 0.35, 0.18))
felt_c = comp.ph_texture("banners_cream", "hessian_230", tile=0.4, res="1k", grey=True, tint=(1.0, 0.92, 0.7))
gold = comp.mat("banners_gold", (0.75, 0.55, 0.12), rough=0.5)
wood = comp.mat("banners_pole", (0.3, 0.18, 0.08), rough=0.5)
ink_c = comp.mat("banners_letters_cream", (0.9, 0.85, 0.65), rough=0.8)
ink_g = comp.mat("banners_letters_green", (0.03, 0.2, 0.1), rough=0.8)
BW, BH = 0.9, 1.4
keys = []
for i, (x, felt, ink, lines, deg) in enumerate(((-1.15, felt_g, ink_c, ("LEAGUE", "CHAMPIONS", "1987"), 6), (0, felt_c, ink_g, ("STATE", "FINALISTS", "1991"), 9), (1.15, felt_g, ink_c, ("LEAGUE", "CHAMPIONS", "1994"), 7))):
    p = comp.pivot(col, root, f"banners_{i + 1}", (x, -0.03, 0))
    bm = bmesh.new()
    pts = [(-BW / 2, 0), (BW / 2, 0), (BW / 2, -BH), (0, -BH + 0.22), (-BW / 2, -BH)]
    a = [bm.verts.new((x + px, -0.03, pz)) for px, pz in pts]
    b = [bm.verts.new((x + px, -0.036, pz)) for px, pz in pts]
    bm.faces.new(a[::-1]); bm.faces.new(b)
    for k in range(5):
        bm.faces.new((a[k], a[(k + 1) % 5], b[(k + 1) % 5], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = M(f"banners_{i + 1}_felt", bm, felt, parent=p, smooth=False)
    comp.uv_box(o, 1.0)
    words = [xf(comp.text(s, h, depth=0.002), T(x, -0.0375, z)) for s, h, z in zip(lines, (0.15, 0.115, 0.26), (-0.28, -0.5, -0.82))]
    words += [comp.box((BW - 0.1, 0.002, 0.012), at=(x, -0.037, z)) for z in (-0.07, -0.64)]
    words += [comp.box((0.012, 0.002, BH - 0.3), at=(x + sx * (BW / 2 - 0.05), -0.037, -0.07 - (BH - 0.3) / 2)) for sx in (-1, 1)]
    M(f"banners_{i + 1}_letters", comp.merge(*words), ink, parent=p, smooth=False)
    M(f"banners_{i + 1}_pole", comp.merge(comp.cyl(0.014, BW + 0.12, at=(x - BW / 2 - 0.06, -0.03, 0.005), seg=10, axis="X"), *[_lib.sphere(0.022, at=(x + sx * (BW / 2 + 0.06), -0.03, 0.005), seg=10, rings=6) for sx in (-1, 1)]), wood, parent=p)
    cord = [_lib.rod((x + sx * (BW / 2 + 0.03), -0.03, 0.005), (x, -0.01, 0.3), 0.004, seg=5) for sx in (-1, 1)]
    cord += [_lib.lathe([(0.004, 0), (0.014, -0.02), (0.016, -0.1), (0, -0.1)], seg=8, at=(x + sx * (BW / 2 + 0.05), -0.03, -0.02)) for sx in (-1, 1)]
    M(f"banners_{i + 1}_cord", comp.merge(*cord), gold, parent=p)
    keys.append((p, "rotation_euler", 0, 0, math.radians(-deg)))
M("banners_nails", comp.merge(*[comp.cyl(0.006, 0.02, at=(x, -0.02, 0.3), seg=8, axis="Y") for x in (-1.15, 0, 1.15)]), comp.mat("banners_nails", (0.5, 0.5, 0.52), rough=0.4, metal=1.0))
comp.channel("sway", keys)
comp.export(col, root, "gym", "banners", made="blender/components/gym/banners.py",
            source="own geometry (generic pennants, no school's name); felt: https://polyhaven.com/a/hessian_230; letters in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (hessian_230)",
            rig={"sway": "each banner swings out from the wall about its pole, 6, 9 and 7 degrees"})
