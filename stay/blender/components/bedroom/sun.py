# bedroom/sun: the sun outside the window as a thing the clock's hands drive: a glowing disc (sun_disc) on an arm
# 3 m long about the window's centre (the origin), its path a circle tipped 30 degrees like a real day's. Rig: "arc"
# carries the disc 90 degrees along its path, from mid-afternoon (27 degrees up, to the right of the window seen from
# the room) down to 10 degrees over the horizon on the left, so its light sweeps the room left to right. The scene's DirectionalLight
# points from the disc (the node sun_disc) through the origin; scale the Model to push the disc further off.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy
from comp import T, R, xf
col, root = comp.fresh("sun")
M = _lib.maker(col, root)
glow = comp.mat("sun_disc", (1.0, 0.6, 0.2), rough=0.5, emit=(1.0, 0.42, 0.08), strength=4.0)
RAD, A0, TIP = 3.0, 70.0, 30.0
tip = comp.pivot(col, root, "sun_path", (0, 0, 0))
arc = comp.pivot(col, root, "sun_arc", (0, 0, 0), parent=tip)
ball = _lib.uv_sphere(0.22, seg=32, rings=16)
xf(ball, T(RAD * math.cos(math.radians(A0)), RAD * math.sin(math.radians(A0)), 0))
M("sun_disc", ball, glow, parent=arc, smooth=True)
tip.rotation_euler[0] = math.radians(TIP)
bpy.context.view_layer.update()
comp.channel("arc", [(arc, "rotation_euler", 2, 0, math.radians(90))])
comp.export(col, root, _lib.PLACE, "sun", made="blender/components/bedroom/sun.py", source="own geometry", license="ours", credit="",
            rig={"arc": "the disc 90 degrees along its tipped path about the window's centre: from 27 degrees up on the right to 10 degrees up on the left (afternoon to dusk; the scene takes it on below the sill for night)",
                 "light": "in the scene: the DirectionalLight looks from the node sun_disc through the origin, its colour warming as the disc sinks; sun_disc is the glow"},
            notes="origin = the window's centre; the disc is 0.44 m across, 3 m out (outside the room, Blender +y)")
