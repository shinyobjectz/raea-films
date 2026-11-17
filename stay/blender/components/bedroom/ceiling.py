# bedroom/ceiling: the room's ceiling, 4.2 x 3.6 m, modelled by hand: a plaster slab (Poly Haven's ceiling_interior,
# CC0), a cove moulding round all four edges, a flush dome light at the middle (a brass rim, a frosted glass dome:
# ceiling_light), a smoke alarm with its test button and light, and the hairline crack every bedroom ceiling has.
# Its underside is at z 0 (the origin, at its centre): stand it at the walls' top, 2.5 m. The model planes hang from it.
# Rig: "light" is the scene's: ceiling_light's glow and a point light under the dome (off in both bedroom shots: the
# day is the sun's, the night the lamp's and the CRT's).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, xf
from _lib import ROOM_W, ROOM_D
col, root = comp.fresh("ceiling")
M = _lib.maker(col, root)
plaster = comp.ph_texture("ceiling_plaster", "ceiling_interior", tile=2.0, res="1k")
white = comp.mat("ceiling_trim", (0.9, 0.89, 0.85), rough=0.45)
brass = comp.mat("ceiling_brass", (0.74, 0.58, 0.28), rough=0.25, metal=1.0)
dome_m = comp.mat("ceiling_light", (0.95, 0.94, 0.9), rough=0.4, emit=(1.0, 0.9, 0.75), strength=0.2)
s = M("ceiling_slab", comp.box((ROOM_W + 0.28, ROOM_D + 0.28, 0.1), at=(0, 0, 0.05)), plaster)
comp.uv_box(s, 1.0)
# cove: a quarter-round along each wall
def cove(length):
    bm = bmesh.new()
    prof = [(0.0, 0.0)] + [(0.07 * (1 - math.cos(a)), -0.07 * (1 - math.sin(a))) for a in [i * math.pi / 2 / 6 for i in range(7)]] + [(0.0, -0.07)]
    vs0 = [bm.verts.new((-length / 2, y, z)) for y, z in prof]
    vs1 = [bm.verts.new((length / 2, y, z)) for y, z in prof]
    n = len(prof)
    for i in range(n):
        bm.faces.new((vs0[i], vs0[(i + 1) % n], vs1[(i + 1) % n], vs1[i]))
    bm.faces.new(vs0); bm.faces.new(list(reversed(vs1)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
coves = [xf(cove(ROOM_W), T(0, -ROOM_D / 2, 0)), xf(cove(ROOM_W), T(0, ROOM_D / 2, 0) @ R(180, "Z")), xf(cove(ROOM_D), T(-ROOM_W / 2, 0, 0) @ R(-90, "Z")), xf(cove(ROOM_D), T(ROOM_W / 2, 0, 0) @ R(90, "Z"))]
M("ceiling_cove", comp.merge(*coves), white, smooth=True)
# the dome light
M("ceiling_light_rim", xf(_lib.turn([(0.0, 0.0), (0.17, 0.0), (0.175, -0.008), (0.165, -0.022), (0.155, -0.024), (0.15, -0.012), (0.0, -0.012)], seg=48), T(0, 0, 0)), brass, smooth=True)
M("ceiling_light_dome", _lib.turn([(0.155, -0.02)] + [(0.155 * math.cos(a), -0.02 - 0.075 * math.sin(a)) for a in [i * math.pi / 2 / 10 for i in range(1, 11)]], seg=48), dome_m, smooth=True)
M("ceiling_light_finial", _lib.turn([(0.0, -0.093), (0.012, -0.095), (0.014, -0.103), (0.006, -0.11), (0.0, -0.112)], seg=16), brass, smooth=True)
# the smoke alarm, toward the door
al = M("ceiling_alarm", xf(_lib.turn([(0.0, 0.0), (0.06, 0.0), (0.062, -0.01), (0.055, -0.03), (0.04, -0.036), (0.0, -0.036)], seg=32), T(1.2, -0.9, 0)), white, smooth=True)
M("ceiling_alarm_slots", comp.merge(*[xf(comp.box((0.004, 0.02, 0.012)), T(1.2, -0.9, -0.02) @ R(i * 30, "Z") @ T(0.056, 0, 0)) for i in range(12)]), comp.mat("ceiling_alarm_slot", (0.05, 0.05, 0.05), rough=0.8))
M("ceiling_alarm_button", comp.cyl(0.012, 0.004, at=(1.2, -0.9, -0.04), seg=16), comp.mat("ceiling_alarm_button", (0.75, 0.74, 0.7), rough=0.4))
M("ceiling_alarm_led", comp.cyl(0.003, 0.002, at=(1.225, -0.9, -0.0375), seg=8), comp.mat("ceiling_alarm_led", (0.8, 0.05, 0.03), rough=0.3, emit=(1.0, 0.05, 0.02), strength=2.0))
M("ceiling_crack", comp.tube([(-1.9, 0.6, 0.0006), (-1.5, 0.66, 0.0006), (-1.2, 0.6, 0.0006), (-0.8, 0.68, 0.0006), (-0.45, 0.63, 0.0006), (-0.3, 0.7, 0.0006)], 0.0015, res=6, sides=1), comp.mat("ceiling_crack", (0.35, 0.33, 0.3), rough=0.9))
comp.export(col, root, _lib.PLACE, "ceiling", made="blender/components/bedroom/ceiling.py",
            source="own geometry; plaster: https://polyhaven.com/a/ceiling_interior", license="ours; texture CC0", credit="Poly Haven (ceiling_interior)",
            rig={"light": "in the scene: ceiling_light's glow and a point light under the dome"},
            notes="underside at z 0; it overhangs the room by the walls' thickness (0.14 m) all round")
