# office/bin: a round steel-mesh-look waste bin, 0.3 m, with balls of crumpled paper in it, modelled by hand: a tapered
# wall with a rolled rim and a foot, perforated in rings by its texture-free geometry (slots), and five paper balls.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("bin")
steel = comp.mat("bin_steel", (0.05, 0.05, 0.055), rough=0.4, metal=1.0)
paper = comp.mat("bin_paper", (0.9, 0.89, 0.85), rough=0.8)
R0, R1, H = 0.105, 0.135, 0.3
# the wall: vertical wires and hoops, as a real mesh bin is made
wires = []
NW = 44
for i in range(NW):
    a = 2 * math.pi * i / NW
    wires.append(comp.tube([(R0 * math.cos(a), R0 * math.sin(a), 0.012), (R1 * math.cos(a), R1 * math.sin(a), H - 0.006)], 0.0012, res=1, sides=1))
def hoop(r, z, t, seg=48):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, segments=seg, radius=r)
    return comp.tube([(r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z) for k in range(seg + 1)], t, res=1, sides=2)
hoops = [hoop(R0 + (R1 - R0) * (z - 0.012) / (H - 0.018), z, 0.0012) for z in [0.012 + k * 0.024 for k in range(1, 12)]]
hoops.append(hoop(R1, H - 0.004, 0.005))
comp.mesh(col, root, "bin_wall", comp.merge(*wires, *hoops), steel, smooth=True)
comp.mesh(col, root, "bin_base", comp.cyl(R0 + 0.003, 0.014, seg=48), steel, smooth=False)
rnd = random.Random(5)
balls = []
for i in range(5):
    b = bmesh.new()
    bmesh.ops.create_icosphere(b, subdivisions=2, radius=0.04)
    for v in b.verts:
        v.co *= 1 + rnd.uniform(-0.22, 0.12)
    xf(b, T(rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 0.05 + i * 0.045))
    balls.append(b)
comp.mesh(col, root, "bin_paper", comp.merge(*balls), paper, smooth=False)
comp.export(col, root, "office", "bin", made="blender/components/office/bin.py", source="own geometry (a generic wire-mesh waste bin)", license="ours", credit="")
