# kelp/particles: the drift in the water, modelled by hand: 640 flecks of marine snow, 3 to 9 mm (far larger than
# life so they read), in two layers filling a block of water 12 x 7 m and 9 m high. Its origin is on the seabed's
# level under the block's middle. Material: marine_snow (glows faintly). Rig: "drift" carries one layer 1.1 m
# down-current (+x) and up 0.2 m, the other 0.6 m and down 0.1 m (the drift slowing with the current is the scene's timing).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("particles")
m = comp.mat("marine_snow", (0.85, 1.0, 0.92), rough=0.6, emit=(0.75, 1.0, 0.9), strength=130.0)
rnd = random.Random(23)
piv = []
for g in range(2):
    p = comp.pivot(col, root, f"particles_layer_{'ab'[g]}", (0, 0, 4.5))
    parts = []
    for i in range(320):
        r = rnd.uniform(0.0015, 0.0045)
        b = L.ball(r, sub=1, squash=(rnd.uniform(0.6, 1.6), 1, rnd.uniform(0.5, 1.0)))
        parts.append(xf(b, T(rnd.uniform(-6, 6), rnd.uniform(-3.5, 3.5), rnd.uniform(0.3, 9.0))))
    comp.mesh(col, root, f"particles_flecks_{'ab'[g]}", comp.merge(*parts), m, parent=p)
    piv.append(p)
L.channel("drift", [(piv[0], "location", 0, 0.0, 1.1), (piv[0], "location", 2, piv[0].location.z, piv[0].location.z + 0.2),
                       (piv[1], "location", 0, 0.0, 0.6), (piv[1], "location", 2, piv[1].location.z, piv[1].location.z - 0.1)])
comp.export(col, root, "kelp", "particles", made="blender/components/kelp/particles.py", source="own geometry", license="ours", credit="",
            rig={"drift": "one layer of flecks (particles_layer_a) moves 1.1 m along +x and 0.2 m up, the other (particles_layer_b) 0.6 m along and 0.1 m down", "glow": "in the scene: the material marine_snow's glow"})
