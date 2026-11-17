# kelp/urchins: seven sea urchins grazing in a group, modelled by hand: five purple urchins (a flattened test 7 to 9
# cm across, about 150 spines each) and two red urchins (12 cm, spines 8 cm long). On the rock, round the origin.
# Rig: "bristle" raises every urchin's spines by a sixth and turns it a little (they stir when the current drops).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("urchins")
purple = (L.ambient(comp.mat("urchin_purple_test", (0.16, 0.05, 0.24), rough=0.5)), L.ambient(comp.mat("urchin_purple_spines", (0.3, 0.1, 0.5), rough=0.35), 70.0))
red = (L.ambient(comp.mat("urchin_red_test", (0.2, 0.03, 0.04), rough=0.5)), L.ambient(comp.mat("urchin_red_spines", (0.4, 0.04, 0.06), rough=0.35), 70.0))
rnd = random.Random(8)
keys = []
spots = [(0.0, 0.0, 0.04, purple, 0.045), (0.16, 0.08, 0.035, purple, 0.04), (-0.12, 0.14, 0.045, purple, 0.05), (0.07, -0.17, 0.04, purple, 0.045), (-0.2, -0.08, 0.036, purple, 0.04),
         (0.36, -0.12, 0.06, red, 0.08), (-0.38, 0.22, 0.062, red, 0.085)]
for n, (x, y, r, (test_m, spine_m), sl) in enumerate(spots):
    p = comp.pivot(col, root, f"urchins_urchin_{n + 1}", (x, y, r * 0.55))
    comp.mesh(col, root, f"urchins_test_{n + 1}", L.ball(r, (x, y, r * 0.55), sub=2, squash=(1, 1, 0.62)), test_m, parent=p, smooth=True)
    sp = []
    N = 150
    for i in range(N):
        zz = 1 - (i + 0.5) / N * 1.35               # from the top down past the middle
        if zz < -0.3:
            continue
        ph = i * 2.39996
        rr = math.sqrt(max(0.0, 1 - zz * zz))
        d = Vector((rr * math.cos(ph), rr * math.sin(ph), zz * 0.75)).normalized()
        d = (d + Vector((rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12)))).normalized()
        c = comp.cyl(r * 0.07, sl * rnd.uniform(0.7, 1.15), seg=4, r2=0.0006)
        xf(c, Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4())
        xf(c, T(x + d.x * r * 0.9, y + d.y * r * 0.9, r * 0.55 + d.z * r * 0.56))
        sp.append(c)
    comp.mesh(col, root, f"urchins_spines_{n + 1}", comp.merge(*sp), spine_m, parent=p)
    keys += [(p, "scale", 0, 1.0, 1.16), (p, "scale", 1, 1.0, 1.16), (p, "scale", 2, 1.0, 1.16), (p, "rotation_euler", 2, 0.0, math.radians(rnd.uniform(-25, 25)))]
L.channel("bristle", keys)
comp.export(col, root, "kelp", "urchins", made="blender/components/kelp/urchins.py", source="own geometry (purple and red sea urchins)", license="ours", credit="",
            rig={"bristle": "each urchin (urchins_urchin_N) swells by a sixth about its middle and turns up to 25 degrees"})
