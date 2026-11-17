# garage/ramp: the ramp up to the next level, 3.6 m wide, 6.6 m of 1 in 6 slope to a 1.2 m landing 1.1 m up, in the
# deck's concrete (Poly Haven's garage_floor, CC0): cross ribs for grip every 0.33 m, a kerb each side, an upstand
# wall 1 m high on the outer (+x) side with a tube handrail on brackets, a handrail on posts on the inner side, and
# yellow-and-black hazard stripes on the wall's and the kerbs' ends. Its foot's middle is the origin; it rises toward
# +y. No rig: what rolls down it is the trolley.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("ramp")
M = L.maker(col, root)
conc = comp.ph_texture("ramp_concrete", "garage_floor", tile=1.886, res="1k", tint=(0.74, 0.86, 1.0))
wallm = comp.ph_texture("ramp_wall", "concrete_wall_008", tile=2.71, res="1k")
yellow = comp.mat("ramp_yellow", (0.9, 0.7, 0.04), rough=0.55)
black = comp.mat("ramp_black", (0.02, 0.02, 0.02), rough=0.6)
galv = comp.mat("ramp_rail", (0.62, 0.63, 0.64), rough=0.36, metal=1.0)
W, RUN, RISE, LAND = 3.6, 6.6, 1.1, 1.2
SL = RISE / RUN
ANG = math.degrees(math.atan(SL))
def prism(prof, x0, x1):
    """A side profile [(y, z)] extruded from x0 to x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in prof]
    b = [bm.verts.new((x1, y, z)) for y, z in prof]
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    n = len(prof)
    for i in range(n):
        bm.faces.new((a[i], b[i], b[(i + 1) % n], a[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
deck = M("ramp_deck", prism([(0, 0), (RUN, RISE), (RUN + LAND, RISE), (RUN + LAND, RISE - 0.35), (RUN, RISE - 0.35), (2.1, 0)], -W / 2, W / 2), conc)
comp.uv_box(deck, 1.0)
ribs = []
for i in range(1, int(RUN / 0.33)):
    y = i * 0.33
    ribs.append(xf(comp.box((W - 0.5, 0.04, 0.014)), T(0, y, y * SL + 0.004) @ R(ANG, "X")))
rb = M("ramp_ribs", comp.merge(*ribs), conc)
comp.uv_box(rb, 1.0)
kerbs = []
for sx in (-1, 1):
    kerbs.append(prism([(0, 0), (0.0, 0.18), (RUN, RISE + 0.18), (RUN + LAND, RISE + 0.18), (RUN + LAND, RISE), (RUN, RISE)], sx * (W / 2) - 0.1 + sx * 0.1, sx * (W / 2) + 0.1 + sx * 0.1))
kb = M("ramp_kerbs", comp.merge(*kerbs), conc)
comp.uv_box(kb, 1.0)
wx = W / 2 + 0.2
wall = M("ramp_wall", prism([(0, 0), (0, 1.0), (RUN, RISE + 1.0), (RUN + LAND, RISE + 1.0), (RUN + LAND, RISE - 0.35), (RUN, RISE - 0.35), (2.1, 0)], wx, wx + 0.2), wallm)
comp.uv_box(wall, 1.0)
# hazard stripes on the ends that face the aisle
a, b = L.stripes(0.2, 1.0, 5, t=0.002)
M("ramp_wall_stripes_yellow", xf(a, T(wx + 0.1, 0, 0.5)), yellow)
M("ramp_wall_stripes_black", xf(b, T(wx + 0.1, 0, 0.5)), black)
ya, yb = [], []
for sx in (-1, 1):
    a, b = L.stripes(0.2, 0.18, 3, t=0.002)
    ya.append(xf(a, T(sx * (W / 2 + 0.1), 0, 0.09)))
    yb.append(xf(b, T(sx * (W / 2 + 0.1), 0, 0.09)))
M("ramp_kerb_stripes_yellow", comp.merge(*ya), yellow)
M("ramp_kerb_stripes_black", comp.merge(*yb), black)
# handrails
rails = []
top = lambda y: (min(y, RUN) * SL)
path = [(wx - 0.07, y, top(y) + 0.92) for y in (0.1, RUN, RUN + LAND - 0.1)]
rails.append(L.sweep(path, L.circle(0.021, 10)))
for y in [0.3 + i * 1.2 for i in range(7)]:
    rails.append(comp.cyl(0.008, 0.075, at=(wx - 0.07, y, top(y) + 0.9), seg=8, axis="X"))
ix = -W / 2 - 0.1
for h in (0.95, 0.5):
    rails.append(L.sweep([(ix, y, top(y) + 0.18 + h) for y in (0.1, RUN, RUN + LAND - 0.1)], L.circle(0.021, 10)))
for y in [0.1 + i * 1.28 for i in range(7)]:
    rails.append(comp.cyl(0.021, 0.97, at=(ix, y, top(y) + 0.18), seg=10))
    rails.append(comp.box((0.12, 0.12, 0.008), at=(ix, y, top(y) + 0.184)))
r = M("ramp_handrails", comp.merge(*rails), galv, smooth=True)
L.sharp(r, 40)
L.look(col, "ramp", eye=(-7, -7, 4), target=(0, 3.5, 0.6), lens=30)
comp.export(col, root, "garage", "ramp", made="blender/components/garage/ramp.py",
            source="own geometry; https://polyhaven.com/a/garage_floor, https://polyhaven.com/a/concrete_wall_008", license="ours; textures CC0",
            credit="Poly Haven (garage_floor, concrete_wall_008)", rig={}, notes="Foot at the origin, rising 1.1 m over 6.6 m toward +y (9.5 degrees), then a 1.2 m landing.")
