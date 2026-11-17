# office/wall-clock: a round office wall clock, 32 cm (Poly Haven's wall_clock, CC0), its back on the wall. Rig: "hands"
# winds the hands on an hour (the minute hand a whole turn, the hour hand a twelfth), "seconds" turns the second hand
# once. Clockwise seen from the front.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("office", "wall_clock", "wall_clock", origin="back")
lo, hi = comp.box_of(parts["body"] if "body" in parts else list(parts.values()))
face = (lo + hi) / 2
hour = comp.hang(col, root, parts["hours_hand"], "wall_clock_hour", at=(face.x, face.y, face.z))
minute = comp.hang(col, root, parts["minute_hand"], "wall_clock_minute", at=(face.x, face.y, face.z))
second = comp.hang(col, root, parts["second_hand"], "wall_clock_second", at=(face.x, face.y, face.z))
comp.channel("hands", [(minute, "rotation_euler", 1, 0, 2 * math.pi), (hour, "rotation_euler", 1, 0, 2 * math.pi / 12)])
comp.channel("seconds", [(second, "rotation_euler", 1, 0, 2 * math.pi)])
comp.export(col, root, "office", "wall_clock", made="blender/components/office/wall_clock.py",
            source="https://polyhaven.com/a/wall_clock", license="CC0", credit=credit,
            rig={"hands": "one hour on: the minute hand a whole turn, the hour hand 30 degrees, clockwise from the front",
                 "seconds": "the second hand one whole turn"})
