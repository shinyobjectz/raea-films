# ferris/ground: the fairground's hardstanding, 44 x 44 m, modelled by hand: worn tarmac (Poly Haven's asphalt_04)
# at real scale, a patched strip of newer tarmac (asphalt_02), faded yellow parking-bay lines the fair was pitched
# over, a drain cover (a cast grate in its frame), and five shallow rain puddles as dark mirror-smooth sheets.
# Origin: its centre, its top at z 0. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(5)
col, root = comp.fresh("ground")
tarmac = comp.ph_texture("ground_tarmac", "asphalt_04", tile=3.0, res="2k")
patch = comp.ph_texture("ground_patch", "asphalt_02", tile=2.0, res="1k")
line = comp.mat("ground_line", (0.55, 0.45, 0.12), rough=0.8)
water = comp.mat("ground_puddle", (0.07, 0.075, 0.085), rough=0.06, metal=0.0)
iron = comp.mat("ground_iron", (0.08, 0.08, 0.085), rough=0.55, metal=1.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
g = M("ground_tarmac", comp.box((44, 44, 0.2), at=(0, 0, -0.1)), tarmac)
comp.uv_box(g, 1.0)
p = M("ground_patch", comp.merge(comp.box((1.4, 17, 0.004), at=(-7.5, -3, 0.002)), comp.box((3.2, 2.2, 0.004), at=(6, -9, 0.002))), patch)
comp.uv_box(p, 1.0)
lines = [comp.box((0.1, 4.8, 0.002), at=(-12 + i * 2.5, -12.5, 0.001)) for i in range(11) if i not in (4, 7)] + [comp.box((25, 0.1, 0.002), at=(0.5, -10.1, 0.001))]
M("ground_lines", comp.merge(*lines), line)
def puddle(cx, cy, r):
    bm = bmesh.new()
    n = 28
    vs = [bm.verts.new((cx + r * (1 + 0.28 * math.sin(3 * a + cx) + 0.14 * math.sin(5 * a + cy)) * math.cos(a) * 1.35, cy + r * (1 + 0.28 * math.sin(3 * a + cx) + 0.14 * math.sin(5 * a + cy)) * math.sin(a), 0.0035)) for a in [2 * math.pi * k / n for k in range(n)]]
    bm.faces.new(vs)
    return bm
M("ground_puddles", comp.merge(*[puddle(x, y, r) for x, y, r in ((3.5, -6.5, 1.1), (-4.5, -8.0, 0.7), (9.0, -3.0, 0.9), (-10, 2, 1.3), (1.0, -11.5, 0.6))]), water)
grate = [comp.box((0.62, 0.62, 0.012), at=(-2.2, -9.3, 0.0))] + [comp.box((0.5, 0.025, 0.02), at=(-2.2, -9.3 - 0.22 + i * 0.063, 0.006)) for i in range(8)]
M("ground_drain", comp.merge(*grate), iron)
comp.export(col, root, "ferris", "ground", made="blender/components/ferris/ground.py", source="own geometry; textures: https://polyhaven.com/a/asphalt_04, https://polyhaven.com/a/asphalt_02", license="ours; textures CC0", credit="Poly Haven (asphalt_04, asphalt_02)",
            notes="origin: its centre, top at 0; the puddles are the material ground_puddle")
