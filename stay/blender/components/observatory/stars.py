# observatory/stars: the night sky through the slit, modelled by hand: 1 400 stars as small glowing discs on a 90 m
# shell above the horizon, six magnitudes of size, the brightest tinted blue-white or amber, thickened along a band
# for the Milky Way. The origin is the observer; the discs face it. The stars are their own material (stars_glow).
# Rig: "drift" turns the sky 15 degrees (an hour) about the pole, which rises 40 degrees toward -y.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import T, R, S, xf, Vector

col, root = comp.fresh("stars")
M = _lib.maker(col, root)
mats = [comp.mat("stars_glow", (1, 1, 1), rough=1.0, emit=(1.0, 1.0, 1.0), strength=9000.0), comp.mat("stars_glow_blue", (0.7, 0.8, 1), rough=1.0, emit=(0.65, 0.78, 1.0), strength=14000.0),
        comp.mat("stars_glow_amber", (1, 0.8, 0.6), rough=1.0, emit=(1.0, 0.72, 0.45), strength=14000.0)]
rnd = random.Random(88)
RS = 90.0
pole = _lib.axis_pivot(col, root, "stars_pole", R(50, "X"), mode="ZYX")
bms = [bmesh.new() for _ in mats]
band_n = Vector((0.5, 0.3, 0.8)).normalized()
n = 0
while n < 1400:
    d = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1))).normalized()
    if d.z < -0.25:
        continue
    if abs(d.dot(band_n)) > 0.16 and rnd.random() < 0.45:      # thin the sky away from the Milky Way's band
        continue
    n += 1
    mag = rnd.random() ** 3.2                                  # few bright
    r = 0.045 + 0.2 * mag
    k = 0 if mag < 0.45 else rnd.choice((0, 1, 2))
    a = Vector((0, 0, 1)).cross(d).normalized() if abs(d.z) < 0.99 else Vector((1, 0, 0))
    b = d.cross(a)
    c = d * RS
    vs = [bms[k].verts.new(c + (a * math.cos(t) + b * math.sin(t)) * r) for t in (2 * math.pi * i / 6 for i in range(6))]
    bms[k].faces.new(vs[::-1])
for bm, m, name in zip(bms, mats, ("white", "blue", "amber")):
    M(f"stars_{name}", bm, m, parent=pole, smooth=False)
_lib.channel("drift", [(pole, "rotation_euler", 2, 0, math.radians(-15))])
comp.export(col, root, "observatory", "stars", made="blender/components/observatory/stars.py", source="own geometry", license="ours", credit="",
            rig={"drift": "the sky turns 15 degrees (an hour) about the pole", "glow": "in the scene: the materials stars_glow, stars_glow_blue and stars_glow_amber"},
            notes="origin: the observer (the room's middle). a 90 m shell: keep the camera's far plane beyond it")
