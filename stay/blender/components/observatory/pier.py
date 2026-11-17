# observatory/pier: the telescope's pier, modelled by hand: a cast-iron column 1.55 m tall on an octagonal stone plinth,
# tapering from 34 to 25 cm, with a bolted foot flange, an astragal, an inspection door and a top flange for the
# mount's head. The origin is the middle of its foot. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import lathe, rbox, T, R, S, xf

col, root = comp.fresh("pier")
M = _lib.maker(col, root)
iron = comp.mat("pier_iron", (0.07, 0.11, 0.1), rough=0.38, metal=0.7)
stone = comp.ph_texture("pier_stone", "concrete_floor_worn_001", tile=1.2, res="1k", tint=(0.8, 0.78, 0.72))
brass = comp.mat("pier_brass", (0.72, 0.55, 0.22), rough=0.3, metal=1.0)
p = M("pier_plinth", lathe([(0.0, 0.0), (0.62, 0.0), (0.62, 0.16), (0.58, 0.2), (0.0, 0.2)], seg=8), stone, smooth=False)
comp.bevel(p, 0.012, 2)
comp.uv_box(p, 1.0)
prof = [(0.0, 0.2), (0.46, 0.2), (0.46, 0.235), (0.39, 0.245), (0.36, 0.3), (0.34, 0.34), (0.335, 0.5), (0.35, 0.52), (0.35, 0.55), (0.33, 0.57), (0.262, 1.38), (0.28, 1.4), (0.28, 1.43), (0.262, 1.45), (0.26, 1.49), (0.33, 1.51), (0.33, 1.55), (0.0, 1.55)]
M("pier_column", lathe(prof, seg=40), iron)
bolts = [comp.merge(comp.cyl(0.02, 0.016, at=(0.42 * math.cos(a), 0.42 * math.sin(a), 0.235), seg=6), comp.cyl(0.011, 0.03, at=(0.42 * math.cos(a), 0.42 * math.sin(a), 0.235), seg=8)) for a in (2 * math.pi * (i + 0.5) / 8 for i in range(8))]
bolts += [comp.cyl(0.014, 0.012, at=(0.3 * math.cos(a), 0.3 * math.sin(a), 1.55), seg=6) for a in (2 * math.pi * i / 6 for i in range(6))]
M("pier_bolts", comp.merge(*bolts), iron, smooth=False)
M("pier_door", comp.merge(rbox((0.2, 0.02, 0.3), at=(0, -0.312, 0.95), r=0.006, seg=2), *[comp.cyl(0.008, 0.008, at=(sx * 0.085, -0.324, 0.95 + sz * 0.13), seg=6, axis="Y") for sx in (-1, 1) for sz in (-1, 1)]), iron, smooth=False)
M("pier_plate", rbox((0.12, 0.004, 0.06), at=(0, -0.325, 0.95), r=0.002, seg=1), brass, smooth=False)
comp.export(col, root, "observatory", "pier", made="blender/components/observatory/pier.py", source="own geometry; Poly Haven texture concrete_floor_worn_001 on the plinth", license="ours (texture CC0)", credit="Poly Haven (texture)",
            notes="origin: the middle of its foot; the telescope's head bolts to its top, 1.55 m up")
