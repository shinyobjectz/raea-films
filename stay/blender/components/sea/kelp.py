# sea/kelp: a patch of bull kelp at the surface by the rocks, 7 m across, modelled by hand: sixteen plants, each a
# rubbery stipe coming up out of the deep to a float bulb at the surface, with eight to twelve long ruffled blades trailing
# from it on the water, and four loose mats of torn wrack between them. Its origin is the still-water level at the
# patch's middle; the blades lie on the surface and the stipes run 2.5 m down. Rig: "sway" swings every plant's blades
# round its float (12 to 26 degrees, each its own amount) as the swell draws through; "rise" lifts the patch 0.35 m.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
random.seed(21)
col, root = comp.fresh("kelp")
M = _lib.maker(col, root)
blade_m = comp.mat("kelp_blade", (0.2, 0.13, 0.025), rough=0.22)
stipe_m = comp.mat("kelp_stipe", (0.26, 0.17, 0.04), rough=0.3)
wrack_m = comp.mat("kelp_wrack", (0.1, 0.08, 0.02), rough=0.4)
rise = comp.pivot(col, root, "kelp_rise", (0, 0, 0))
def blade(length, width, heading, wob):
    """a ribbon lying on the water from the origin toward `heading`, wandering and ruffled at its edges"""
    bm = bmesh.new()
    n = 14
    rows = []
    for i in range(n + 1):
        t = i / n
        d = length * t
        side = 0.25 * math.sin(t * 5.0 + wob) * t * length * 0.25
        w = width * math.sin(math.pi * min(1.0, t * 0.92 + 0.08)) ** 0.6
        ruff = 0.018 * math.sin(i * 2.3 + wob)
        rows.append([bm.verts.new((d, side - w / 2, 0.012 + ruff - 0.03 * t)), bm.verts.new((d, side, 0.022 - 0.03 * t)), bm.verts.new((d, side + w / 2, 0.012 - ruff - 0.03 * t))])
    for i in range(n):
        for j in range(2):
            bm.faces.new([rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]])
    xf(bm, R(heading, "Z"))
    return bm
keys = []
for k in range(16):
    a, r = random.uniform(0, 2 * math.pi), 3.3 * math.sqrt(random.random())
    x, y = r * math.cos(a), r * math.sin(a) * 0.8
    p = comp.pivot(col, root, f"kelp_{k + 1:02d}", (x, y, 0.0), parent=rise)
    rb = random.uniform(0.045, 0.07)
    bulb = _lib.sphere(rb, at=(0, 0, 0.0), u=12, v=8, scale=(1, 1, 1.25))
    lean = random.uniform(0.5, 1.2)
    st = comp.tube([(0, 0, -rb), (-0.1 * lean, 0.05, -0.5), (-0.5 * lean, 0.1, -1.4), (-1.0 * lean, 0.0, -2.5)], 0.016, res=8, sides=3)
    sb = comp.merge(bulb, st)
    xf(sb, T(x, y, 0))
    M(f"kelp_{k + 1:02d}_stipe", sb, stipe_m, parent=p, smooth=True)
    drift_dir = 20 + random.uniform(-25, 25)        # the blades trail down-current, toward +x
    bl = [blade(random.uniform(1.2, 2.6), random.uniform(0.13, 0.24), drift_dir + random.uniform(-38, 38), random.uniform(0, 6)) for _ in range(random.randint(8, 12))]
    b = comp.merge(*bl)
    xf(b, T(x, y, 0))
    M(f"kelp_{k + 1:02d}_blades", b, blade_m, parent=p, smooth=True)
    keys.append((p, "rotation_euler", 2, 0.0, math.radians(random.choice((-1, 1)) * random.uniform(12, 26))))
for k in range(4):
    a = k * 1.7 + 0.4
    x, y = 2.2 * math.cos(a), 1.8 * math.sin(a)
    mat_ = comp.merge(*[xf(blade(random.uniform(0.4, 0.9), random.uniform(0.05, 0.1), random.uniform(0, 360), random.uniform(0, 6)), T(random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4), 0.004 * j)) for j in range(14)])
    xf(mat_, T(x, y, 0))
    M(f"kelp_wrack_{k + 1}", mat_, wrack_m, parent=rise, smooth=True)
_lib.channel("sway", keys)
_lib.channel("rise", [(rise, "location", 2, 0.0, 0.35)])
comp.export(col, root, "sea", "kelp", made="blender/components/sea/kelp.py", source="own geometry (bull kelp at the surface)", license="ours", credit="",
            rig={"sway": "every plant's blades swing round its float, 12 to 26 degrees, some each way", "rise": "the whole patch lifts 0.35 m with the swell"})
