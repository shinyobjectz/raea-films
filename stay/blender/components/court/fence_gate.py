# court/fence-gate: the court's gate, from Poly Haven's modular_chainlink_fence kit (CC0) scaled 1.25: the door frame
# (two posts, a mesh transom and side lights, 2.4 m wide) with the chain-link leaf hung on its hinge post and the latch
# on the leaf. Centred on the origin along x. Rig: "swing" opens the leaf 105 degrees inward (toward -y, the court)
# about its hinge edge; "rattle" shakes it 4 degrees the other way (the wind, a ball against it).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import T, R, S

col, root = comp.fresh("fence_gate")
parts, credit = _lib.kit("modular_chainlink_fence", "2k")
_lib.mask(parts.values())
K = 1.25
frame, leaf, latch = parts["modular_chainlink_fence_door_frame"], parts["modular_chainlink_fence_door_gate"], parts["modular_chainlink_fence_door_latch"]
lo, hi = comp.box_of(frame)
m = S(K) @ T(-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, 0)
_lib.put(col, root, frame, "fence_gate_frame", m)
llo, lhi = comp.box_of(leaf)
hinge_at = m @ _lib.Vector((llo.x, (llo.y + lhi.y) / 2, 0))
hinge = comp.pivot(col, root, "fence_gate_hinge", hinge_at)
_lib.put(col, root, leaf, "fence_gate_leaf", m, parent=hinge)
_lib.put(col, root, latch, "fence_gate_latch", m, parent=hinge)
_lib.kit_done(parts)
_lib.channel("swing", [(hinge, "rotation_euler", 2, 0, math.radians(-105))])
_lib.channel("rattle", [(hinge, "rotation_euler", 2, 0, math.radians(4))])
comp.export(col, root, "court", "fence_gate", made="blender/components/court/fence_gate.py", source="https://polyhaven.com/a/modular_chainlink_fence (scaled 1.25: the door frame, gate and latch)", license="CC0", credit=credit,
            rig={"swing": "the leaf opens 105 degrees into the court about its hinge edge", "rattle": "the leaf shakes 4 degrees outward against its latch"})
