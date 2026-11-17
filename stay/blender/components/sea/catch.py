# sea/catch: the day's gear stacked on the pier's deck, 2.3 m across: two long wooden crates one on the other
# (wooden_crate_02), three plastic fish crates stacked and one beside them (plastic_crate_02), a barrel (Barrel_01)
# and a wooden bucket (wooden_bucket_01), all Poly Haven's, CC0. Its origin is the deck under the stack's middle.
# Rig: "lid" lifts the top wooden crate's lid 55 degrees on its back edge; "handle" swings the bucket's handle over
# 70 degrees.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("catch")
credits = []
def piece(asset, name, m, keep=None):
    p, c = _lib.bring(col, root, asset, name, res="1k", m=m, keep=keep)
    credits.append(f"{c} ({asset})")
    return p
wc = piece("wooden_crate_02", "catch_crate_a", T(-0.45, 0.25, 0) @ R(90, "Z"))
crate_b = _lib.copy_of(col, root, wc["crate"], "catch_crate_b", T(-0.38, 0.22, 0.45) @ R(96, "Z") @ (R(90, "Z").inverted() @ T(0.45, -0.25, 0) @ wc["crate"].matrix_world))
lid_b = _lib.copy_of(col, root, wc["lid"], "catch_crate_b_lid", T(-0.38, 0.22, 0.45) @ R(96, "Z") @ (R(90, "Z").inverted() @ T(0.45, -0.25, 0) @ wc["lid"].matrix_world))
lo, hi = comp.box_of(lid_b)
hinge = comp.pivot(col, root, "catch_lid_hinge", (-0.38, hi.y - 0.03, hi.z - 0.03))
hinge.rotation_euler[2] = math.radians(6)
bpy.context.view_layer.update()
comp.link(col, root, lid_b, parent=hinge)
pc = piece("plastic_crate_02", "catch_fish_crate_1", T(0.55, 0.3, 0) @ R(8, "Z"))["body"]
for i, m in enumerate((T(0.56, 0.31, 0.2) @ R(3, "Z"), T(0.54, 0.29, 0.4) @ R(12, "Z"), T(0.95, -0.35, 0) @ R(70, "Z"))):
    _lib.copy_of(col, root, pc, f"catch_fish_crate_{i + 2}", m @ R(8, "Z").inverted() @ T(-0.55, -0.3, 0) @ pc.matrix_world)
piece("Barrel_01", "catch_barrel", T(-0.05, -0.5, 0) @ R(40, "Z"))
bk = piece("wooden_bucket_01", "catch_bucket", T(0.3, -0.55, 0) @ R(25, "Z"))
h = bk["handle"]
lo, hi = comp.box_of(bk["body"])
hp = comp.pivot(col, root, "catch_bucket_handle", ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z - 0.04))
hp.rotation_euler[2] = math.radians(25)
bpy.context.view_layer.update()
comp.link(col, root, h, parent=hp)
_lib.channel("lid", [(hinge, "rotation_euler", 0, 0.0, math.radians(-55))])
_lib.channel("handle", [(hp, "rotation_euler", 0, 0.0, math.radians(70))])
comp.export(col, root, "sea", "catch", made="blender/components/sea/catch.py", source="https://polyhaven.com/a/wooden_crate_02, /plastic_crate_02, /Barrel_01, /wooden_bucket_01", license="CC0", credit="; ".join(credits),
            rig={"lid": "the top wooden crate's lid opens 55 degrees on its back edge", "handle": "the bucket's handle swings over 70 degrees"})
