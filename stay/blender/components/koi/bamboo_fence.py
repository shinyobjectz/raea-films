# koi/bamboo-fence: a yotsume-gaki fence panel, modelled by hand: 2.4 m long and 1 m high, three charred cedar
# posts, three horizontal bamboo rails and twelve bamboo pickets set alternately in front of and behind them, every
# culm with its nodes, every crossing tied with black twine. Panels butt end to end along the garden's back. Its
# face toward -y. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("bamboo_fence")
bamboo = comp.mat("fence_bamboo", srgb((0.68, 0.62, 0.34)), rough=0.42)
char = comp.ph_texture("fence_post", "trident_maple_bark", tile=0.6, res="1k", tint=(0.2, 0.17, 0.15), grey=True)
twine = comp.mat("fence_twine", srgb((0.06, 0.05, 0.05)), rough=0.9)
p = M("bamboo_fence_posts", comp.merge(*[comp.merge(comp.cyl(0.05, 1.08, at=(x, 0, 0), seg=16), comp.cyl(0.05, 0.02, at=(x, 0, 1.08), seg=16, r2=0.035)) for x in (-1.2, 0.0, 1.2)]), char, smooth=True)
shade(p, 50)
comp.uv_box(p, 1.0)
RZ = (0.25, 0.55, 0.85)
rails = [xf(culm(2.4, 0.017, nodes=0.31, seg=10), T(-1.2, 0, z) @ R(90, "Y")) for z in RZ]
pickets, knots = [], []
for i in range(12):
    x = -1.1 + i * 0.2
    sy = -1 if i % 2 == 0 else 1
    pickets.append(xf(culm(0.98 + 0.03 * math.sin(i * 2.1), 0.014, nodes=0.27 + 0.02 * math.sin(i), seg=10), T(x, sy * 0.031, 0.0)))
    for z in RZ:
        knots.append(xf(comp.merge(torus(0.02, 0.0035, 12, 5, axis="Y"), xf(torus(0.02, 0.0035, 12, 5, axis="X"), R(0, "X")), comp.cyl(0.002, 0.05, at=(0, sy * 0.036, -0.045), seg=5)), T(x, sy * 0.015, z)))
shade(M("bamboo_fence_rails", comp.merge(*rails), bamboo), 50)
shade(M("bamboo_fence_pickets", comp.merge(*pickets), bamboo), 50)
shade(M("bamboo_fence_knots", comp.merge(*knots), twine), 80)
done(col, root, "bamboo_fence", "own geometry (a generic four-eyed bamboo fence); https://polyhaven.com/a/trident_maple_bark (CC0)", license="CC0", credit="Poly Haven (texture)")
