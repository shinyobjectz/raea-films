# lighthouse/buoy: a navigation buoy riding the swell off the point, 2.7 m (Poly Haven's ocean_buoy, CC0). It floats
# with its hull's lower 0.7 m under the water: its origin is the waterline. Rig: "bob" heels it 14 degrees about the
# waterline and lifts it 0.4 m (a swell passing under it).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("lighthouse", "buoy", "ocean_buoy", res="1k")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
SINK = 0.7
for o in parts.values():
    o.location.z -= SINK
comp.bpy.context.view_layer.update()
p = comp.hang(col, root, list(parts.values()), "buoy_float", at=(0, 0, 0))
comp.channel("bob", [(p, "rotation_euler", 0, 0, math.radians(14)), (p, "rotation_euler", 1, 0, math.radians(-6)), (p, "location", 2, 0, 0.4)])
comp.export(col, root, "lighthouse", "buoy", made="blender/components/lighthouse/buoy.py", source="https://polyhaven.com/a/ocean_buoy", license="CC0", credit=credit,
            rig={"bob": "the buoy heels 14 degrees about its waterline and rises 0.4 m (buoy_float)"}, notes="origin: its waterline; 0.7 m of the hull is under the sea")
