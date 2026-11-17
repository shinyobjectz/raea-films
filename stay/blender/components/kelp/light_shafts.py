# kelp/light-shafts: the sun's shafts in the water, modelled by hand: eighteen long thin cones of light fanning down
# from one point of the surface, 8 to 11.5 m long, a few degrees apart, each narrowing and fading out toward the bottom (light_shaft_fade.png).
# A ceiling piece: its origin is the point on the surface the shafts come from. Material: light_shaft_water
# (see-through, glows). Rig: "sway" tips the whole fan 6 degrees and turns it 20 about the upright (the swell
# moving the shafts through the kelp).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("light_shafts")
import numpy as np, bmesh
g = np.linspace(0, 1, 64)[:, None] * np.ones((1, 4))             # v 0 at a shaft's foot, 1 at the surface
fade_png = L.save_png(os.path.join(L.TEX, "light_shaft_fade.png"), np.dstack([0.62 * g ** 0.6, g ** 0.5, 0.9 * g ** 0.5, 0.2 * g ** 1.4]))
m = L.picture("light_shaft_water", fade_png, emit=60.0, rough=1.0, alpha=True)
fan = comp.pivot(col, root, "light_shafts_fan", (0, 0, 0))
random.seed(17)
parts = []
SEG = 8
for i in range(18):
    az = random.uniform(0, 2 * math.pi)
    tilt = math.radians(random.uniform(3, 24))
    ln = random.uniform(8.0, 11.5)
    r0 = random.uniform(0.28, 0.65)
    c = bmesh.new()
    uvl = c.loops.layers.uv.new("UVMap")
    top = [c.verts.new((r0 * 1.9 * math.cos(2 * math.pi * k / SEG), r0 * 1.9 * math.sin(2 * math.pi * k / SEG), -0.3)) for k in range(SEG)]
    bot = [c.verts.new((r0 * 0.5 * math.cos(2 * math.pi * k / SEG), r0 * 0.5 * math.sin(2 * math.pi * k / SEG), -0.3 - ln)) for k in range(SEG)]
    for k in range(SEG):
        j = (k + 1) % SEG
        f = c.faces.new((top[k], bot[k], bot[j], top[j]))
        for l, vv in zip(f.loops, (1.0, 0.0, 0.0, 1.0)):
            l[uvl].uv = (0.5, vv)
    xf(c, R(math.degrees(tilt), "X"))
    xf(c, R(math.degrees(az), "Z"))
    parts.append(c)
comp.mesh(col, root, "light_shafts_cones", comp.merge(*parts), m, parent=fan, smooth=True)
L.channel("sway", [(fan, "rotation_euler", 0, 0.0, math.radians(6)), (fan, "rotation_euler", 2, 0.0, math.radians(20))])
comp.export(col, root, "kelp", "light_shafts", made="blender/components/kelp/light_shafts.py", source="own geometry", license="ours", credit="",
            rig={"sway": "the fan of shafts (light_shafts_fan) tips 6 degrees and turns 20 about the upright through the sun's point", "glow": "in the scene: the material light_shaft_water's glow"})
