# office/ceiling: a suspended ceiling, 14.4 x 27.4 m: mineral-fibre tiles 0.6 m square (their faces pitted by a
# displaced grid of fine dots in the texture's stead: a plain off-white with a slight roughness) in a white T-bar grid
# that stands 4 mm proud. Its origin is the ceiling's middle; the tiles' faces are at z 0 and it hangs nothing below
# but the grid.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("ceiling")
tile = comp.ph_texture("office_ceiling_tile", "ceiling_interior", tile=1.2, tint=(0.92, 0.92, 0.9), grey=True, res="1k")
bar = comp.mat("office_ceiling_bar", (0.9, 0.9, 0.88), rough=0.4)
W, D, G = 14.4, 27.4, 0.6
c = comp.mesh(col, root, "ceiling_tiles", comp.box((W, D, 0.03), at=(0, 0, 0.015)), tile)
comp.uv_box(c, 1.0)
bars = []
nx, ny = int(W / G), int(D / G)
for i in range(nx + 1):
    bars.append(comp.box((0.024, D, 0.004), at=(-W / 2 + i * G, 0, -0.002)))
for j in range(ny + 1):
    bars.append(comp.box((W, 0.024, 0.004), at=(0, -D / 2 + j * G, -0.002)))
comp.mesh(col, root, "ceiling_grid", comp.merge(*bars), bar)
comp.export(col, root, "office", "ceiling", made="blender/components/office/ceiling.py", source="own geometry; tile: https://polyhaven.com/a/ceiling_interior", license="ours; texture CC0", credit="Poly Haven (ceiling_interior)")
