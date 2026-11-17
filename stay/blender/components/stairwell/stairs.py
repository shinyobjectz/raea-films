# stairwell/stairs: one storey's flight of a round geometric stair, modelled by hand: 18 stone treads cantilevered
# from the wall at 2.4 m to the open well at 1.2 m, each a block of its own with a worn marble top, a rounded nosing
# and a brass anti-slip strip, and a dark skirting stepping up the wall with them. It climbs anticlockwise from the
# landing's end (-60 degrees) round 300 degrees to 17 cm under the next landing, 3.23 m up. Origin: the well's axis
# at its landing's level. Stack it every 3.23 m. No rig (the place's shape).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("stairs")
stone = comp.ph_texture("stairs_stone", "concrete_floor_worn_001", tile=1.4, res="1k")
marble = comp.ph_texture("stairs_marble", "marble_01", tile=1.2, res="1k")
brass = comp.mat("stairs_brass", (0.78, 0.57, 0.22), rough=0.32, metal=1.0)
skirt = comp.mat("stairs_skirting", (0.07, 0.085, 0.09), rough=0.38)
blocks, caps, strips, skirts = [], [], [], []
for i in range(L.N):
    a0, a1, z = L.tread_arc(i)
    blocks.append(L.arc_block(L.R_IN + 0.018, L.R_WALL, a0, a1 + 0.5, z - 0.215, z - 0.03))
    caps.append(L.arc_block(L.R_IN, L.R_WALL, a0 - 1.0, a1, z - 0.03, z))
    strips.append(L.arc_block(L.R_IN + 0.04, L.R_WALL - 0.06, a0 - 0.55, a0 + 0.25, z - 0.001, z + 0.0025))
    skirts.append(L.arc_block(L.R_WALL - 0.022, L.R_WALL, a0, a1, z - 0.01, z + 0.17))
b = comp.mesh(col, root, "stairs_blocks", comp.merge(*blocks), stone)
comp.bevel(b, 0.012, 2)
L.uv_cyl(b, 1.0)
c = comp.mesh(col, root, "stairs_tops", comp.merge(*caps), marble)
comp.bevel(c, 0.01, 3)
L.uv_cyl(c, 1.0)
comp.mesh(col, root, "stairs_strips", comp.merge(*strips), brass)
s = comp.mesh(col, root, "stairs_skirting", comp.merge(*skirts), skirt)
comp.bevel(s, 0.006, 2)
comp.export(col, root, "stairwell", "stairs", made="blender/components/stairwell/stairs.py",
            source="own geometry (a cantilevered stone geometric stair); textures: https://polyhaven.com/a/concrete_floor_worn_001, https://polyhaven.com/a/marble_01",
            license="ours; textures CC0", credit="Poly Haven (concrete_floor_worn_001, marble_01)",
            notes="origin: the well's axis at the landing's level; one storey is 3.23 m; with stairwell/landing, rail and wall it is a whole storey")
