# bedroom/pennant: a felt summer-camp pennant and a row of glow-in-the-dark stars round it, modelled by hand: a green
# felt triangle 0.50 m long with a cream band, cream letters (CAMP PINE LAKE, a made-up camp) and two tie strips,
# pinned at its hoist with two brass tacks; nine plastic stars and a moon stuck to the wall (pennant_glow, a faint
# glow the scene can raise at night). Origin at the pennant's centre, its back on the wall.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, xf
col, root = comp.fresh("pennant")
M = _lib.maker(col, root)
rnd = random.Random(8)
felt = comp.ph_texture("pennant_felt", "polar_fleece", tile=0.2, res="1k", tint=(0.1, 0.42, 0.2), grey=True)
cream = comp.mat("pennant_cream", (0.93, 0.88, 0.7), rough=0.9)
glow = comp.mat("pennant_glow", (0.8, 0.95, 0.6), rough=0.5, emit=(0.5, 1.0, 0.4), strength=0.3)
brass = comp.mat("pennant_tack", (0.78, 0.6, 0.28), rough=0.25, metal=1.0)
L, Hh = 0.5, 0.2
tri = bmesh.new()
vs = [tri.verts.new(c) for c in ((-L / 2, -0.002, Hh / 2), (-L / 2, -0.002, -Hh / 2), (L / 2, -0.002, 0))]
tri.faces.new(vs)
o = M("pennant_felt", tri, felt)
comp.solidify(o, 0.002)
comp.uv_box(o, 1.0)
M("pennant_band", comp.merge(comp.box((0.035, 0.0006, Hh), at=(-L / 2 + 0.0175, -0.0036, 0)), comp.box((0.012, 0.0006, 0.07), at=(-L / 2 - 0.006, -0.002, Hh / 2 - 0.02)), comp.box((0.012, 0.0006, 0.07), at=(-L / 2 - 0.006, -0.002, -Hh / 2 + 0.02))), cream)
M("pennant_text", comp.merge(xf(comp.text("CAMP", 0.05, depth=0.0006), T(-0.11, -0.0036, 0.035)), xf(comp.text("PINE LAKE", 0.036, depth=0.0006), T(-0.075, -0.0036, -0.03))), cream)
M("pennant_tacks", comp.merge(*[comp.cyl(0.005, 0.003, at=(-L / 2 + 0.0175, -0.0065, s * (Hh / 2 - 0.02)), seg=12, axis="Y") for s in (-1, 1)]), brass)
stars = []
for i in range(9):
    a = i / 9 * 2 * math.pi + rnd.uniform(-0.2, 0.2)
    r = rnd.uniform(0.018, 0.034)
    s = bmesh.new()
    pts = [s.verts.new(((r if k % 2 == 0 else r * 0.45) * math.cos(k * math.pi / 5 + a), 0, (r if k % 2 == 0 else r * 0.45) * math.sin(k * math.pi / 5 + a))) for k in range(10)]
    s.faces.new(pts)
    bmesh.ops.recalc_face_normals(s, faces=s.faces)
    xf(s, T(0.36 * math.cos(a) + rnd.uniform(-0.04, 0.04), -0.0015, 0.24 * math.sin(a) + rnd.uniform(-0.03, 0.03)))
    stars.append(s)
moon = comp.cyl(0.04, 0.0015, seg=24, axis="Y")
bmesh.ops.bisect_plane(moon, geom=moon.verts[:] + moon.edges[:] + moon.faces[:], plane_co=(0.012, 0, 0), plane_no=(1, 0, 0.5), clear_outer=True)
xf(moon, T(0.3, -0.003, 0.3))
so = M("pennant_stars", comp.merge(*stars), glow)
comp.solidify(so, 0.0015)
M("pennant_moon", moon, glow)
comp.export(col, root, _lib.PLACE, "pennant", made="blender/components/bedroom/pennant.py", source="own geometry (a made-up camp's pennant); felt: https://polyhaven.com/a/polar_fleece", license="ours; texture CC0", credit="Poly Haven (polar_fleece)",
            rig={"glow": "in the scene: pennant_glow, the stick-on stars' glow once the room is dark"})
