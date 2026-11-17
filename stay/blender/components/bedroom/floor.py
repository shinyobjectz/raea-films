# bedroom/floor: the room's floor, 4.2 x 3.6 m of worn oak boards (Poly Haven's wood_floor_worn, CC0) on a 2 cm slab,
# its origin at the top's centre: stand it 2 cm up so its top is the floor everything stands on. A brass threshold
# strip lies in the side wall's doorway and a floor vent near the front.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import ROOM_W, ROOM_D
col, root = comp.fresh("floor")
M = _lib.maker(col, root)
wood = comp.ph_texture("floor_boards", "wood_floor_worn", tile=1.6)
brass = comp.mat("floor_brass", (0.72, 0.56, 0.28), rough=0.35, metal=1.0)
vent = comp.mat("floor_vent", (0.5, 0.42, 0.3), rough=0.4, metal=1.0)
f = M("floor_boards", comp.box((ROOM_W, ROOM_D, 0.02), at=(0, 0, -0.01)), wood)
comp.uv_box(f, 1.0)
t = M("floor_threshold", comp.box((0.04, 0.86, 0.006), at=(ROOM_W / 2 - 0.02, -0.85, 0.003)), brass)
comp.bevel(t, 0.002, 2)
bars = [comp.box((0.3, 0.1, 0.004), at=(-1.6, -ROOM_D / 2 + 0.2, 0.002))] + [comp.box((0.28, 0.004, 0.006), at=(-1.6, -ROOM_D / 2 + 0.16 + i * 0.011, 0.004)) for i in range(8)]
M("floor_vent", comp.merge(*bars), vent)
comp.export(col, root, _lib.PLACE, "floor", made="blender/components/bedroom/floor.py",
            source="own geometry; boards: https://polyhaven.com/a/wood_floor_worn", license="ours; texture CC0", credit="Poly Haven (wood_floor_worn)",
            notes="origin at the top's centre; the room's back wall is at Blender y +1.8 (raea z -1.8), the window wall")
