# stairwell/floor: the ground floor at the bottom of the well, modelled by hand: a 2.7 m radius slab of old mosaic
# (Poly Haven's old_mosaic_floor) with, under the well's eye, a 1.1 m stone medallion: a 16-point compass star in
# dark and pale marble inside three brass-edged rings. It is what the spiral's circle closes on from above.
# Origin: the well's axis at the floor's top. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("floor")
mosaic = comp.ph_texture("floor_mosaic", "old_mosaic_floor", tile=1.6, res="2k")
pale = comp.ph_texture("floor_marble", "marble_01", tile=1.0, res="1k")
dark = comp.mat("floor_dark_stone", (0.05, 0.06, 0.07), rough=0.25)
red = comp.mat("floor_red_stone", (0.32, 0.07, 0.05), rough=0.3)
brass = comp.mat("stairs_brass", (0.78, 0.57, 0.22), rough=0.32, metal=1.0)
f = comp.mesh(col, root, "floor_slab", L.arc_block(0.0, L.R_WALL + 0.3, 0, 360, -0.12, 0.0, seg=72), mosaic)
comp.uv_box(f, 1.0)
m = comp.mesh(col, root, "floor_medallion", L.arc_block(0.0, 1.1, 0, 360, 0.0, 0.004, seg=72), pale)
comp.uv_box(m, 1.0)
rings = [L.arc_block(r0, r1, 0, 360, 0.003, 0.006, seg=72) for r0, r1 in ((1.08, 1.1), (0.92, 0.935), (0.24, 0.252))]
comp.mesh(col, root, "floor_rings", comp.merge(*rings), brass)
comp.mesh(col, root, "floor_band", L.arc_block(0.935, 1.08, 0, 360, 0.002, 0.005, seg=72), dark)


def star(n, r_out, r_in, z, half):
    """Half of each point (the left or the right of its ridge), so the two halves can be two stones."""
    bm = bmesh.new()
    for k in range(n):
        a = 360.0 * k / n
        tip, c = L.pol(r_out, a, z), Vector((0, 0, z))
        side = L.pol(r_in, a + (180.0 / n if half else -180.0 / n), z)
        vs = [bm.verts.new(p) for p in ((c, tip, side) if half else (c, side, tip))]
        bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for fc in bm.faces:
        if fc.normal.z < 0:
            fc.normal_flip()
    return bm


comp.mesh(col, root, "floor_star_dark", comp.merge(star(8, 0.9, 0.32, 0.0062, True), xf(star(8, 0.62, 0.25, 0.0058, True), R(22.5, "Z"))), dark)
comp.mesh(col, root, "floor_star_red", comp.merge(star(8, 0.9, 0.32, 0.0062, False), xf(star(8, 0.62, 0.25, 0.0058, False), R(22.5, "Z"))), red)
comp.mesh(col, root, "floor_boss", comp.cyl(0.07, 0.008, at=(0, 0, 0.003), seg=32, r2=0.06), brass, smooth=False)
comp.export(col, root, "stairwell", "floor", made="blender/components/stairwell/floor.py", source="own geometry; textures: https://polyhaven.com/a/old_mosaic_floor, https://polyhaven.com/a/marble_01", license="ours; textures CC0", credit="Poly Haven (old_mosaic_floor, marble_01)",
            notes="origin: the well's axis at the floor's top")
