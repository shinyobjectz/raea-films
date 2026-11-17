# garage/sodium-light: a ceiling sodium batten, 1.15 m long, modelled by hand: a conduit box and two stirrups under the
# soffit (its top at z 0, the origin), a grey die-cast gear tray, and a ribbed prismatic bowl held by six steel clips,
# in the material sodium_glow (deep amber). Rig: "on" is the scene's: sodium_glow's glow and the light under it, a key
# per state (the bay lights come on one by one).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("sodium_light")
M = L.maker(col, root)
body = comp.mat("sodium_body", (0.32, 0.33, 0.34), rough=0.5, metal=0.6)
glow = comp.mat("sodium_glow", (1.0, 0.62, 0.18), rough=0.35, emit=(1.0, 0.5, 0.1), strength=40.0)
steel = comp.mat("sodium_clips", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
LEN, WID = 1.15, 0.2
M("sodium_light_box", comp.merge(comp.cyl(0.045, 0.04, at=(0, 0, -0.04), seg=20), *[comp.box((0.03, WID + 0.02, 0.05), at=(x, 0, -0.045)) for x in (-0.35, 0.35)]), steel)
tray = comp.box((LEN, WID, 0.07), at=(0, 0, -0.105))
for v in tray.verts:
    if v.co.z > -0.08:
        v.co.x *= 0.94
        v.co.y *= 0.75
t = M("sodium_light_tray", tray, body)
comp.bevel(t, 0.008, 2)
bowl = comp.box((LEN - 0.04, WID - 0.02, 0.085), at=(0, 0, -0.18))
for v in bowl.verts:
    if v.co.z < -0.2:
        v.co.x *= 0.97
        v.co.y *= 0.7
b = M("sodium_light_bowl", bowl, glow)
comp.bevel(b, 0.022, 4)
L.sharp(b, 50)
ribs = [comp.box((0.006, WID - 0.012, 0.07), at=(-LEN / 2 + 0.06 + i * (LEN - 0.12) / 22, 0, -0.176)) for i in range(23)]
M("sodium_light_ribs", comp.merge(*ribs), glow)
clips = [comp.box((0.025, 0.006, 0.05), at=(x, s * (WID / 2 + 0.002), -0.15)) for x in (-0.42, 0, 0.42) for s in (-1, 1)]
M("sodium_light_clips", comp.merge(*clips), steel)
ends = [comp.box((0.02, WID + 0.004, 0.1), at=(s * (LEN / 2 - 0.004), 0, -0.165)) for s in (-1, 1)]
e = M("sodium_light_ends", comp.merge(*ends), body)
comp.bevel(e, 0.006, 2)
L.look(col, "sodium-light", eye=(1.2, -1.4, -0.9), target=(0, 0, -0.12), lens=45)
comp.export(col, root, "garage", "sodium_light", made="blender/components/garage/sodium_light.py", source="own geometry (a generic sodium batten)", license="ours", credit="",
            rig={"on": "in the scene: the material sodium_glow's glow and a light under the fitting, a key per state"})
