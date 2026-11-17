# lighthouse/fence: the white-painted fence across the tower's front with its gate, modelled by hand: 12 m of post and
# rail (square posts with weathered pyramid caps, three rails let into them) and in the middle a 1.2 m picket gate
# between two taller gateposts, with a diagonal brace, strap hinges and a ring latch. 1.25 m high. Weathered boards
# from a Poly Haven texture set. Its origin is the ground under the gate's middle; lighthouse/fence-run carries it on
# along the cliff. Rig: "gate" swings the gate 100 degrees open toward the front on its left post.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

RUN = "--run" in sys.argv or os.environ.get("FENCE_RUN") == "1"
NAME = "fence_run" if RUN else "fence"
col, root = comp.fresh(NAME)
wood = comp.ph_texture("fence_paint", "weathered_planks", tile=1.4, res="1k", grey=True, tint=(0.86, 0.86, 0.82))
iron = comp.mat("fence_iron", (0.015, 0.015, 0.017), rough=0.5, metal=0.6)
M = _lib.maker(col, root)
GATE, PH, BAY = 1.2, 1.25, 1.8


def post(x, h=PH, w=0.13):
    b = comp.box((w, w, h), at=(x, 0, h / 2))
    cap = bmesh.new()
    bmesh.ops.create_cone(cap, cap_ends=True, segments=4, radius1=w * 0.78, radius2=0.0, depth=0.07)
    xf(cap, R(45, "Z")); xf(cap, T(x, 0, h + 0.035))
    return comp.merge(b, cap)


def run(x0, bays):
    ps = [post(x0 + i * BAY) for i in range(bays + 1)]
    rs = [comp.box((bays * BAY, 0.04, 0.1), at=(x0 + bays * BAY / 2, -0.05, z)) for z in (0.35, 0.7, 1.05)]
    return ps, rs


if RUN:
    ps, rs = run(0.0, 6)
else:
    G0 = -GATE / 2 - 0.075
    pa, ra = run(G0 - 3 * BAY, 3)
    pb, rb = run(-G0, 3)
    ps, rs = pa[:-1] + pb[1:] + [post(G0, h=PH + 0.12, w=0.15), post(-G0, h=PH + 0.12, w=0.15)], ra + rb
po = M(f"{NAME}_posts", comp.merge(*ps), wood)
comp.uv_box(po, 1.0)
ro = M(f"{NAME}_rails", comp.merge(*rs), wood)
comp.bevel(ro, 0.004, 1)
comp.uv_box(ro, 1.0)
if RUN:
    comp.export(col, root, "lighthouse", NAME, made="blender/components/lighthouse/fence_run.py", source="own geometry (a post-and-rail fence); texture: https://polyhaven.com/a/weathered_planks",
                license="ours; texture CC0", credit="Poly Haven (weathered_planks)", notes="origin: the left end's foot; the run is 10.8 m along +x")
else:
    X0 = -GATE / 2
    hinge = comp.pivot(col, root, "fence_gate_hinge", (X0, -0.05, 0))
    g = [comp.box((GATE - 0.04, 0.035, 0.09), at=(0, -0.05, z)) for z in (0.3, 1.0)]
    n = 8
    for i in range(n):
        x = X0 + 0.055 + (GATE - 0.11) * i / (n - 1)
        p = comp.box((0.075, 0.022, 1.02), at=(x, -0.08, 0.64))
        tip = bmesh.new()
        vs = [tip.verts.new(v) for v in ((x - 0.0375, -0.091, 1.15), (x + 0.0375, -0.091, 1.15), (x, -0.091, 1.21), (x - 0.0375, -0.069, 1.15), (x + 0.0375, -0.069, 1.15), (x, -0.069, 1.21))]
        for q in ((0, 1, 2), (5, 4, 3), (0, 2, 5, 3), (2, 1, 4, 5)):
            tip.faces.new([vs[j] for j in q])
        g += [p, tip]
    L = math.hypot(GATE - 0.1, 0.7)
    br = comp.box((L, 0.03, 0.075), at=(0, 0, 0))
    xf(br, R(-math.degrees(math.atan2(0.7, GATE - 0.1)), "Y")); xf(br, T(0, -0.05, 0.65))
    go = M("fence_gate", comp.merge(*g, br), wood, parent=hinge)
    comp.uv_box(go, 1.0)
    fit = [comp.box((0.4, 0.008, 0.045), at=(X0 + 0.2, -0.096, z)) for z in (0.3, 1.0)] + [comp.cyl(0.014, 0.1, at=(X0, -0.096, z - 0.05), seg=8) for z in (0.3, 1.0)]
    ringb = _lib.lathe([(0.04 + 0.006 * math.cos(i * math.pi / 3), 0.006 * math.sin(i * math.pi / 3)) for i in range(7)], seg=16)
    xf(ringb, R(90, "X")); xf(ringb, T(-X0 - 0.1, -0.1, 0.96))
    M("fence_gate_ironwork", comp.merge(*fit, ringb, comp.box((0.12, 0.008, 0.03), at=(-X0 - 0.05, -0.096, 1.0))), iron, parent=hinge)
    comp.channel("gate", [(hinge, "rotation_euler", 2, 0, math.radians(-100))])
    comp.export(col, root, "lighthouse", "fence", made="blender/components/lighthouse/fence.py", source="own geometry (a post-and-rail fence and picket gate); texture: https://polyhaven.com/a/weathered_planks",
                license="ours; texture CC0", credit="Poly Haven (weathered_planks)",
                rig={"gate": "the picket gate swings 100 degrees open toward the front on its left gatepost (fence_gate_hinge)"},
                notes="origin: the ground under the gate's middle; 5.4 m of fence either side of it along x")
