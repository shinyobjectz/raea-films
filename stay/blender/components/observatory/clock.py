# observatory/clock: the sidereal clock, Poly Haven's vintage_grandfather_clock_01 (CC0), a 2.2 m long-case regulator.
# Rig: "hands" turns the minute hand one whole turn and the hour hand a twelfth about the dial's centre.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "clock", "vintage_grandfather_clock_01", res="2k")
hour, minute = parts["HourHand"], parts["MinuteHand"]
at = minute.matrix_world.translation.copy()        # the hands are modelled about the dial's centre
hl, hh = comp.box_of(hour)
ml, mh = comp.box_of(minute)
print("clock hands' origins", tuple(round(v, 3) for v in at), tuple(round(v, 3) for v in hour.matrix_world.translation), "boxes", hl, hh, ml, mh)
ph = comp.hang(col, root, [hour], "clock_hour", at=hour.matrix_world.translation.copy())
pm = comp.hang(col, root, [minute], "clock_minute", at=at)
_lib.channel("hands", [(pm, "rotation_euler", 1, 0, 2 * math.pi), (ph, "rotation_euler", 1, 0, 2 * math.pi / 12)])
comp.export(col, root, "observatory", "clock", made="blender/components/observatory/clock.py", source="https://polyhaven.com/a/vintage_grandfather_clock_01", license="CC0", credit=credit,
            rig={"hands": "the minute hand one whole turn clockwise, the hour hand a twelfth"})
