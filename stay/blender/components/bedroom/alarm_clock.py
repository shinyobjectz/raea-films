# bedroom/alarm-clock: a twin-bell wind-up alarm clock for the nightstand (Poly Haven's alarm_clock_01, CC0), at 0.7
# of its size (12 cm high). Rig: "hands" winds its hands on an hour like the wall clock's (the
# cursor's winding turns every clock in the room together); "seconds" turns the second hand once.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component(_lib.PLACE, "alarm_clock", "alarm_clock_01", res="1k", origin="floor", scale=0.7)
lo, hi = comp.box_of(list(parts.values()))
print("alarm", list(parts), lo, hi)
rig = {}
# the asset's dial glass renders opaque black in raea: make it plain clear glass
for o in parts.values():
    for m in o.data.materials:
        if "glass" in m.name.lower():
            m.name = "alarm_clock_glass"
            b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            for l in list(m.node_tree.links):
                if l.to_node == b:
                    m.node_tree.links.remove(l)
            b.inputs["Base Color"].default_value = (0.9, 0.95, 1.0, 1)
            b.inputs["Roughness"].default_value = 0.03
            b.inputs["Metallic"].default_value = 0.0
            b.inputs["Alpha"].default_value = 0.06
C = (0.0, -0.011, 0.0455)   # the hands' arbor on the face (read off the hands' boxes)
hour = comp.hang(col, root, parts["houd_hand"], "alarm_clock_hour", at=C)
minute = comp.hang(col, root, parts["minute_hand"], "alarm_clock_minute", at=C)
second = comp.hang(col, root, parts["second_hand"], "alarm_clock_second", at=C)
comp.channel("hands", [(minute, "rotation_euler", 1, 0, 2 * math.pi), (hour, "rotation_euler", 1, 0, 2 * math.pi / 12)])
comp.channel("seconds", [(second, "rotation_euler", 1, 0, 2 * math.pi)])
rig = {"hands": "one hour on: the minute hand a whole turn, the hour hand 30 degrees, clockwise from the front", "seconds": "the second hand one whole turn"}
comp.export(col, root, _lib.PLACE, "alarm_clock", made="blender/components/bedroom/alarm_clock.py", source="https://polyhaven.com/a/alarm_clock_01", license="CC0", credit=credit, rig=rig)
