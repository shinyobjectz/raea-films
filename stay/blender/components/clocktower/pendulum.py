# clocktower/pendulum: the clock's pendulum on its own cast-iron A-frame, modelled by hand: a 1.2 m steel rod on a
# suspension spring in a brass chops block, a lens-shaped cast bob 0.34 m across with a rating nut under it, a
# beat scale on the frame's foot rail. Origin: the floor under the bob at rest (hanging plumb); it stands behind the
# movement so the crutch's fork takes the rod. Rig: "swing" swings it about the suspension from -4 to 4 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, bolt, sphere

col, root = comp.fresh("pendulum")
iron = comp.mat("pendulum_iron", (0.005, 0.022, 0.015), rough=0.5)
bob_m = comp.mat("pendulum_bob", (0.03, 0.03, 0.035), rough=0.4, metal=0.6)
brass = comp.mat("pendulum_brass", (0.72, 0.43, 0.1), rough=0.3, metal=1.0)
steel = comp.mat("pendulum_steel", (0.55, 0.56, 0.58), rough=0.3, metal=1.0)
enamel = comp.mat("pendulum_scale", (0.9, 0.88, 0.8), rough=0.4)
ink = comp.mat("pendulum_ink", (0.02, 0.02, 0.02), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
TOP, HALF = 1.6, 0.38
fr = bmesh.new()
for s in (-1, 1):
    prof = [(s * HALF - 0.04, 0), (s * HALF + 0.04, 0), (s * 0.06 + 0.03, TOP + 0.04), (s * 0.06 - 0.03, TOP + 0.04)]
    f = [fr.verts.new((x, -0.02, z)) for x, z in prof]
    b = [fr.verts.new((x, 0.02, z)) for x, z in prof]
    fr.faces.new(f); fr.faces.new(list(reversed(b)))
    for i in range(4):
        fr.faces.new((f[(i + 1) % 4], f[i], b[i], b[(i + 1) % 4]))
bmesh.ops.recalc_face_normals(fr, faces=fr.faces)
frame = comp.merge(fr, comp.box((0.26, 0.06, 0.07), at=(0, 0, TOP + 0.035)), comp.box((2 * HALF + 0.2, 0.09, 0.02), at=(0, 0, 0.01)), comp.box((2 * HALF - 0.16, 0.03, 0.04), at=(0, 0, 0.3)))
f = M("pendulum_frame", frame, iron)
comp.bevel(f, 0.004, 2)
M("pendulum_frame_bolts", comp.merge(*[bolt((s * (HALF + 0.07), y, 0.02), 0.01, 0.008) for s in (-1, 1) for y in (-0.025, 0.025)]), steel)
M("pendulum_chops", comp.merge(comp.box((0.06, 0.05, 0.05), at=(0, -0.055, TOP)), bolt((0, -0.085, TOP), 0.008, 0.008, axis="Y")), brass)
# the beat scale on the foot rail
M("pendulum_beat_scale", comp.box((0.3, 0.004, 0.05), at=(0, -0.047, 0.07)), enamel)
M("pendulum_beat_marks", comp.merge(*[comp.box((0.002, 0.002, 0.03 if i % 5 == 0 else 0.016), at=(i * 0.012, -0.05, 0.08)) for i in range(-10, 11)]), ink)
sw = comp.pivot(col, root, "pendulum_swing", (0, -0.055, TOP - 0.03))
M("pendulum_spring", comp.box((0.016, 0.0012, 0.08), at=(0, -0.055, TOP - 0.06)), steel, parent=sw)
M("pendulum_rod", comp.merge(comp.cyl(0.009, 1.38, at=(0, -0.055, 0.12), seg=12), comp.box((0.03, 0.02, 0.04), at=(0, -0.055, TOP - 0.11))), steel, parent=sw, smooth=False)
BZ = 0.36
bob = lathe([(0.0, -0.045), (0.06, -0.042), (0.12, -0.03), (0.16, -0.012), (0.17, 0.0), (0.16, 0.012), (0.12, 0.03), (0.06, 0.042), (0.0, 0.045)], seg=48, at=(0, -0.055, BZ), axis="Y")
M("pendulum_bob", bob, bob_m, parent=sw, smooth=True)
M("pendulum_rating_nut", comp.merge(comp.cyl(0.028, 0.02, at=(0, -0.055, BZ - 0.2), seg=6), comp.cyl(0.036, 0.006, at=(0, -0.055, BZ - 0.18), seg=24), comp.box((0.012, 0.004, 0.06), at=(0, -0.055, BZ - 0.25))), brass, parent=sw)
comp.channel("swing", [(sw, "rotation_euler", 1, math.radians(-4), math.radians(4))])
comp.export(col, root, "clocktower", "pendulum", made="blender/components/clocktower/pendulum.py", source="own geometry (a generic turret-clock pendulum on an A-frame)", license="ours", credit="",
            rig={"swing": "the rod and bob swing about the suspension spring from -4 to 4 degrees (the movement's tick rocks its crutch the same)"})
