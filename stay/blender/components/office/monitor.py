# office/monitor: a 24-inch flat monitor on a clamped two-link arm, modelled by hand. The clamp grips a desk's back
# edge at the origin (the desk top is z 0); the screen faces -y. The glass is its own material (monitor_screen), so a
# scene gives it the app's capture and its glow. Rig: "swing" turns the whole arm 55 degrees about the post (the
# cursor swings the screen aside); "fold" pushes the screen 0.2 m back toward the post, still facing front; "tilt"
# tips the screen back 15 degrees. "screen wake" is the scene's: the glass's texture and glow.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("monitor")
black = comp.mat("monitor_plastic", (0.02, 0.02, 0.022), rough=0.45)
alu = comp.mat("monitor_aluminium", (0.75, 0.76, 0.78), rough=0.3, metal=1.0)
glass = comp.mat("monitor_screen", (0.01, 0.012, 0.016), rough=0.08)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)

clamp = M("monitor_clamp", comp.merge(comp.box((0.09, 0.07, 0.012), at=(0, 0, 0.006)), comp.box((0.07, 0.014, 0.07), at=(0, 0.042, -0.025)),
                                      comp.box((0.07, 0.05, 0.012), at=(0, 0.02, -0.06)), comp.cyl(0.006, 0.03, at=(0, 0.01, -0.054), seg=12)), alu)
comp.bevel(clamp, 0.002, 2)
M("monitor_post", comp.cyl(0.0175, 0.36, at=(0, 0, 0.012), seg=32), alu, smooth=True)
PZ = 0.33
a1 = comp.pivot(col, root, "monitor_arm_1", (0, 0, PZ))
E = Vector((-0.2, -0.1, PZ))
l1 = M("monitor_link_1", comp.merge(comp.cyl(0.028, 0.045, at=(0, 0, PZ - 0.0225), seg=32), comp.taper((0, 0, PZ + 0.016), E + Vector((0, 0, 0.016)), 0.042, 0.036, 0.032, 0.032),
                                    comp.cyl(0.024, 0.045, at=(E.x, E.y, PZ - 0.0225), seg=32)), alu, parent=a1)
comp.bevel(l1, 0.004, 2)
a2 = comp.pivot(col, root, "monitor_arm_2", E, parent=a1)
H = Vector((0.0, -0.22, PZ + 0.05))
l2 = M("monitor_link_2", comp.merge(comp.cyl(0.02, 0.05, at=(E.x, E.y, PZ + 0.0225), seg=32), comp.taper(E + Vector((0, 0, 0.066)), H + Vector((0, 0, 0.016)), 0.036, 0.032, 0.03, 0.03),
                                    comp.cyl(0.02, 0.045, at=(H.x, H.y, PZ + 0.02), seg=32)), alu, parent=a2)
comp.bevel(l2, 0.004, 2)
head = comp.pivot(col, root, "monitor_head", (H.x, H.y, PZ + 0.05), parent=a2)
tilt = comp.pivot(col, root, "monitor_tilt", (0, H.y - 0.03, PZ + 0.05), parent=head)
M("monitor_vesa", comp.merge(comp.box((0.03, 0.04, 0.03), at=(0, H.y - 0.015, PZ + 0.05)), comp.box((0.11, 0.008, 0.11), at=(0, H.y - 0.038, PZ + 0.05))), black, parent=tilt)
W, HH, SY = 0.545, 0.325, H.y - 0.06
case = M("monitor_case", comp.box((W, 0.036, HH), at=(0, SY + 0.012, PZ + 0.05)), black, parent=tilt)
comp.bevel(case, 0.006, 3)
M("monitor_glass", comp.box((W - 0.016, 0.002, HH - 0.022), at=(0, SY - 0.0065, PZ + 0.054)), glass, parent=tilt)
M("monitor_led", comp.box((0.006, 0.002, 0.002), at=(W / 2 - 0.03, SY - 0.0065, PZ + 0.05 - HH / 2 + 0.006)), comp.mat("monitor_led", (0.1, 0.5, 1.0), emit=(0.2, 0.6, 1.0), strength=4), parent=tilt)

comp.channel("swing", [(a1, "rotation_euler", 2, 0, math.radians(-55))])
comp.channel("fold", [(a1, "rotation_euler", 2, 0, math.radians(-38)), (a2, "rotation_euler", 2, 0, math.radians(80)), (head, "rotation_euler", 2, 0, math.radians(-42))])
comp.channel("tilt", [(tilt, "rotation_euler", 0, 0, math.radians(-15))])
comp.export(col, root, "office", "monitor", made="blender/components/office/monitor.py", source="own geometry (a generic flat monitor on a clamped arm)", license="ours", credit="",
            rig={"arm swing": "clip \"swing\": the whole arm turns 55 degrees about the post, carrying the screen to the side",
                 "arm fold": "clip \"fold\": the links fold and the screen moves back toward the post, still facing front",
                 "tilt": "the screen tips back 15 degrees",
                 "screen wake": "in the scene: the material monitor_screen takes the app's capture and its glow"})
