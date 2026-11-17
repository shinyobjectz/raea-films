# gym/mats: a stack of five folding tumbling mats and one more leaning on the wall behind them ("mats"), modelled by
# hand: each mat four panels of 5 cm foam folded into a 1.2 x 0.6 m block 20 cm thick, in vinyl (blue, with the top one
# red), with stitched seams, hook-and-loop flaps at the ends and two carry handles. The stack is 1 m tall.
# Rig: "slide" pulls the top mat 55 cm forward off the stack; "tip" brings the leaning mat 20 degrees further upright.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, pipe, fillet, T, R, S, xf

col, root = comp.fresh("mats")
M = _lib.maker(col, root)
blue = _lib.ph_plain("mats_blue", "leather_white", (0.02, 0.07, 0.3))
red = _lib.ph_plain("mats_red", "leather_white", (0.4, 0.02, 0.02))
strap = comp.mat("mats_webbing", (0.02, 0.02, 0.022), rough=0.8)
flap = comp.mat("mats_flap", (0.6, 0.6, 0.58), rough=0.8)
rnd = random.Random(5)


def mat_block(name, m, parent=None, xfm=None):
    panels = [rbox((1.2, 0.6, 0.048), at=(0, 0, 0.025 + k * 0.05), r=0.012, seg=3) for k in range(4)]
    extra = [comp.box((0.06, 0.61, 0.012), at=(sx * 0.4, 0, 0.1)) for sx in (-1, 1)]
    fl = [comp.box((0.012, 0.4, 0.15), at=(sx * 0.603, 0, 0.1)) for sx in (-1, 1)]
    hd = [pipe(fillet([(sx * 0.12, -0.302, 0.07), (sx * 0.12, -0.33, 0.07), (sx * 0.12, -0.33, 0.13), (sx * 0.12, -0.302, 0.13)], 0.01), 0.006, sides=2) for sx in (-1, 1)]
    out = []
    for nm, bms, mm in ((name, panels, m), (name + "_straps", extra + hd, strap), (name + "_flaps", fl, flap)):
        bm = comp.merge(*bms)
        if xfm is not None:
            xf(bm, xfm)
        o = M(nm, bm, mm, parent=parent, smooth=False)
        if mm is m:
            comp.uv_box(o, 0.3)
        out.append(o)
    return out


top = comp.pivot(col, root, "mats_top", (0, 0, 0.8))
for k in range(5):
    j = T(rnd.uniform(-0.02, 0.02), rnd.uniform(-0.02, 0.02), k * 0.2) @ R(rnd.uniform(-2.5, 2.5), "Z")
    mat_block(f"mats_mat_{k + 1}", red if k == 4 else blue, parent=top if k == 4 else None, xfm=j)
lean = comp.pivot(col, root, "mats_lean", (0.0, 0.42, 0.0))
mat_block("mats_mat_6", blue, parent=lean, xfm=T(0, 0.42, 0) @ R(68, "X") @ T(0, 0.3, 0))
comp.channel("slide", [(top, "location", 1, top.location.y, top.location.y - 0.55)])
comp.channel("tip", [(lean, "rotation_euler", 0, 0, math.radians(20))])
comp.export(col, root, "gym", "mats", made="blender/components/gym/mats.py",
            source="own geometry (generic folding gym mats); vinyl grain: https://polyhaven.com/a/leather_white", license="ours; texture CC0", credit="Poly Haven (leather_white)",
            rig={"slide": "the top (red) mat 55 cm forward off the stack", "tip": "the leaning mat 20 degrees further upright about its foot"})
