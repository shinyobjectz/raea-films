# office/cables: the cables down a desk's back, modelled by hand: four leads (two power, a video, a network lead in
# blue) falling from the desk top (z 0.79, where a monitor's clamp is) in loose curves to a six-way power strip on the
# floor, with a cable tie where they bunch. Its origin is the floor under the desk's back edge.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("cables")
black = comp.mat("cables_black", (0.02, 0.02, 0.02), rough=0.55)
blue = comp.mat("cables_blue", (0.05, 0.2, 0.6), rough=0.5)
white = comp.mat("cables_strip", (0.85, 0.85, 0.82), rough=0.45)
rnd = random.Random(11)
TOP = 0.79
leads = []
for i in range(4):
    x0 = -0.09 + i * 0.06
    sway = rnd.uniform(-0.05, 0.05)
    pts = [(x0, -0.02, TOP + 0.01), (x0, 0.03, TOP - 0.02), (x0 * 0.5 + sway, 0.06, 0.52), (sway * 0.5, 0.05, 0.4), (-0.02 + i * 0.012, 0.045, 0.32),
           (-0.1 + i * 0.07 + sway, 0.1 + rnd.uniform(0, 0.08), 0.02), (-0.16 + i * 0.09, 0.12, 0.006 + i * 0.001), (-0.16 + i * 0.09, 0.2, 0.03)]
    leads.append((comp.tube(pts, 0.0032 if i < 2 else 0.0026, res=8, sides=2), blue if i == 3 else black))
comp.mesh(col, root, "cables_leads", comp.merge(*[l for l, m in leads[:3]]), black, smooth=True)
comp.mesh(col, root, "cables_network", leads[3][0], blue, smooth=True)
comp.mesh(col, root, "cables_tie", comp.cyl(0.011, 0.005, at=(-0.005, 0.047, 0.355), seg=12), black)
strip = comp.merge(comp.box((0.34, 0.055, 0.04), at=(0, 0.22, 0.02)), *[comp.box((0.036, 0.036, 0.004), at=(-0.125 + k * 0.05, 0.22, 0.041)) for k in range(6)])
s = comp.mesh(col, root, "cables_strip", strip, white)
comp.bevel(s, 0.004, 2)
comp.mesh(col, root, "cables_switch", comp.box((0.02, 0.012, 0.006), at=(0.155, 0.22, 0.042)), comp.mat("cables_switch", (0.8, 0.1, 0.05), rough=0.3, emit=(1.0, 0.15, 0.05), strength=1.5))
comp.export(col, root, "office", "cables", made="blender/components/office/cables.py", source="own geometry (cables and a power strip)", license="ours", credit="")
