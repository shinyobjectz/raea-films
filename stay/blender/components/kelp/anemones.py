# kelp/anemones: three sea anemones on the rock, modelled by hand: a giant green anemone 18 cm across and two rose
# anemones, each a column, an oral disc with its mouth, and three rings of tapering tentacles (about 70 each) on a
# crown of its own. Rig: "sway" tips each crown its own way, up to 14 degrees, about the top of its column.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("anemones")
rnd = random.Random(2)
keys = []
kinds = [(0.0, 0.0, 0.09, 0.1, (0.08, 0.42, 0.2), (0.2, 0.75, 0.4), 90.0), (0.24, 0.1, 0.05, 0.07, (0.5, 0.08, 0.14), (0.9, 0.35, 0.45), 0.0), (-0.2, 0.16, 0.045, 0.06, (0.55, 0.1, 0.12), (0.95, 0.6, 0.6), 0.0)]
for n, (x, y, r, h, body_c, tent_c, glow) in enumerate(kinds):
    comp.mesh(col, root, f"anemones_column_{n + 1}", xf(L.lathe([(r * 1.15, 0.0), (r * 0.95, h * 0.2), (r * 0.9, h * 0.75), (r * 1.02, h), (0, h)], seg=24), T(x, y, 0)), L.ambient(comp.mat(f"anemone_column_{n + 1}", body_c, rough=0.45), 55.0), smooth=True)
    p = comp.pivot(col, root, f"anemones_crown_{n + 1}", (x, y, h))
    disc = L.lathe([(r * 1.02, h), (r * 0.6, h + 0.004), (r * 0.16, h + 0.002), (r * 0.1, h + 0.012), (0.0, h + 0.006)], seg=24)
    tm = comp.mat(f"anemone_tentacles_{n + 1}", tent_c, rough=0.35, emit=tent_c, strength=glow or 45.0)
    comp.mesh(col, root, f"anemones_disc_{n + 1}", xf(disc, T(x, y, 0)), tm, parent=p, smooth=True)
    ts = []
    for ring, (rr, cnt, out, ln) in enumerate(((1.0, 30, 62, 1.0), (0.84, 24, 42, 0.9), (0.66, 18, 24, 0.75))):
        for i in range(cnt):
            a = 2 * math.pi * i / cnt + ring * 0.1
            t = comp.cyl(r * 0.075, r * 0.8 * ln * rnd.uniform(0.8, 1.15), seg=5, r2=r * 0.02)
            xf(t, R(out + rnd.uniform(-10, 10), "Y"))
            xf(t, R(math.degrees(a), "Z"))
            xf(t, T(x + rr * r * math.cos(a), y + rr * r * math.sin(a), h))
            ts.append(t)
    comp.mesh(col, root, f"anemones_tentacles_{n + 1}", comp.merge(*ts), tm, parent=p, smooth=True)
    keys += [(p, "rotation_euler", 0, 0.0, math.radians(rnd.uniform(8, 14) * rnd.choice((-1, 1)))), (p, "rotation_euler", 1, 0.0, math.radians(rnd.uniform(4, 10)))]
L.channel("sway", keys)
comp.export(col, root, "kelp", "anemones", made="blender/components/kelp/anemones.py", source="own geometry (a giant green anemone and two rose anemones)", license="ours", credit="",
            rig={"sway": "each crown of tentacles (anemones_crown_N) tips up to 14 degrees about the top of its column"})
