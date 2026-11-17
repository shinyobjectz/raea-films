# clocktower/clock-face: the tower's dial seen from inside, 2.56 m across, modelled by hand: a cast-iron ring and
# glazing bars (twelve spokes, two hoops) holding opal glass that the noon outside lights (its own material,
# face_glass), the Roman chapter ring painted on the glass and read backwards from in here, the two hands outside
# (gilt, with their dark shapes on the glass), and on the inside the motion work on its bridge: the minute arbor
# coming in from the leading-off rod, a 20-tooth cannon pinion driving a 60, its 16 driving the 64-tooth hour wheel
# on the hour pipe (12 to 1). Origin: the dial's centre, its outside (back) at y 0, the room toward -y.
# Rig: "hands" winds an hour on (minute a whole turn, hour 30 degrees, anticlockwise from inside, the motion work
# turning with them); "push" is what the movement's push sends up: the minute hand 120 degrees, the hour hand 10.
# "light" is the scene's: face_glass's glow.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, gear, mesh_phase, bolt, flip, torus

col, root = comp.fresh("clock_face")
iron = comp.mat("face_iron", (0.02, 0.022, 0.025), rough=0.55)
glass = comp.mat("face_glass", (0.93, 0.9, 0.8), rough=0.35, emit=(1.0, 0.95, 0.82), strength=1800.0)
paint = comp.mat("face_numerals", (0.012, 0.012, 0.014), rough=0.6)
shade = comp.mat("face_hand_shadow", (0.035, 0.033, 0.03), rough=0.7)
gilt = comp.mat("face_gilt", (0.8, 0.58, 0.14), rough=0.3, metal=1.0)
brass = comp.mat("face_brass", (0.72, 0.43, 0.1), rough=0.3, metal=1.0)
steel = comp.mat("face_steel", (0.55, 0.56, 0.58), rough=0.3, metal=1.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
RD, GY = 1.2, -0.05
ring = lathe([(RD - 0.01, -0.11), (RD + 0.08, -0.11), (RD + 0.08, -0.08), (RD + 0.05, -0.06), (RD + 0.05, 0.0), (RD - 0.01, 0.0), (RD - 0.01, -0.11)], seg=96, axis="Y")
M("clock_face_ring", ring, iron, smooth=False)
M("clock_face_glass", comp.cyl(RD, 0.012, at=(0, GY - 0.006, 0), seg=96, axis="Y"), glass)
bars = [torus(0.26, 0.016, seg=48, sides=8), torus(0.82, 0.014, seg=96, sides=8), torus(1.16, 0.012, seg=96, sides=8)]
for b in bars:
    xf(b, T(0, GY - 0.022, 0))
for k in range(12):
    b = comp.box((RD - 0.26, 0.03, 0.022), at=((RD + 0.26) / 2, GY - 0.021, 0))
    xf(b, R(k * 30 + 15, "Y")); bars.append(b)
M("clock_face_bars", comp.merge(*bars), iron)
# the chapter ring: numerals and minute marks on the glass's inside, mirrored
NUM = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
marks = []
for h, word in enumerate(NUM):
    phi = math.atan2(math.cos(math.radians(h * 30)), -math.sin(math.radians(h * 30)))
    t = flip(comp.text(word, 0.24, depth=0.002))
    xf(t, S(0.62, 1, 1))
    xf(t, T(0, 0, 0.98)); xf(t, comp.Matrix.Rotation(math.pi / 2 - phi, 4, "Y")); xf(t, T(0, GY - 0.0135, 0))
    marks.append(t)
for i in range(60):
    b = comp.box((0.012 if i % 5 else 0.03, 0.002, 0.05), at=(0, GY - 0.0135, 1.135))
    xf(b, R(i * 6, "Y")); marks.append(b)
M("clock_face_numerals", comp.merge(*marks), paint)

# the hands: pivots on the centre, the gilt hands outside the glass and their shapes on its inside
minute = comp.pivot(col, root, "clock_face_minute", (0, 0, 0))
hour = comp.pivot(col, root, "clock_face_hour", (0, 0, 0))


def hand(length, w, tail, y, t=0.006):
    bm = bmesh.new()
    pts = [(-w * 0.5, -tail), (-w * 0.9, -tail * 0.55), (-w * 0.35, 0), (-w * 0.5, length * 0.55), (-w * 1.1, length * 0.72), (0, length), (w * 1.1, length * 0.72), (w * 0.5, length * 0.55), (w * 0.35, 0), (w * 0.9, -tail * 0.55), (w * 0.5, -tail)]
    f = [bm.verts.new((x, y - t / 2, z)) for x, z in pts]
    b = [bm.verts.new((x, y + t / 2, z)) for x, z in pts]
    bm.faces.new(f); bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((f[j], f[i], b[i], b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return bm


MIN0, HR0 = -54 * 6, -(11 + 54 / 60) * 30  # 11:54, anticlockwise from in here (a turn about y)
for nm, pv, L, w, tail, a0 in (("minute", minute, 1.1, 0.05, 0.3, MIN0), ("hour", hour, 0.74, 0.075, 0.24, HR0)):
    rot = R(-a0, "Y")  # R(b) takes angle a to a - b: anticlockwise from inside is a rising angle
    M(f"clock_face_{nm}_hand", xf(hand(L, w, tail, -0.022 if nm == "minute" else -0.034), rot), gilt, parent=pv)
    M(f"clock_face_{nm}_shadow", xf(hand(L, w, tail, GY - 0.0138, t=0.002), rot), shade, parent=pv)
M("clock_face_hand_boss", comp.cyl(0.07, 0.022, at=(0, -0.022, 0), seg=32, axis="Y"), gilt, parent=minute, smooth=False)

# the motion work on its bridge
BY = -0.2
bridge = comp.merge(comp.box((1.7, 0.02, 0.07), at=(0, BY, 0)), *[comp.cyl(0.02, -(BY - GY) - 0.02, at=(s * 0.82, BY, 0), seg=12, axis="Y") for s in (-1, 1)],
                    comp.cyl(0.06, 0.05, at=(0, BY - 0.025, 0), seg=24, axis="Y"))
br = M("clock_face_bridge", bridge, iron)
comp.bevel(br, 0.004, 2)
M("clock_face_bridge_bolts", comp.merge(*[bolt((s * 0.82, BY - 0.018, 0), 0.016, 0.01, axis="Y") for s in (-1, 1)]), steel)
MOD = 0.006
M("clock_face_minute_arbor", comp.cyl(0.014, 0.75, at=(0, -0.75, 0), seg=16, axis="Y"), steel, parent=minute, smooth=True)
M("clock_face_coupling", comp.merge(comp.cyl(0.04, 0.05, at=(0, -0.76, 0), seg=20, axis="Y"), *[bolt((0.028 * math.cos(a), -0.768, 0.028 * math.sin(a)), 0.007, 0.01, axis="Y") for a in (0, 2.1, 4.2)]), steel, parent=minute)
M("clock_face_hour_pipe", comp.cyl(0.026, 0.33, at=(0, -0.345, 0), seg=20, axis="Y"), brass, parent=hour, smooth=True)
PHC = 0.0
TH = math.radians(-38)
SX, SZ = 0.24 * math.cos(TH), 0.24 * math.sin(TH)
side = comp.pivot(col, root, "clock_face_motion", (SX, 0, SZ))
M("clock_face_cannon_pinion", xf(gear(20, MOD, 0.03, PHC, spokes=0, bore=0.014), T(0, -0.42, 0)), steel, parent=minute)
M("clock_face_minute_wheel", xf(gear(60, MOD, 0.016, mesh_phase(20, PHC, TH, 60), spokes=4), T(SX, -0.42, SZ)), brass, parent=side)
PHS = 0.2
M("clock_face_minute_pinion", xf(gear(16, MOD, 0.03, PHS, spokes=0, bore=0.01), T(SX, -0.32, SZ)), steel, parent=side)
M("clock_face_hour_wheel", xf(gear(64, MOD, 0.016, mesh_phase(16, PHS, TH + math.pi, 64), spokes=4, hub=0.045, bore=0.026), T(0, -0.32, 0)), brass, parent=hour)
M("clock_face_motion_arbor", comp.cyl(0.01, 0.27, at=(SX, -0.46, SZ), seg=12, axis="Y"), steel, parent=side, smooth=True)
post = comp.merge(comp.box((0.04, 0.012, abs(SZ) + 0.04), at=(SX, -0.47, SZ / 2)), comp.box((0.04, 0.27, 0.012), at=(SX, -0.335, 0.0)), comp.cyl(0.022, 0.02, at=(SX, -0.48, SZ), seg=16, axis="Y"))
M("clock_face_motion_cock", post, iron)

G = math.radians(120)
comp.channel("hands", [(minute, "rotation_euler", 1, 0, -2 * math.pi), (side, "rotation_euler", 1, 0, 2 * math.pi / 3), (hour, "rotation_euler", 1, 0, -2 * math.pi / 12)])
comp.channel("push", [(minute, "rotation_euler", 1, 0, -G), (side, "rotation_euler", 1, 0, G / 3), (hour, "rotation_euler", 1, 0, -G / 12)])
comp.export(col, root, "clocktower", "clock_face", made="blender/components/clocktower/clock_face.py", source="own geometry (a generic glazed tower-clock dial and its motion work); numerals in Blender's built-in font", license="ours", credit="",
            rig={"hands": "one hour on: the minute hand a whole turn, the hour hand 30 degrees, anticlockwise seen from inside; the motion work turns with them",
                 "push": "what the movement's push sends up: the minute hand 120 degrees on, the hour hand 10",
                 "light": "in the scene: the material face_glass's glow (the daylight behind the dial), a key per state"},
            notes="The dial is the shot's second circle (upper right). It reads 11:54 at rest. Its minute arbor's coupling is 0.76 m in from the dial's back, where clocktower/leading-off's rod ends.")
