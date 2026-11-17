# cathedral/dust: dust in the light, modelled by hand: 520 motes (tiny bright flecks, 5 to 14 mm, far larger than
# dust so they read at a distance) in two drifts filling a column of air 4.5 m across and 8 m high, thickest along
# the line the rose's shaft takes. Its origin is on the floor under the column's middle. Material: dust_mote (glows).
# Rig: "drift" lifts one drift 0.45 m and turns it 22 degrees while the other sinks 0.2 m and turns back 14.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("dust")
mote = comp.mat("dust_mote", (1.0, 0.92, 0.75), rough=0.6, emit=(1.0, 0.88, 0.65), strength=2500.0)
random.seed(21)
piv = []
for g in range(2):
    p = comp.pivot(col, root, f"dust_drift_{'ab'[g]}", (0, 0, 4.0))
    parts = []
    for i in range(260):
        z = random.uniform(0.3, 8.0)
        # the shaft's line: high near the wall (+y), low out in the nave (-y)
        cy = 3.0 - (8.0 - z) * 0.75 + random.gauss(0, 1.0)
        x = random.gauss(0, 1.1)
        r = random.uniform(0.0025, 0.007)
        m = bmesh.new()
        bmesh.ops.create_icosphere(m, subdivisions=1, radius=r)
        xf(m, S(1, 1, random.uniform(0.5, 1.0)))
        xf(m, T(max(-2.25, min(2.25, x)), max(-4.0, min(4.0, cy)), z))
        parts.append(m)
    comp.mesh(col, root, f"dust_motes_{'ab'[g]}", comp.merge(*parts), mote, parent=p)
    piv.append(p)
L.channel("drift", [(piv[0], "location", 2, piv[0].location.z, piv[0].location.z + 0.45), (piv[0], "rotation_euler", 2, 0, math.radians(22)),
                       (piv[1], "location", 2, piv[1].location.z, piv[1].location.z - 0.2), (piv[1], "rotation_euler", 2, 0, math.radians(-14))])
comp.export(col, root, "cathedral", "dust", made="blender/components/cathedral/dust.py", source="own geometry", license="ours", credit="",
            rig={"drift": "one drift of motes (dust_drift_a) rises 0.45 m and turns 22 degrees, the other (dust_drift_b) sinks 0.2 m and turns 14 degrees the other way",
                 "glow": "in the scene: the material dust_mote's glow (the motes only show in the shaft)"})
