# office/chair: a task chair, modelled by hand (no CC0 one fits): a polished five-star base on twin-wheel casters, a
# gas lift in its black shroud, the tilt mechanism and its lever, a charcoal fabric seat and a curved fabric back on a
# spine, and two arms with soft pads. Seat 0.47 m up, 1.06 m to the back's top. Its front faces -y (raea +z).
# Rig: where it is in the office is the Model's position (the cursor drags it); "swivel" turns everything above the
# base one whole turn; "casters" rolls every wheel one whole turn; "recline" tips the back 14 degrees; "height" lifts
# the seat 8 cm on the gas lift.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
from comp import T, R, S, xf
import bmesh
from mathutils import Vector

col, root = comp.fresh("chair")
fabric = comp.ph_texture("chair_fabric", "jersey_melange", tile=0.25, tint=(0.3, 0.32, 0.36), grey=True)
plastic = comp.mat("chair_plastic", (0.018, 0.018, 0.02), rough=0.5)
alu = comp.mat("chair_aluminium", (0.82, 0.82, 0.84), rough=0.22, metal=1.0)
chrome = comp.mat("chair_chrome", (0.9, 0.9, 0.92), rough=0.06, metal=1.0)
rubber = comp.mat("chair_rubber", (0.012, 0.012, 0.013), rough=0.75)

M = lambda name, bm, m, parent=None, smooth=True: comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)

# --- the base: hub, five legs, five casters -------------------------------------------------------------------------
LEG_R, HUB_Z = 0.33, 0.115
hub = M("chair_hub", comp.cyl(0.05, 0.065, at=(0, 0, HUB_Z - 0.035), seg=40), alu)
comp.bevel(hub, 0.006, 3)
casters, wheels = [], []
for i in range(5):
    a = math.radians(90 + i * 72)
    d = Vector((math.cos(a), math.sin(a), 0))
    leg = comp.taper(d * 0.04 + Vector((0, 0, HUB_Z + 0.012)), d * (LEG_R + 0.012) + Vector((0, 0, 0.098)), 0.052, 0.036, 0.05, 0.03)
    lo = M(f"chair_leg_{i + 1}", leg, alu)
    comp.bevel(lo, 0.008, 3, angle=60)
    tip = d * LEG_R
    # the caster: a stem into the leg's tip, a hood over the twin wheels, the wheels on their axle
    cp = comp.pivot(col, root, f"chair_caster_{i + 1}", (tip.x, tip.y, 0.0))
    M(f"chair_caster_{i + 1}_stem", comp.cyl(0.007, 0.03, at=(tip.x, tip.y, 0.062), seg=12), chrome, parent=cp)
    hood = xf(comp.cyl(0.032, 0.05, seg=24, axis="X"), T(-0.025, 0, 0))
    bmesh.ops.bisect_plane(hood, geom=hood.verts[:] + hood.edges[:] + hood.faces[:], plane_co=(0, 0, -0.004), plane_no=(0, 0, -1), clear_outer=True)
    xf(hood, R(math.degrees(a), "Z"))
    xf(hood, T(tip.x - d.x * 0.012, tip.y - d.y * 0.012, 0.03))
    M(f"chair_caster_{i + 1}_hood", hood, plastic, parent=cp)
    wp = comp.pivot(col, root, f"chair_wheel_{i + 1}", (tip.x - d.x * 0.012, tip.y - d.y * 0.012, 0.027), parent=cp)
    wp.rotation_euler[2] = a  # its local x is the axle, so the roll is a turn about x
    comp.bpy.context.view_layer.update()
    wheels.append((wp, a))
    for s in (-1, 1):
        w = comp.cyl(0.027, 0.016, seg=32, axis="X")
        xf(w, T(s * 0.0125 - 0.008, 0, 0))
        xf(w, R(math.degrees(a), "Z"))
        xf(w, T(tip.x - d.x * 0.012, tip.y - d.y * 0.012, 0.027))
        wo = M(f"chair_wheel_{i + 1}_{'ab'[s > 0]}", w, rubber, parent=wp)
        comp.bevel(wo, 0.005, 3, angle=50)
    casters.append(cp)

# --- the gas lift ----------------------------------------------------------------------------------------------------
M("chair_shroud", comp.cyl(0.034, 0.2, at=(0, 0, HUB_Z + 0.02), seg=32, r2=0.03), plastic)

# --- everything that swivels -----------------------------------------------------------------------------------------
upper = comp.pivot(col, root, "chair_upper", (0, 0, 0))
M("chair_piston", comp.cyl(0.0145, 0.16, at=(0, 0, 0.3), seg=24), chrome, parent=upper)
mech = M("chair_mechanism", comp.box((0.21, 0.25, 0.05), at=(0, 0.01, 0.43)), plastic, parent=upper, smooth=False)
comp.bevel(mech, 0.008, 2)
lever = comp.taper((0.1, 0.06, 0.44), (0.2, 0.09, 0.425), 0.022, 0.03, 0.01, 0.01)
M("chair_lever", lever, plastic, parent=upper)

# the seat: a soft cushion on a shell
shell = M("chair_seat_shell", comp.box((0.47, 0.45, 0.025), at=(0, 0.0, 0.462)), plastic, parent=upper, smooth=False)
comp.bevel(shell, 0.01, 3)
seat_bm = comp.box((0.49, 0.47, 0.075), at=(0, -0.005, 0.505))
for v in seat_bm.verts:
    # a waterfall front edge and a slight dish
    if v.co.z > 0.5:
        v.co.z += 0.01 * (1 - (2 * v.co.x / 0.49) ** 2) * 0.5 - (0.018 if v.co.y < -0.2 else 0)
seat = M("chair_seat", seat_bm, fabric, parent=upper, smooth=True)
comp.bevel(seat, 0.028, 4, angle=30)
comp.subsurf(seat, 1)
comp.uv_box(seat, 1.0)

# the back: a spine up from the mechanism, the curved back on it (its own pivot, for recline)
back = comp.pivot(col, root, "chair_back", (0, 0.2, 0.47), parent=upper)
spine = comp.merge(
    comp.taper((0, 0.09, 0.44), (0, 0.235, 0.47), 0.07, 0.06, 0.04, 0.04),
    xf(xf(comp.box((0.06, 0.03, 0.26)), R(-8, "X")), T(0, 0.245, 0.585)),
)
sp = M("chair_spine", spine, plastic, parent=back, smooth=False)
comp.bevel(sp, 0.01, 3, angle=50)
bk = comp.grid(0.46, 0.5, 16, 12)
for v in bk.verts:
    x, z = v.co.x, v.co.z
    v.co.y -= 0.075 * (2 * x / 0.46) ** 2                 # its sides come round the sitter
    v.co.y -= 0.025 * math.exp(-((z + 0.1) / 0.08) ** 2)  # a lumbar bulge low
    v.co.x *= 1 - 0.1 * max(0.0, z / 0.25)         # narrower at the shoulders
xf(bk, R(-10, "X"))
xf(bk, T(0, 0.27, 0.86))
bko = M("chair_back_pad", bk, fabric, parent=back, smooth=True)
comp.solidify(bko, 0.055, 0)
comp.bevel(bko, 0.02, 3, angle=30)
comp.subsurf(bko, 1)
comp.uv_box(bko, 1.0)
bks = comp.grid(0.44, 0.48, 12, 10)
for v in bks.verts:
    x, z = v.co.x, v.co.z
    v.co.y -= 0.075 * (2 * x / 0.46) ** 2 + 0.025 * math.exp(-((z + 0.1) / 0.08) ** 2)
    v.co.x *= 1 - 0.1 * max(0.0, z / 0.25)
xf(bks, R(-10, "X"))
xf(bks, T(0, 0.305, 0.86))
bso = M("chair_back_shell", bks, plastic, parent=back, smooth=True)
comp.solidify(bso, 0.012, 0)
comp.subsurf(bso, 1)

# the arms: a post each side and a pad on it
for s, side in ((-1, "l"), (1, "r")):
    post = comp.merge(
        comp.taper((s * 0.2, 0.05, 0.455), (s * 0.27, 0.05, 0.47), 0.05, 0.05, 0.016, 0.016),
        xf(xf(comp.box((0.045, 0.05, 0.23)), R(-6, "X")), T(s * 0.27, 0.045, 0.57)),
    )
    po = M(f"chair_arm_{side}", post, plastic, parent=upper, smooth=False)
    comp.bevel(po, 0.006, 2, angle=50)
    pad = M(f"chair_armpad_{side}", comp.box((0.085, 0.26, 0.03), at=(s * 0.27, 0.0, 0.695)), plastic, parent=upper)
    comp.bevel(pad, 0.013, 4, angle=30)

# --- the rig ---------------------------------------------------------------------------------------------------------
comp.channel("swivel", [(upper, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("casters", [(wp, "rotation_euler", 0, 0, 2 * math.pi) for wp, a in wheels])
comp.channel("recline", [(back, "rotation_euler", 0, 0, math.radians(-14))])
comp.channel("height", [(upper, "location", 2, 0, 0.08)])
comp.export(col, root, "office", "chair", made="blender/components/office/chair.py",
            source="own geometry (a generic five-star task chair); fabric: https://polyhaven.com/a/jersey_melange",
            license="ours; texture CC0", credit="Poly Haven (jersey_melange)",
            rig={"position": "the Model's own position and turn in the scene (the cursor's drag)",
                 "swivel": "everything above the base, one whole turn about the gas lift",
                 "casters": "every wheel rolls one whole turn on its axle",
                 "recline": "the back tips 14 degrees back about the seat's rear",
                 "height": "the seat rises 8 cm on the gas lift"})
