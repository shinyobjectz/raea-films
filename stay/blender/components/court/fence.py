# court/fence: a 7.5 m run of chain-link fence, 3.15 m high, from Poly Haven's modular_chainlink_fence kit (CC0) scaled
# 1.25 to a court's height: three 2.5 m bays of galvanised mesh on their rails between four posts. The run is centred
# on the origin along x, its posts' feet on the ground. No rig (the gate is court/fence_gate).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import T, R, S

col, root = comp.fresh("fence")
parts, credit = _lib.kit("modular_chainlink_fence", "2k")
_lib.mask(parts.values())
K = 1.25
bay, post = parts["modular_chainlink_fence_double"], parts["modular_chainlink_fence_post"]
lo, hi = comp.box_of(bay)
plo, phi = comp.box_of(post)
bx, px, py = (lo.x + hi.x) / 2, (plo.x + phi.x) / 2, (plo.y + phi.y) / 2
for i in range(3):
    _lib.put(col, root, bay, f"fence_bay_{i + 1}", T((i - 1) * 2.0 * K, 0, 0) @ S(K) @ T(-bx, 0, 0))
for i in range(4):
    _lib.put(col, root, post, f"fence_post_{i + 1}", T((i - 1.5) * 2.0 * K, 0, 0) @ S(K) @ T(-px, -py, 0))
_lib.kit_done(parts)
comp.export(col, root, "court", "fence", made="blender/components/court/fence.py", source="https://polyhaven.com/a/modular_chainlink_fence (scaled 1.25, three bays and four posts)", license="CC0", credit=credit,
            notes="7.5 m long along x, centred; butt runs end to end (the end posts overlap)")
