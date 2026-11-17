# clocktower/beams: the clock room's oak frame, modelled by hand and grained from Poly Haven's rough_wood (CC0): four
# posts 0.24 m square on stone pads at the corners of a 5.4 x 3.6 m bay, tie beams round their heads 4.4 m up, three
# joists across at 4.15 m (the leading-off hangers bolt under the middle one), curved-less straight knee braces at
# every post, iron straps and pegs at the joints. Origin: the floor at the bay's middle. A shell part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, bolt

col, root = comp.fresh("beams")
oak = comp.ph_texture("beams_oak", "rough_wood", tile=1.0, tint=(0.72, 0.6, 0.47))
stone = comp.mat("beams_pad", (0.42, 0.4, 0.37), rough=0.9)
iron = comp.mat("beams_iron", (0.03, 0.03, 0.035), rough=0.6, metal=0.4)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
HX, HY, H, P = 2.7, 1.8, 4.4, 0.24
tim, straps, pads, pegs = [], [], [], []
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * HX, sy * HY
        tim.append(comp.box((P, P, H - 0.06), at=(x, y, (H + 0.06) / 2)))
        pads.append(comp.box((0.4, 0.4, 0.06), at=(x, y, 0.03)))
        for ax in ("x", "y"):
            b = comp.box((0.14, 0.14, 1.25), at=(0, 0, 0))
            if ax == "x":
                xf(b, R(-sx * 45, "Y")); xf(b, T(x - sx * 0.46, y, H - 0.62))
            else:
                xf(b, R(sy * 45, "X")); xf(b, T(x, y - sy * 0.46, H - 0.62))
            tim.append(b)
        straps.append(comp.box((P + 0.012, P + 0.012, 0.05), at=(x, y, H - 1.3)))
        pegs += [comp.cyl(0.012, 0.02, at=(x + d, y - sy * (P / 2 + 0.018) if sy < 0 else y - P / 2 - 0.018, H - 0.2), seg=8, axis="Y") for d in (-0.05, 0.05)]
for sy in (-1, 1):
    tim.append(comp.box((2 * HX + P + 0.3, P, P), at=(0, sy * HY, H + P / 2)))
for sx in (-1, 1):
    tim.append(comp.box((P, 2 * HY - P, P), at=(sx * HX, 0, H + P / 2)))
for x in (-1.35, 0.0, 1.35):
    tim.append(comp.box((0.18, 2 * HY + P + 0.3, 0.22), at=(x, 0, 4.15 + 0.11)))
t = M("beams_timber", comp.merge(*tim), oak)
comp.bevel(t, 0.008, 2)
comp.uv_box(t)
M("beams_pads", comp.merge(*pads), stone)
M("beams_straps", comp.merge(*straps), iron)
pg = M("beams_pegs", comp.merge(*pegs), oak)
comp.uv_box(pg)  # a textured material on a mesh with no UVs exports texCoord -1, which raea refuses
comp.export(col, root, "clocktower", "beams", made="blender/components/clocktower/beams.py", source="own geometry; oak https://polyhaven.com/a/rough_wood", license="ours; texture CC0", credit="texture: Poly Haven")
