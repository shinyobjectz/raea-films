# turbines/fence: a run of upland stock fence with a field gate, modelled by hand: 21.6 m, round timber posts every
# 2.4 m with a strainer post and its diagonal strut at each end, five line wires with a barbed top wire's twists, and
# at the right-hand end a 3.6 m galvanised seven-bar field gate with a diagonal brace, hinge pins, a spring latch and a
# chain. 1.2 m high. Bark from a Poly Haven texture set. It runs along x from the origin (its left end's foot).
# Rig: "gate" swings the gate 100 degrees open toward the front on its hinge post.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("fence")
wood = comp.ph_texture("fence_timber", "bark_willow", tile=0.8, res="1k", grey=True, tint=(0.95, 0.85, 0.72))
wire_m = comp.mat("fence_wire", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
galv = comp.mat("fence_galvanised", (0.62, 0.64, 0.66), rough=0.35, metal=1.0)
M = _lib.maker(col, root)
RUN, GATE, BAY = 18.0, 3.6, 2.4


def rod(a, b, r, seg=6):
    a, b = Vector(a), Vector(b)
    bm = comp.cyl(r, (b - a).length, seg=seg)
    xf(bm, (b - a).to_track_quat("Z", "Y").to_matrix())
    return xf(bm, T(*a))


def post(x, r=0.05, h=1.25):
    b = comp.cyl(r, h + 0.5, at=(x, 0, -0.5), seg=10, r2=r * 0.92)
    tip = comp.cyl(r * 0.92, 0.05, at=(x, 0, h), seg=10, r2=r * 0.4)
    return comp.merge(b, tip)


posts = [post(i * BAY, r=0.085 if i in (0, 7) else 0.05, h=1.35 if i in (0, 7) else 1.22) for i in range(8)] + [post(RUN + GATE + 0.12, r=0.09, h=1.4)]
posts += [rod((0.1, 0, 0.95), (1.9, 0, 0.05), 0.045, seg=8), rod((RUN - 0.1, 0, 0.95), (RUN - 1.9, 0, 0.05), 0.045, seg=8)]
po = M("fence_posts", comp.merge(*posts), wood, smooth=True)
_lib.uv_cyl(po, tile=1.0, r_ref=0.3)
wires = []
for z in (0.22, 0.44, 0.66, 0.88, 1.08):
    wires.append(rod((0, -0.052, z), (RUN, -0.052, z), 0.006 if z < 1 else 0.007, seg=5))
barbs = [xf(comp.merge(rod((0, 0, -0.03), (0, 0, 0.03), 0.004, seg=4), rod((-0.02, 0, 0), (0.02, 0, 0), 0.004, seg=4)), T(0.15 + i * 0.3, -0.052, 1.08)) for i in range(60)]
staples = [comp.box((0.02, 0.015, 0.03), at=(i * BAY, -0.058, z)) for i in range(8) for z in (0.22, 0.44, 0.66, 0.88, 1.08)]
M("fence_wires", comp.merge(*wires, *barbs, *staples), wire_m, smooth=True)
# the gate: seven bars, two stiles, a diagonal and a centre stay, on two hinge pins
X0 = RUN + 0.1
hinge = comp.pivot(col, root, "fence_gate_hinge", (X0, -0.05, 0))
g = [rod((X0 + 0.03, -0.05, 0.22), (X0 + 0.03, -0.05, 1.3), 0.025, seg=8), rod((X0 + GATE - 0.1, -0.05, 0.22), (X0 + GATE - 0.1, -0.05, 1.2), 0.022, seg=8)]
for i, z in enumerate((0.25, 0.36, 0.48, 0.62, 0.78, 0.96, 1.16)):
    g.append(rod((X0 + 0.03, -0.05, z), (X0 + GATE - 0.1, -0.05, z), 0.017 if i < 6 else 0.022, seg=8))
g += [rod((X0 + 0.03, -0.075, 0.25), (X0 + GATE / 2, -0.075, 1.16), 0.012), rod((X0 + GATE - 0.1, -0.075, 0.25), (X0 + GATE / 2, -0.075, 1.16), 0.012), rod((X0 + GATE / 2, -0.075, 0.25), (X0 + GATE / 2, -0.075, 1.16), 0.012)]
g += [comp.box((0.07, 0.03, 0.05), at=(X0 - 0.01, -0.05, z)) for z in (0.36, 1.1)]
g += [comp.box((0.16, 0.02, 0.03), at=(X0 + GATE - 0.03, -0.05, 0.8)), comp.tube([(X0 + GATE - 0.1, -0.08, 0.9), (X0 + GATE - 0.02, -0.12, 0.72), (X0 + GATE + 0.06, -0.08, 0.92)], 0.006, sides=2)]
M("fence_gate", comp.merge(*g), galv, parent=hinge, smooth=True)
comp.channel("gate", [(hinge, "rotation_euler", 2, 0, math.radians(-100))])
comp.export(col, root, "turbines", "fence", made="blender/components/turbines/fence.py", source="own geometry (a stock fence and field gate); texture: https://polyhaven.com/a/bark_willow",
            license="ours; texture CC0", credit="Poly Haven (bark_willow)",
            rig={"gate": "the field gate swings 100 degrees open toward the front on its hinge post (fence_gate_hinge)"},
            notes="origin: the left end's foot; 18 m of fence then the 3.6 m gate along +x")
