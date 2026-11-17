# sea/life-ring: a life ring on its station for the pier's deck: a timber post 1.75 m tall with a red backboard, a
# galvanised hook, a throw line coiled on a peg (all modelled by hand) and the ring itself, 0.78 m (Poly Haven's
# lifebuoy, CC0, by Hank Kaamura). Its origin is the post's foot on the deck. Rig: "swing" swings the ring 16 degrees
# on its hook (the wind off the sea); "lift" takes the ring 0.35 m up and 0.25 m out off the hook (the cursor's grab).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("life_ring")
M = _lib.maker(col, root)
wood = comp.ph_texture("life_ring_post", "weathered_brown_planks", tile=0.8, res="1k")
red = comp.mat("life_ring_board", (0.55, 0.05, 0.04), rough=0.6)
white = comp.mat("life_ring_trim", (0.85, 0.84, 0.8), rough=0.6)
steel = comp.mat("life_ring_steel", (0.55, 0.56, 0.57), rough=0.4, metal=1.0)
line = comp.mat("life_ring_line", (0.82, 0.62, 0.2), rough=0.9)
post = M("life_ring_post", comp.box((0.11, 0.11, 1.75), at=(0, 0.02, 0.875)), wood)
comp.bevel(post, 0.006, 2); comp.uv_box(post, 1.0)
M("life_ring_cap", comp.merge(comp.box((0.15, 0.15, 0.02), at=(0, 0.02, 1.76)), comp.cyl(0.07, 0.05, at=(0, 0.02, 1.77), seg=4, r2=0.0)), steel)
M("life_ring_foot", comp.merge(comp.box((0.2, 0.2, 0.008), at=(0, 0.02, 0.004)), *[comp.cyl(0.008, 0.012, at=(sx * 0.075, 0.02 + sy * 0.075, 0.008), seg=6) for sx in (-1, 1) for sy in (-1, 1)],
                               comp.box((0.125, 0.125, 0.12), at=(0, 0.02, 0.06))), steel)
bd = M("life_ring_board", comp.box((0.92, 0.022, 0.92), at=(0, -0.047, 1.2)), red)
comp.bevel(bd, 0.004, 2)
M("life_ring_board_trim", comp.merge(comp.box((0.92, 0.004, 0.03), at=(0, -0.06, 1.645)), comp.box((0.92, 0.004, 0.03), at=(0, -0.06, 0.755)), comp.box((0.03, 0.004, 0.92), at=(-0.445, -0.06, 1.2)), comp.box((0.03, 0.004, 0.92), at=(0.445, -0.06, 1.2))), white)
M("life_ring_bolts", comp.merge(*[comp.cyl(0.012, 0.008, at=(0, -0.058, z), seg=6, axis="Y") for z in (0.85, 1.55)]), steel)
HOOK = (0, -0.09, 1.57)
M("life_ring_hook", comp.tube([(0, -0.058, 1.475), (0, -0.1, 1.475), (0, -0.16, 1.46), (0, -0.2, 1.475), (0, -0.2, 1.505)], 0.009, res=6, sides=3), steel, smooth=True)
# the throw line: a coil hung on a peg under the ring
coil = [comp.tube([(0.3 + 0.085 * math.cos(a) * (1 + 0.05 * k), -0.075 - 0.012 * k, 0.93 + 0.13 * math.sin(a) - 0.06) for a in [i * math.pi / 8 for i in range(17)]], 0.007, res=4, sides=2) for k in range(5)]
M("life_ring_line", comp.merge(*coil, comp.tube([(0.3, -0.08, 1.0), (0.2, -0.1, 1.1), (0.1, -0.12, 0.95), (0.02, -0.13, 0.86)], 0.007, res=6, sides=2)), line, smooth=True)
M("life_ring_peg", comp.cyl(0.011, 0.07, at=(0.3, -0.058, 1.0), seg=10, axis="Y"), steel)
# the ring, hung so its inner top rests in the hook
ring, credit = _lib.bring(col, root, "lifebuoy", "life_ring_ring", res="1k")
r = ring["body"]
lo, hi = comp.box_of(r)
inner_top = hi.z - 0.17
r.matrix_world = T(-(lo.x + hi.x) / 2, -0.16 - (lo.y + hi.y) / 2, 1.46 - inner_top) @ r.matrix_world
bpy.context.view_layer.update()
lift = comp.pivot(col, root, "life_ring_lift", (0, -0.16, 1.46))
sw = comp.pivot(col, root, "life_ring_swing", (0, -0.16, 1.46), parent=lift)
comp.link(col, root, r, parent=sw)
_lib.channel("swing", [(sw, "rotation_euler", 1, 0.0, math.radians(16))])
_lib.channel("lift", [(lift, "location", 2, lift.location.z, lift.location.z + 0.35), (lift, "location", 1, lift.location.y, lift.location.y - 0.25)])
comp.export(col, root, "sea", "life_ring", made="blender/components/sea/life_ring.py", source="own geometry (the station); the ring: https://polyhaven.com/a/lifebuoy; post: https://polyhaven.com/a/weathered_brown_planks", license="ours; CC0", credit=credit + " (lifebuoy); Poly Haven (weathered_brown_planks)",
            rig={"swing": "the ring swings 16 degrees to one side about its hook", "lift": "the ring comes 0.35 m up and 0.25 m out, off its hook"})
