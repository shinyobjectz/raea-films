# wreck/seabed: the kelp world's sand, from 20 m before the wreck's door to 6 m behind it and 18 m to either side: low
# swells, sand banked against the hull's foot and drifted up the door's leaf, and ripples 42 cm apart across it all.
# Under the patch before the door, which v3/kelp.tsx simulates (v3/sand.ts) so the leaf can plough it, the sand drops
# away from the patch's edge: the patch is drawn there, its border on this sand's height.
# Its origin is the door's sill (wreck/hatch's), so the two stand together. height() is v3/kelp.tsx's sand() too.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh

X0, X1, Y0, Y1, D = -18.0, 18.0, -20.0, 6.0, 0.11


def height(x, y):
    """the sand at (x, y), Blender's frame; v3/kelp.tsx sand() is this without the ripples"""
    base = 0.16 * math.sin(0.35 * x + 0.7) * math.cos(0.29 * y - 0.3) + 0.08 * math.sin(0.8 * x - 0.6 * y + 1.9) - 0.12
    d = max(0.0, -y - 0.15)
    pile = 0.45 * math.exp(-d / 0.9) * (1 - 0.9 * math.exp(-x * x / 1.0))
    bank = 0.36 * math.exp(-max(0.0, -y - 0.12) / 0.5) * math.exp(-x * x / 1.6)   # (drifted up against the door's leaf)
    return base + pile + bank


def ripple(x, y):
    a = 0.35 + 0.15 * math.sin(0.1 * x)
    p = (x * math.cos(a) + y * math.sin(a)) / 0.42 * 2 * math.pi + 0.6 * math.sin(0.5 * x + 0.3 * y)
    near = 1.0 - 0.8 * math.exp(-max(0.0, -y - 0.15) / 0.6)            # (flattened where the sand banks up on the hull)
    return 0.022 * near * (math.sin(p) + 0.3 * math.sin(2 * p) - 0.1)


PATCH = (-2.3, 1.34, -2.22, -0.02)          # v3/kelp.tsx's sand patch: x0, x1 and y0, y1 (Blender's y)


def under_patch(x, y):
    """1 inside the simulated patch (0.12 m in from its edge), 0 at and outside its edge"""
    x0, x1, y0, y1 = PATCH
    e = min(x - x0, x1 - x, y - y0, y1 - y)
    if e <= 0:
        return 0.0
    k = min(1.0, e / 0.12)
    return k * k * (3 - 2 * k)


SAND = comp.ph_texture("wreck_sand", "coast_sand_01", tile=2.2, res="2k", tint=(0.86, 0.83, 0.74))
col, root = comp.fresh("seabed")
nx, ny = int((X1 - X0) / D), int((Y1 - Y0) / D)
bm = bmesh.new()
V = {}
for i in range(nx + 1):
    x = X0 + (X1 - X0) * i / nx
    for j in range(ny + 1):
        y = Y0 + (Y1 - Y0) * j / ny
        V[i, j] = bm.verts.new((x, y, height(x, y) + ripple(x, y) - 0.3 * under_patch(x, y)))
for i in range(nx):
    for j in range(ny):
        bm.faces.new((V[i, j], V[i + 1, j], V[i + 1, j + 1], V[i, j + 1]))
bm.normal_update()
o = comp.mesh(col, root, "seabed_sand", bm, SAND, smooth=True)
comp.uv_box(o, 1.0)
comp.export(col, root, "wreck", "seabed", made="blender/components/wreck/seabed.py",
            source="own geometry; Poly Haven's coast_sand_01 (CC0)", license="ours (texture CC0)", credit="Poly Haven (polyhaven.com)",
            notes="Origin: wreck/hatch's sill. The sand's height is height() here (v3/kelp.tsx sand()), plus ripples of 2 cm.")
