# turbines/windsock: a windsock on a tilting mast by the crane pad, modelled by hand: a 6 m galvanised pole on a hinged
# base plate with a lowering bolt, a swivel head with a wire frame, and a 2.4 m orange and white striped sock tapering
# from 0.6 m to 0.3 m, sagging at rest. Rig: "swing" turns the frame and sock one whole turn about the pole (the wind
# veering round); "fill" lifts the sock from its sag to straight out (the wind getting up).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe
from mathutils import Vector, Matrix

col, root = comp.fresh("windsock")
galv = comp.mat("windsock_pole", (0.6, 0.62, 0.64), rough=0.35, metal=1.0)
orange = comp.mat("windsock_orange", (0.9, 0.22, 0.02), rough=0.8)
white = comp.mat("windsock_white", (0.85, 0.85, 0.82), rough=0.8)
conc = comp.mat("windsock_concrete", (0.45, 0.44, 0.42), rough=0.9)
M = _lib.maker(col, root)
H = 6.0
M("windsock_base", comp.merge(comp.box((0.7, 0.7, 0.2), at=(0, 0, 0.08))), conc)
M("windsock_mast", comp.merge(comp.cyl(0.045, H - 0.2, at=(0, 0, 0.2), seg=14, r2=0.035), comp.box((0.3, 0.3, 0.02), at=(0, 0, 0.19)), comp.box((0.04, 0.2, 0.3), at=(0.09, 0, 0.34)), comp.box((0.04, 0.2, 0.3), at=(-0.09, 0, 0.34)),
                                 comp.cyl(0.012, 0.26, at=(-0.13, 0, 0.4), seg=8, axis="X"), *[comp.cyl(0.012, 0.03, at=(sx * 0.11, sy * 0.11, 0.2), seg=6) for sx in (-1, 1) for sy in (-1, 1)]), galv, smooth=False)
swing = comp.pivot(col, root, "windsock_swing", (0, 0, H))
ring_ = lathe([(0.3 + 0.01 * math.cos(i * math.pi / 3), 0.01 * math.sin(i * math.pi / 3)) for i in range(7)], seg=24)
xf(ring_, R(90, "Y")); xf(ring_, T(0.35, 0, H + 0.35))
frame = comp.merge(comp.cyl(0.05, 0.14, at=(0, 0, H - 0.04), seg=14), ring_, comp.tube([(0, 0, H + 0.08), (0.2, 0, H + 0.35), (0.35, 0, H + 0.35)], 0.012, sides=2),
                   comp.cyl(0.008, 0.6, at=(0.35, -0.3, H + 0.35), seg=6, axis="Y"), comp.cyl(0.008, 0.6, at=(0.35, 0, H + 0.05), seg=6))
M("windsock_frame", frame, galv, parent=swing, smooth=True)
fill = comp.pivot(col, root, "windsock_fill", (0.35, 0, H + 0.35), parent=swing)
L, NB = 2.4, 5
sock = bmesh.new()
rings = []
NS, NR = 16, 20
for i in range(NS + 1):
    t = i / NS
    r = 0.3 - 0.15 * t
    rings.append([sock.verts.new((0.35 + L * t, r * math.cos(2 * math.pi * j / NR), H + 0.35 + r * math.sin(2 * math.pi * j / NR) * (1 - 0.12 * t))) for j in range(NR)])
for i in range(NS):
    for j in range(NR):
        f = sock.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][(j + 1) % NR], rings[i][(j + 1) % NR]))
        f.material_index = int(i / NS * NB) % 2
bmesh.ops.recalc_face_normals(sock, faces=sock.faces)
M("windsock_sock", sock, [orange, white], parent=fill, smooth=True)
fill.rotation_euler[1] = math.radians(48)        # at rest it hangs
bpy.context.view_layer.update()
comp.channel("swing", [(swing, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("fill", [(fill, "rotation_euler", 1, math.radians(48), math.radians(3))])
comp.export(col, root, "turbines", "windsock", made="blender/components/turbines/windsock.py", source="own geometry (a generic windsock on a tilting mast)", license="ours", credit="",
            rig={"swing": "the frame and sock one whole turn about the pole (windsock_swing)", "fill": "the sock lifts from hanging 48 degrees down to straight out (windsock_fill)"},
            notes="at rest the sock streams toward +x and hangs")
