# kelp/sea-stars: three sea stars on the rock, modelled by hand: a bat star (webbed arms, orange-red, 16 cm), an ochre
# star (purple, 24 cm, rows of white tubercles down its arms) and a small blood star (red, 9 cm). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("sea_stars")
def star(radius, inner, power, height, turn, at):
    bm = bmesh.new()
    NT, NS = 80, 9
    c = bm.verts.new((0, 0, height))
    rings = []
    for s in range(1, NS + 1):
        f = s / NS
        ring = []
        for i in range(NT):
            a = 2 * math.pi * i / NT
            arm = (0.5 + 0.5 * math.cos(5 * a)) ** power
            rm = radius * (inner + (1 - inner) * arm)
            z = height * (1 - f ** 1.7) * (0.45 + 0.55 * arm) + 0.002
            ring.append(bm.verts.new((f * rm * math.cos(a), f * rm * math.sin(a), z if s < NS else 0.0)))
        rings.append(ring)
    for i in range(NT):
        bm.faces.new((c, rings[0][i], rings[0][(i + 1) % NT]))
    for a, b in zip(rings, rings[1:]):
        for i in range(NT):
            j = (i + 1) % NT
            bm.faces.new((a[i], b[i], b[j], a[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    xf(bm, R(turn, "Z"))
    return xf(bm, T(*at))
comp.mesh(col, root, "sea_stars_bat_star", star(0.08, 0.5, 1.3, 0.022, 12, (0, 0, 0)), L.ambient(comp.mat("sea_star_bat", (0.85, 0.22, 0.04), rough=0.6), 60.0), smooth=True)
comp.mesh(col, root, "sea_stars_ochre_star", star(0.12, 0.24, 2.4, 0.03, 40, (0.27, 0.1, 0)), L.ambient(comp.mat("sea_star_ochre", (0.3, 0.1, 0.42), rough=0.6), 60.0), smooth=True)
tub = []
for k in range(5):
    a = math.radians(72 * k + 40)
    for j in range(7):
        d = 0.012 + j * 0.015
        tub.append(L.ball(0.0035, (0.27 + d * math.cos(a), 0.1 + d * math.sin(a), 0.03 * (1 - (d / 0.12) ** 1.7) * 0.9 + 0.003), sub=1))
comp.mesh(col, root, "sea_stars_ochre_tubercles", comp.merge(*tub), L.ambient(comp.mat("sea_star_tubercle", (0.85, 0.82, 0.78), rough=0.5), 60.0))
comp.mesh(col, root, "sea_stars_blood_star", star(0.045, 0.2, 2.8, 0.012, -20, (-0.14, 0.17, 0)), L.ambient(comp.mat("sea_star_blood", (0.7, 0.05, 0.04), rough=0.5), 60.0), smooth=True)
comp.export(col, root, "kelp", "sea_stars", made="blender/components/kelp/sea_stars.py", source="own geometry (a bat star, an ochre star, a blood star)", license="ours", credit="")
