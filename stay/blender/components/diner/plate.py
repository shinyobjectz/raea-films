# diner/plate: a slice of cherry pie on a plate with its fork, modelled by hand: a white plate 21 cm across with a green
# rim line (the cup's set), a 45-degree wedge of pie with a rolled crust edge, a lattice-less top crust, cherry filling
# showing on both cut faces, a spoonful of cream, and a four-tined fork. Rig: "fork" lifts the fork 6 cm and tips it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, sphere, T, R, S, xf

col, root = comp.fresh("plate")
M = _lib.maker(col, root)
china = comp.mat("plate_china", (0.86, 0.85, 0.8), rough=0.16)
band = comp.mat("plate_band", (0.02, 0.2, 0.09), rough=0.2)
crust = comp.mat("plate_crust", (0.62, 0.38, 0.14), rough=0.75)
cherry = comp.mat("plate_cherry", (0.3, 0.012, 0.02), rough=0.2)
cream = comp.mat("plate_cream", (0.95, 0.93, 0.86), rough=0.5)
steel = comp.mat("plate_fork", (0.82, 0.82, 0.84), rough=0.3, metal=1.0)
M("plate_plate", lathe([(0, 0.003), (0.05, 0.003), (0.052, 0), (0.058, 0), (0.06, 0.004), (0.085, 0.01), (0.104, 0.017), (0.1055, 0.019), (0.104, 0.0205), (0.084, 0.0135), (0.06, 0.0075), (0, 0.007)], seg=72), china)
M("plate_band", lathe([(0.098, 0.0186), (0.1, 0.0194), (0.1, 0.0197), (0.098, 0.0189)], seg=72), band)
A, RP, Z = math.radians(45), 0.115, 0.0075
n = 10


def wedge(prof, m, name):
    """A profile of (r, z) swept through the wedge's angle, with both cut faces closed."""
    bm = bmesh.new()
    rings = [[bm.verts.new((r * math.cos(A * i / n), r * math.sin(A * i / n), z)) for (r, z) in prof] for i in range(n + 1)]
    for a, b in zip(rings, rings[1:]):
        for i in range(len(prof)):
            j = (i + 1) % len(prof)
            try:
                bm.faces.new((a[i], a[j], b[j], b[i]))
            except ValueError:
                pass
    bm.faces.new(rings[0]); bm.faces.new(rings[-1][::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    xf(bm, T(-0.055, -0.02, Z) @ R(-20, "Z"))
    return M(name, bm, m, smooth=False)


wedge([(0.001, 0.0), (RP - 0.006, 0.0), (RP, 0.01), (RP + 0.004, 0.03), (RP + 0.002, 0.036), (RP - 0.006, 0.036), (RP - 0.01, 0.03), (RP - 0.012, 0.004), (0.001, 0.004)], crust, "plate_pie_crust")
wedge([(0.0012, 0.004), (RP - 0.012, 0.004), (RP - 0.0102, 0.027), (0.0012, 0.027)], cherry, "plate_pie_filling")
wedge([(0.001, 0.027), (RP - 0.008, 0.027), (RP - 0.008, 0.031), (RP * 0.5, 0.034), (0.001, 0.032)], crust, "plate_pie_top")
blob = sphere(0.02, seg=20, rings=10, scale=(1, 1, 0.7))
for v in blob.verts:
    v.co.x += 0.004 * math.sin(v.co.z * 400); v.co.y += 0.004 * math.cos(v.co.z * 400)
xf(blob, T(0.0, 0.03, Z + 0.043))
M("plate_cream", blob, cream)
fk_up = comp.pivot(col, root, "plate_fork_lift", (0.075, -0.06, 0.021))
fk = comp.pivot(col, root, "plate_fork", (0.075, -0.06, 0.021), parent=fk_up)
parts = [comp.taper((0, 0.0, 0.0012), (0, 0.11, 0.0012), 0.007, 0.011, 0.0018, 0.0018), comp.taper((0, -0.03, 0.0012), (0, 0.0, 0.0012), 0.022, 0.007, 0.0016, 0.0016)]
parts += [comp.taper((x, -0.075, 0.0012), (x, -0.03, 0.0012), 0.003, 0.0038, 0.0014, 0.0014) for x in (-0.009, -0.003, 0.003, 0.009)]
f = comp.merge(*parts)
xf(f, T(0.075, -0.045, 0.0215) @ R(-38, "Z") @ T(0, 0.0, 0))
M("plate_fork_mesh", f, steel, parent=fk, smooth=False)
comp.channel("fork", [(fk_up, "location", 2, fk_up.location.z, fk_up.location.z + 0.06), (fk, "rotation_euler", 0, 0, math.radians(18))])
comp.export(col, root, "diner", "plate", made="blender/components/diner/plate.py",
            source="own geometry (a slice of cherry pie, a plate, a fork)", license="ours", credit="",
            rig={"fork": "the fork lifts 6 cm and tips 18 degrees"})
