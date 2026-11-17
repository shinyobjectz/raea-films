# stairwell/landing: a storey's landing, modelled by hand: a 60 degree stone slab from the wall to the well, centred
# on the front (-y) where the door is, with a terrazzo top edged in a brass inlay, a skirting on the wall, and its
# own length of the balustrade along the well's edge (iron balusters with turned knops, the polished wood handrail
# easing up into the flight). Origin: the well's axis at the landing's top. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("landing")
stone = comp.ph_texture("stairs_stone", "concrete_floor_worn_001", tile=1.4, res="1k")
top_m = comp.ph_texture("landing_terrazzo", "terrazzo_tiles", tile=1.0, res="1k")
brass = comp.mat("stairs_brass", (0.78, 0.57, 0.22), rough=0.32, metal=1.0)
skirt = comp.mat("stairs_skirting", (0.07, 0.085, 0.09), rough=0.38)
iron = comp.mat("rail_iron", (0.03, 0.03, 0.035), rough=0.45, metal=1.0)
wood = comp.mat("rail_wood", (0.2, 0.085, 0.035), rough=0.22)
a0, a1 = L.LAND0, L.LAND1
slab = comp.mesh(col, root, "landing_slab", L.arc_block(L.R_IN + 0.018, L.R_WALL, a0, a1 + 0.5, -0.215, -0.03), stone)
comp.bevel(slab, 0.012, 2)
L.uv_cyl(slab)
top = comp.mesh(col, root, "landing_top", L.arc_block(L.R_IN, L.R_WALL, a0 - 1.0, a1, -0.03, 0), top_m)
comp.bevel(top, 0.01, 3)
L.uv_cyl(top)
inlay = comp.merge(L.arc_block(L.R_IN + 0.12, L.R_IN + 0.135, a0 + 2, a1 - 2, -0.001, 0.002), L.arc_block(L.R_WALL - 0.16, L.R_WALL - 0.145, a0 + 2, a1 - 2, -0.001, 0.002),
                   L.arc_block(L.R_IN + 0.12, L.R_WALL - 0.145, a0 + 2, a0 + 2.5, -0.001, 0.002), L.arc_block(L.R_IN + 0.12, L.R_WALL - 0.145, a1 - 2.5, a1 - 2, -0.001, 0.002),
                   L.arc_block(L.R_IN + 0.04, L.R_WALL - 0.06, a0 - 0.55, a0 + 0.25, -0.001, 0.0025))
comp.mesh(col, root, "landing_inlay", inlay, brass)
sk = comp.mesh(col, root, "landing_skirting", comp.merge(L.arc_block(L.R_WALL - 0.022, L.R_WALL, a0, a0 + 17, -0.01, 0.17), L.arc_block(L.R_WALL - 0.022, L.R_WALL, a1 - 17, a1, -0.01, 0.17)), skirt)
comp.bevel(sk, 0.006, 2)
bars, knops = L.balusters([4.2 + k * 8.33 for k in range(7)], lambda u: 0.0)
comp.mesh(col, root, "landing_balusters", comp.merge(*bars), iron, smooth=True)
comp.mesh(col, root, "landing_knops", comp.merge(*knops), iron, smooth=True)
comp.mesh(col, root, "landing_handrail", L.handrail(0, 60), wood, smooth=True)
comp.export(col, root, "stairwell", "landing", made="blender/components/stairwell/landing.py",
            source="own geometry; textures: https://polyhaven.com/a/concrete_floor_worn_001, https://polyhaven.com/a/terrazzo_tiles",
            license="ours; textures CC0", credit="Poly Haven (concrete_floor_worn_001, terrazzo_tiles)",
            notes="origin: the well's axis at the landing's top; its handrail meets stairwell/rail's at both ends")
