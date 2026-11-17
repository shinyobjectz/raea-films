# subway/sign: a hanging enamel platform sign, 1.5 x 0.34 m, modelled by hand: a black porcelain-enamel board in a
# steel frame on two drop rods with eyes, white letters and an arrow on both sides (EXIT and STAY ST: our own). A
# ceiling item: its top at z 0, its faces toward -y and +y. Rig: "swing" swings it 8 degrees on its eyes (the
# train's wind).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt

col, root = comp.fresh("sign")
black = comp.mat("sign_enamel", (0.012, 0.012, 0.014), rough=0.15)
white = comp.mat("sign_letters", (0.93, 0.93, 0.9), rough=0.2)
steel = comp.mat("sign_frame", (0.3, 0.3, 0.31), rough=0.4, metal=0.9)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, H, TOP = 1.5, 0.34, -0.55
M("sign_rods", comp.merge(*[comp.cyl(0.007, -TOP - 0.03, at=(x, 0, TOP + 0.03), seg=8) for x in (-0.55, 0.55)], *[comp.cyl(0.03, 0.008, at=(x, 0, -0.008), seg=12) for x in (-0.55, 0.55)]), steel)
sw = comp.pivot(col, root, "sign_swing", (0, 0, TOP + 0.03))
M("sign_eyes", comp.merge(*[xf(_lib.lathe([(0.012, -0.004), (0.02, -0.004), (0.02, 0.004), (0.012, 0.004), (0.012, -0.004)], seg=12, axis="X"), T(x, 0, TOP + 0.02)) for x in (-0.55, 0.55)]), steel, parent=sw)
b = M("sign_board", slab(-W / 2, W / 2, -0.008, 0.008, TOP - H, TOP), black, parent=sw)
fr = [slab(-W / 2 - 0.012, W / 2 + 0.012, -0.012, 0.012, z - 0.012, z + 0.012) for z in (TOP, TOP - H)] + [slab(x - 0.012, x + 0.012, -0.012, 0.012, TOP - H, TOP) for x in (-W / 2, W / 2)]
M("sign_frame", comp.merge(*fr), steel, parent=sw)
lt = []
for s in (-1, 1):
    grp = [xf(comp.text("EXIT", 0.15, depth=0.002), T(-0.3, 0, 0.055)), xf(comp.text("STAY ST   UPTOWN", 0.06, depth=0.002), T(-0.12, 0, -0.095))]
    arrow = comp.merge(comp.box((0.26, 0.002, 0.035), at=(0.42, 0, 0.055)), xf(comp.box((0.13, 0.002, 0.035), at=(-0.05, 0, 0)), comp.Matrix.Translation((0.56, 0, 0.055)) @ R(40, "Y")), xf(comp.box((0.13, 0.002, 0.035), at=(-0.05, 0, 0)), comp.Matrix.Translation((0.56, 0, 0.055)) @ R(-40, "Y")))
    grp.append(arrow)
    g = comp.merge(*grp)
    if s > 0:
        xf(g, R(180, "Z"))
    lt.append(xf(g, T(0, s * 0.009, TOP - H / 2)))
M("sign_letters", comp.merge(*lt), white, parent=sw)
comp.channel("swing", [(sw, "rotation_euler", 0, 0, math.radians(8))])
comp.export(col, root, "subway", "sign", made="blender/components/subway/sign.py", source="own geometry (a generic enamel platform sign); letters in Blender's built-in font", license="ours", credit="",
            rig={"swing": "the board swings 8 degrees on its two eyes"})
