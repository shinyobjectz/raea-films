# clocktower/leading-off: the leading-off work that carries the movement's turn to the dial, modelled by hand: a
# vertical steel rod rising 1.8 m from a bevel wheel that sits on the movement's bevel, a second pair of bevels at the
# dial's height in a cast bracket, and a horizontal rod running 2.1 m back to the dial's minute arbor, with a
# universal joint, and two strap hangers up to the beams. Origin: the floor under the vertical rod (the rod at the
# movement's bevel: 0.42 m behind the movement's origin, 0.08 m left). The dial end is toward +y.
# Rig: "turn" both rods one whole turn (loops); "push" 120 degrees, as the movement's push turns its second arbor.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, gear, bevel_gear, bolt

col, root = comp.fresh("leading_off")
iron = comp.mat("leading_iron", (0.02, 0.022, 0.025), rough=0.55)
brass = comp.mat("leading_brass", (0.72, 0.43, 0.1), rough=0.3, metal=1.0)
steel = comp.mat("leading_steel", (0.55, 0.56, 0.58), rough=0.3, metal=1.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
Z0, Z1, RG, LEN, TOP = 1.055, 2.95, 0.072, 2.13, 4.15
vert = comp.pivot(col, root, "leading_off_vertical", (0, 0, Z0))
horiz = comp.pivot(col, root, "leading_off_horizontal", (0, 0, Z1))
M("leading_off_rod_up", comp.cyl(0.012, Z1 - Z0 - 0.09, at=(0, 0, Z0 + 0.06), seg=14), steel, parent=vert, smooth=True)
low = xf(bevel_gear(24, 0.006, 0.03, math.pi / 24), R(-90, "X"))  # its cone's point down, onto the movement's bevel
M("leading_off_bevel_low", xf(low, T(0, 0, Z0 + 0.075)), brass, parent=vert)
up = xf(bevel_gear(24, 0.006, 0.03, 0.0), R(90, "X"))
M("leading_off_bevel_up", xf(up, T(0, 0, Z1 - 0.075)), brass, parent=vert)
hz = bevel_gear(24, 0.006, 0.03, math.pi / 24)
xf(hz, S(1, -1, 1)); bmesh.ops.reverse_faces(hz, faces=hz.faces)
M("leading_off_bevel_across", xf(hz, T(0, 0.075, Z1)), brass, parent=horiz)
M("leading_off_rod_across", comp.cyl(0.012, LEN - 0.03, at=(0, 0.03, Z1), seg=14, axis="Y"), steel, parent=horiz, smooth=True)
# a universal joint a third of the way along, and the coupling flange at the dial end
uj = comp.merge(comp.cyl(0.03, 0.05, at=(0, 0.7, Z1), seg=16, axis="Y"), comp.cyl(0.03, 0.05, at=(0, 0.79, Z1), seg=16, axis="Y"), comp.box((0.05, 0.05, 0.05), at=(0, 0.77, Z1)),
                comp.cyl(0.008, 0.08, at=(-0.04, 0.77, Z1), seg=10, axis="X"), comp.cyl(0.008, 0.08, at=(0, 0.77, Z1 - 0.04), seg=10))
M("leading_off_joint", uj, steel, parent=horiz)
M("leading_off_flange", comp.merge(comp.cyl(0.04, 0.03, at=(0, LEN - 0.03, Z1), seg=20, axis="Y"), *[bolt((0.028 * math.cos(a), LEN - 0.04, 0.028 * math.sin(a)), 0.007, 0.01, axis="Y") for a in (1, 3.1, 5.2)]), steel, parent=horiz)
# the bevel bracket: a cast box frame round the two wheels, hung from the beam by a strap
frame = comp.merge(comp.box((0.03, 0.26, 0.03), at=(-0.11, 0.04, Z1 + 0.11)), comp.box((0.03, 0.26, 0.03), at=(0.11, 0.04, Z1 + 0.11)), comp.box((0.25, 0.03, 0.03), at=(0, -0.09, Z1 + 0.11)), comp.box((0.25, 0.03, 0.03), at=(0, 0.17, Z1 + 0.11)),
                   comp.box((0.03, 0.03, 0.14), at=(0, 0.17, Z1 + 0.04)), comp.cyl(0.028, 0.04, at=(0, 0.15, Z1), seg=16, axis="Y"),
                   comp.box((0.03, 0.03, 0.3), at=(-0.11, -0.09, Z1 - 0.04)), comp.box((0.14, 0.03, 0.03), at=(-0.055, -0.09, Z1 - 0.19)), comp.cyl(0.028, 0.04, at=(0, 0, Z1 - 0.2), seg=16),
                   comp.box((0.05, 0.012, TOP - Z1 - 0.12), at=(0, -0.09, (TOP + Z1 + 0.12) / 2)), comp.box((0.16, 0.08, 0.012), at=(0, -0.09, TOP - 0.006)))
f = M("leading_off_bracket", frame, iron)
comp.bevel(f, 0.003, 2)
hang = []
for y in (1.1, 1.9):
    hang += [comp.box((0.04, 0.01, TOP - Z1), at=(0, y, (TOP + Z1) / 2 + 0.02)), comp.cyl(0.03, 0.04, at=(0, y - 0.02, Z1), seg=16, axis="Y"), comp.box((0.14, 0.07, 0.012), at=(0, y, TOP - 0.006))]
h = M("leading_off_hangers", comp.merge(*hang), iron)
comp.bevel(h, 0.002, 2)
comp.channel("turn", [(vert, "rotation_euler", 2, 0, 2 * math.pi), (horiz, "rotation_euler", 1, 0, 2 * math.pi)])
comp.channel("push", [(vert, "rotation_euler", 2, 0, math.radians(120)), (horiz, "rotation_euler", 1, 0, math.radians(120))])
comp.export(col, root, "clocktower", "leading_off", made="blender/components/clocktower/leading_off.py", source="own geometry (generic leading-off rods and bevel wheels)", license="ours", credit="",
            rig={"turn": "both rods and their bevel wheels one whole turn, loops", "push": "both rods 120 degrees, with the movement's push"},
            notes="Stands with its vertical rod over the movement's bevel wheel; its hangers reach 4.15 m, the underside of clocktower/beams' joists.")
