# stairwell/wall-light: a round bulkhead light, 26 cm, modelled by hand: a cast aluminium base with four fixing lugs,
# a ribbed opal glass dome, a guard of four bars and a ring over it, and a length of surface conduit rising from it
# into a junction box. A wall item: its back at y 0, its front toward -y. The lit dome is a part of its own
# (wall_light_glow, the material light_glow) that is nothing at rest, so each floor's lamp can come on by its clip.
# Rig: "on" brings the lit dome from nothing to whole (the lamp comes on; hold it at 1 to keep it lit).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("wall_light")
alu = comp.mat("light_cast", (0.46, 0.47, 0.47), rough=0.5, metal=1.0)
opal = comp.mat("light_opal", (0.72, 0.72, 0.68), rough=0.25)
glow = comp.mat("light_glow", (1.0, 0.86, 0.6), rough=0.3, emit=(1.0, 0.78, 0.45), strength=150000.0)
conduit = comp.mat("light_conduit", (0.62, 0.63, 0.64), rough=0.4, metal=1.0)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
RB, Z = 0.13, 0.0
base = comp.merge(comp.cyl(RB, 0.035, at=(0, -0.035, Z), seg=48, axis="Y"), comp.cyl(RB - 0.012, 0.012, at=(0, -0.047, Z), seg=48, axis="Y"),
                  *[comp.cyl(0.016, 0.02, at=(math.cos(math.radians(45 + 90 * k)) * (RB + 0.006), -0.02, Z + math.sin(math.radians(45 + 90 * k)) * (RB + 0.006)), seg=12, axis="Y") for k in range(4)])
xf(base, comp.Matrix.Identity(4))
b = M("wall_light_base", base, alu, smooth=False)
comp.bevel(b, 0.003, 2)


def dome(r, depth, y0, ribs=0.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=16, radius=1.0)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, -1), clear_outer=True)
    for v in bm.verts:
        a = math.atan2(v.co.y, v.co.x)
        k = 1 + ribs * math.cos(a * 24) * (1 - v.co.z)
        v.co.x *= r * k
        v.co.y *= r * k
        v.co.z *= depth
    xf(bm, R(90, "X"))
    xf(bm, T(0, y0, Z))
    return bm


M("wall_light_dome", dome(RB - 0.02, 0.075, -0.047, ribs=0.012), opal)
g = comp.pivot(col, root, "wall_light_on", (0, -0.047, Z))
M("wall_light_glow", dome(RB - 0.016, 0.08, -0.047, ribs=0.012), glow, parent=g)
guard = [L.torus(RB - 0.012, 0.004, seg=40, sides=6, axis="Y", at=(0, -0.052, Z)), L.torus(0.05, 0.004, seg=24, sides=6, axis="Y", at=(0, -0.133, Z))]
for k in range(4):
    a = math.radians(90 * k)
    c, s = math.cos(a), math.sin(a)
    guard.append(comp.tube([((RB - 0.012) * c, -0.052, Z + (RB - 0.012) * s), ((RB - 0.014) * c, -0.1, Z + (RB - 0.014) * s), (0.085 * c, -0.128, Z + 0.085 * s), (0.05 * c, -0.133, Z + 0.05 * s)], 0.004, res=5, sides=2))
M("wall_light_guard", comp.merge(*guard), alu)
M("wall_light_conduit", comp.merge(comp.cyl(0.01, 0.42, at=(0, -0.014, Z + RB - 0.005), seg=12), comp.cyl(0.013, 0.02, at=(0, -0.014, Z + RB - 0.005), seg=12),
                                   *[xf(comp.box((0.05, 0.004, 0.014), at=(0, -0.002, Z + RB + 0.12 + 0.2 * k)), comp.Matrix.Identity(4)) for k in range(2)]), conduit)
jb = M("wall_light_junction", comp.merge(comp.box((0.075, 0.04, 0.075), at=(0, -0.02, Z + RB + 0.45)), comp.cyl(0.006, 0.004, at=(0.025, -0.044, Z + RB + 0.475), seg=8, axis="Y"), comp.cyl(0.006, 0.004, at=(-0.025, -0.044, Z + RB + 0.425), seg=8, axis="Y")), conduit, smooth=False)
comp.bevel(jb, 0.004, 2)
L.on_clip("on", g)
comp.export(col, root, "stairwell", "wall_light", made="blender/components/stairwell/wall_light.py", source="own geometry (a generic round bulkhead light)", license="ours", credit="",
            rig={"on": "the lit dome (wall_light_glow) goes from nothing to whole: the lamp comes on. Each floor's lamp is its own Model, so they come on floor by floor",
                 "glow": "in the scene: the material light_glow's glow, and a light at the lamp, a key per state"},
            notes="origin: the lamp's centre on the wall")
