# gym/caged-clock: the gym's wall clock behind a ball guard: Poly Haven's wall_clock (CC0), 32 cm, with a welded wire
# cage modelled by hand over it (a ring, eight ribs and two hoops, on four lugs). Its back on the wall at y 0.
# Rig: "hands" winds the hands on an hour (the minute hand a whole turn, the hour hand a twelfth), "seconds" turns the
# second hand once. Clockwise seen from the front.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import torus, pipe, T, R, S, xf
col, root, parts, credit = comp.ph_component("gym", "caged_clock", "wall_clock", origin="back")
lo, hi = comp.box_of(parts["body"] if "body" in parts else list(parts.values()))
face = (lo + hi) / 2
hour = comp.hang(col, root, parts["hours_hand"], "caged_clock_hour", at=(face.x, face.y, face.z))
minute = comp.hang(col, root, parts["minute_hand"], "caged_clock_minute", at=(face.x, face.y, face.z))
second = comp.hang(col, root, parts["second_hand"], "caged_clock_second", at=(face.x, face.y, face.z))
wire = comp.mat("caged_clock_wire", (0.75, 0.75, 0.77), rough=0.3, metal=1.0)
cage = [torus(0.2, 0.004, seg=40, sides=5, at=(0, -0.004, 0), axis="Y"), torus(0.14, 0.003, seg=32, sides=4, at=(0, -0.105, 0), axis="Y"), torus(0.06, 0.003, seg=20, sides=4, at=(0, -0.13, 0), axis="Y")]
for i in range(8):
    a = 2 * math.pi * i / 8
    c, s = math.cos(a), math.sin(a)
    cage.append(pipe(_lib.fillet([(0.2 * c, -0.004, 0.2 * s), (0.19 * c, -0.07, 0.19 * s), (0.14 * c, -0.105, 0.14 * s), (0.06 * c, -0.13, 0.06 * s), (0, -0.135, 0)], 0.03), 0.003, sides=2))
for i in range(4):
    a = 2 * math.pi * (i + 0.5) / 4
    cage.append(comp.box((0.03, 0.004, 0.03), at=(0.215 * math.cos(a), -0.002, 0.215 * math.sin(a))))
comp.mesh(col, root, "caged_clock_cage", comp.merge(*cage), wire, smooth=True)
comp.channel("hands", [(minute, "rotation_euler", 1, 0, 2 * math.pi), (hour, "rotation_euler", 1, 0, 2 * math.pi / 12)])
comp.channel("seconds", [(second, "rotation_euler", 1, 0, 2 * math.pi)])
comp.export(col, root, "gym", "caged_clock", made="blender/components/gym/caged_clock.py",
            source="https://polyhaven.com/a/wall_clock; the wire guard is own geometry", license="CC0; guard ours", credit=credit,
            rig={"hands": "one hour on: the minute hand a whole turn, the hour hand 30 degrees, clockwise from the front",
                 "seconds": "the second hand one whole turn"})
