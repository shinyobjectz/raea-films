# ferris/cables: the fair's power run on the ground, modelled by hand: three heavy rubber cables snaking 9 m from
# a generator's side to the rides, a yellow cable ramp where the public cross them, a splitter box with four
# sockets and their flip lids, and two coils of spare cable. Origin: the generator's end, on the ground; the run
# goes off toward +x. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("cables")
rubber = comp.mat("festoon_cable", (0.015, 0.015, 0.017), rough=0.6)
orange = comp.mat("cables_orange", (0.8, 0.3, 0.03), rough=0.55)
yellow = comp.mat("cables_ramp", (0.85, 0.65, 0.05), rough=0.6)
black = comp.mat("cables_ramp_black", (0.03, 0.03, 0.03), rough=0.7)
blue = comp.mat("cables_socket", (0.05, 0.2, 0.6), rough=0.4)
M = lambda n, bm, m, smooth=True: comp.mesh(col, root, n, bm, m, smooth=smooth)
run = lambda off, amp, r: comp.tube([(x, off + amp * math.sin(x * 0.9 + off * 7) + (0.0 if 3.6 < x < 4.6 else 0), r + (0.035 if 3.7 < x < 4.5 else 0)) for x in [9.0 * k / 36 for k in range(37)]], r, res=3, sides=3)
M("cables_heavy", comp.merge(run(-0.12, 0.18, 0.022), run(0.05, 0.14, 0.022)), rubber)
M("cables_orange", run(0.2, 0.22, 0.012), orange)
ramp = [comp.box((0.9, 1.0, 0.012), at=(4.1, 0.05, 0.006))]
for s in (-1, 1):
    ramp.append(comp.taper((4.1 + s * 0.45, 0.05, 0.0), (4.1 + s * 0.15, 0.05, 0.0), 1.0, 1.0, -0.004, -0.06))
r = M("cables_ramp", comp.merge(*ramp), black, False)
M("cables_ramp_lid", comp.merge(comp.box((0.3, 1.0, 0.012), at=(4.1, 0.05, 0.066)), *[comp.box((0.28, 0.02, 0.004), at=(4.1, -0.4 + 0.1 * i, 0.074)) for i in range(10)]), yellow, False)
sb = M("cables_splitter", comp.merge(comp.box((0.5, 0.3, 0.22), at=(9.1, 0.05, 0.13)), comp.box((0.56, 0.06, 0.03), at=(9.1, 0.05, 0.255)), *[comp.box((0.04, 0.26, 0.02), at=(9.1 + sx * 0.2, 0.05, 0.01)) for sx in (-1, 1)]), rubber, False)
comp.bevel(sb, 0.012, 3)
M("cables_sockets", comp.merge(*[comp.cyl(0.04, 0.05, at=(8.93 + 0.115 * i, -0.15, 0.13), seg=14, axis="Y") for i in range(4)], *[comp.box((0.09, 0.012, 0.09), at=(8.93 + 0.115 * i, -0.158, 0.175)) for i in range(4)]), blue, False)
coils = []
for cx, cy, n in ((1.2, 0.9, 5), (7.6, -0.8, 4)):
    for k in range(n):
        coils.append(L.torus(0.28 - 0.004 * k, 0.012, seg_=28, sides=5, at=(cx + 0.01 * k, cy - 0.008 * k, 0.012 + 0.022 * k)))
M("cables_coils", comp.merge(*coils), orange)
comp.export(col, root, "ferris", "cables", made="blender/components/ferris/cables.py", source="own geometry", license="ours", credit="", notes="origin: the generator's end of the run; it goes 9 m off along +x")
