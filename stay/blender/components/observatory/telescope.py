# observatory/telescope: a 30 cm refractor on a German equatorial mount, modelled by hand. The head: a flange bolted to
# the pier, two cheek plates, the polar axis housing tipped to latitude 40 with its brass worm wheel, setting circle
# and clock-drive box. On the polar shaft: the declination housing, its setting circle, the counterweight shaft with
# two iron weights and a stop. On the declination shaft: a saddle and two cradle rings holding a 4.2 m cream-enamelled
# tube that widens to a brass objective cell and dew cap (the lens its own material, telescope_lens), brass bands, a
# 1 m finder on two ring brackets, a balance weight on its rod, and at the tail a brass tailpiece, a rack focuser with
# two knobs, the drawtube, a star diagonal and an eyepiece. The origin is the pier's top (1.55 m up); north (the pole)
# is toward -y, the camera, so the slit and the moon are south, +y. At rest the tube is parked on the pole, weights down.
# Rig: "slew" swings it to the moon: 90 degrees about the polar axis and 107 about the declination axis, ending 33
# degrees up, due +y; "ra" and "dec" are those two turns alone; "focus" racks the drawtube out 8 cm; "drive" turns the
# worm wheel and setting circle one whole turn with the polar shaft.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, torus, rod, rbox, sphere, T, R, S, xf, Vector

col, root = comp.fresh("telescope")
M = _lib.maker(col, root)
iron = comp.mat("telescope_mount", (0.07, 0.11, 0.1), rough=0.36, metal=0.7)
enamel = comp.mat("telescope_tube", (0.82, 0.78, 0.66), rough=0.28, metal=0.1)
brass = comp.mat("telescope_brass", (0.78, 0.58, 0.22), rough=0.24, metal=1.0)
steel = comp.mat("telescope_steel", (0.62, 0.63, 0.65), rough=0.25, metal=1.0)
black = comp.mat("telescope_black", (0.015, 0.015, 0.018), rough=0.6)
lens = comp.mat("telescope_lens", (0.18, 0.26, 0.4), rough=0.03, metal=1.0)

LAT = 40
HEAD = Vector((0, 0, 0.62))                       # where the polar axis leaves its housing's middle
P = T(*HEAD) @ R(90 - LAT, "X")                   # the polar frame: z up the polar axis (north, -y), y the declination axis at rest
DZ = 0.32                                         # the declination axis crosses the polar axis this far up it
TY = 0.78                                         # the tube's axis, this far out along the declination axis
cz = lambda r, h, z0, x=0.0, y=0.0, seg=32, r2=None: comp.cyl(r, h, at=(x, y, z0), seg=seg, r2=r2)            # along the polar frame's z
cy = lambda r, h, y0, x=0.0, z=0.0, seg=32, r2=None: comp.cyl(r, h, at=(x, y0, z), seg=seg, r2=r2, axis="Y")  # along its y
pol = lambda *bms: xf(comp.merge(*bms), P)

# the fixed head
M("telescope_flange", comp.merge(comp.cyl(0.31, 0.05, at=(0, 0, 0), seg=40), *[comp.cyl(0.016, 0.014, at=(0.27 * math.cos(a), 0.27 * math.sin(a), 0.05), seg=6) for a in (2 * math.pi * (i + 0.5) / 8 for i in range(8))]), iron, smooth=False)
for sx in (-1, 1):
    bm = bmesh.new()
    vs = [bm.verts.new((sx * 0.185, y, z)) for y, z in ((-0.26, 0.05), (0.56, 0.05), (0.8, 0.1), (0.88, 0.2), (0.0, 0.92), (-0.2, 0.76))]
    f = bm.faces.new(vs)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(sx * 0.035, 0, 0), verts=[e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ck = M(f"telescope_cheek_{'l' if sx < 0 else 'r'}", bm, iron, smooth=False)
    comp.bevel(ck, 0.006, 2)
M("telescope_polar_housing", pol(cz(0.165, 1.08, -0.98), cz(0.185, 0.05, -0.98), cz(0.185, 0.05, 0.05), cz(0.185, 0.04, -0.5),
                                 *[comp.cyl(0.02, 0.4, at=(-0.2, 0, z), seg=10, axis="X") for z in (-0.72, -0.12)]), iron)
M("telescope_drive_box", pol(rbox((0.2, 0.16, 0.26), at=(0.3, -0.02, -0.82), r=0.012, seg=2), comp.cyl(0.03, 0.2, at=(0.2, -0.16, -0.86), seg=12, axis="X"), rbox((0.1, 0.06, 0.1), at=(0.3, -0.12, -0.82), r=0.008, seg=2)), iron, smooth=False)
M("telescope_drive_dial", pol(comp.cyl(0.045, 0.012, at=(0.3, -0.105, -0.76), seg=20, axis="Y")), brass)

# on the polar shaft (turns in right ascension)
ra = _lib.axis_pivot(col, root, "telescope_ra", P, mode="ZYX")
drive = _lib.axis_pivot(col, root, "telescope_drive", P @ T(0, 0, -1.0), mode="ZYX", parent=ra)
teeth = [xf(comp.box((0.018, 0.012, 0.03)), R(a, "Z") @ T(0.3, 0, -1.035)) for a in range(0, 360, 5)]
M("telescope_worm_wheel", pol(cz(0.295, 0.03, -1.05, seg=72), cz(0.09, 0.07, -1.07), *teeth, comp.box((0.5, 0.03, 0.012), at=(0, 0, -1.02)), xf(comp.box((0.5, 0.03, 0.012), at=(0, 0, -1.02)), R(60, "Z")), xf(comp.box((0.5, 0.03, 0.012), at=(0, 0, -1.02)), R(120, "Z"))), brass, parent=drive, smooth=False)
ticks = [xf(comp.box((0.02 if a % 15 else 0.035, 0.003, 0.002)), R(a, "Z") @ T(0.2, 0, -1.119)) for a in range(0, 360, 3)]
M("telescope_ra_circle", pol(cz(0.225, 0.012, -1.118, seg=72), cz(0.05, 0.05, -1.15)), steel, parent=drive)
M("telescope_ra_ticks", pol(*ticks), black, parent=drive, smooth=False)
M("telescope_polar_shaft", pol(cz(0.12, 0.2, 0.1), cz(0.15, 0.14, DZ - 0.07), cy(0.135, 0.98, -0.44, z=DZ), cy(0.155, 0.05, -0.44, z=DZ), cy(0.155, 0.05, 0.49, z=DZ), cy(0.155, 0.04, 0.02, z=DZ)), iron, parent=ra)
dticks = [xf(comp.box((0.02 if a % 15 else 0.035, 0.003, 0.002)), R(a, "Z") @ T(0.17, 0, 0)) for a in range(0, 360, 3)]
M("telescope_dec_circle", pol(cy(0.195, 0.012, -0.47, z=DZ, seg=72)), steel, parent=ra)
M("telescope_dec_ticks", pol(xf(comp.merge(*dticks), T(0, -0.471, DZ) @ R(90, "X"))), black, parent=ra, smooth=False)
M("telescope_weight_shaft", pol(cy(0.03, 1.15, -1.6, z=DZ, seg=16), cy(0.05, 0.03, -1.62, z=DZ, seg=16)), steel, parent=ra)
M("telescope_weights", pol(*[comp.merge(cy(0.17, 0.1, y0, z=DZ, seg=40), cy(0.175, 0.02, y0 + 0.04, z=DZ, seg=40), comp.cyl(0.012, 0.06, at=(0.165, y0 + 0.05, DZ), seg=8, axis="X")) for y0 in (-1.2, -1.36)]), iron, parent=ra)

# on the declination shaft: the tube and all it carries
dec = _lib.axis_pivot(col, root, "telescope_dec", P @ T(0, 0.52, DZ), mode="YZX", parent=ra)
ZB, ZF = DZ - 1.9, DZ + 2.3                        # the tube's tail and its front
M("telescope_saddle", pol(rbox((0.26, 0.07, 0.86), at=(0, 0.555, DZ), r=0.01, seg=2), *[rbox((0.3, 0.1, 0.06), at=(0, 0.6, DZ + dz), r=0.008, seg=2) for dz in (-0.36, 0.36)]), iron, parent=dec, smooth=False)
M("telescope_cradle_rings", pol(*[torus(0.195, 0.022, seg=48, sides=8, at=(0, TY, DZ + dz)) for dz in (-0.36, 0.36)], *[comp.cyl(0.012, 0.05, at=(sx * 0.215, TY, DZ + dz), seg=8, axis="Y") for sx in (-1, 1) for dz in (-0.36, 0.36)]), brass, parent=dec)
tube = [(0.118, ZB), (0.125, ZB + 0.04), (0.168, ZB + 1.1), (0.176, ZF - 0.42), (0.176, ZF - 0.36)]
M("telescope_tube", pol(lathe(tube, seg=56, at=(0, TY, 0))), enamel, parent=dec)
cell = [(0.176, ZF - 0.42), (0.186, ZF - 0.41), (0.186, ZF - 0.36), (0.198, ZF - 0.35), (0.198, ZF - 0.3), (0.19, ZF - 0.29), (0.19, ZF), (0.182, ZF), (0.182, ZF - 0.3), (0.165, ZF - 0.31)]
M("telescope_cell", pol(lathe(cell, seg=56, at=(0, TY, 0))), brass, parent=dec)
M("telescope_dew_cap_lining", pol(lathe([(0.1815, ZF - 0.002), (0.1815, ZF - 0.3)], seg=56, at=(0, TY, 0))), black, parent=dec)
M("telescope_lens", pol(lathe([(0.0, ZF - 0.296), (0.09, ZF - 0.3), (0.166, ZF - 0.312)], seg=56, at=(0, TY, 0))), lens, parent=dec)
M("telescope_bands", pol(*[lathe([(rr, z), (rr + 0.006, z + 0.004), (rr + 0.006, z + 0.03), (rr, z + 0.034)], seg=56, at=(0, TY, 0)) for rr, z in ((0.137, ZB + 0.3), (0.158, ZB + 0.85), (0.1735, DZ + 1.05), (0.176, DZ + 1.7))]), brass, parent=dec)
tail = [(0.118, ZB), (0.126, ZB - 0.01), (0.126, ZB - 0.05), (0.075, ZB - 0.12), (0.062, ZB - 0.13), (0.062, ZB - 0.27), (0.066, ZB - 0.275), (0.066, ZB - 0.29), (0.05, ZB - 0.29)]
M("telescope_tailpiece", pol(lathe(tail, seg=40, at=(0, TY, 0)), comp.cyl(0.012, 0.22, at=(-0.11, TY + 0.055, ZB - 0.2), seg=10, axis="X"), rbox((0.06, 0.03, 0.09), at=(0, TY + 0.065, ZB - 0.2), r=0.006, seg=2)), brass, parent=dec)
M("telescope_focus_knobs", pol(*[comp.merge(comp.cyl(0.032, 0.022, at=(sx * 0.11 - (0.022 if sx < 0 else 0), TY + 0.055, ZB - 0.2), seg=24, axis="X")) for sx in (-1, 1)]), black, parent=dec)
# the finder, the balance rod
FX, FY = 0.17, TY + 0.2
M("telescope_finder", pol(lathe([(0.03, ZB + 0.25), (0.034, ZB + 0.27), (0.036, ZB + 1.2), (0.044, ZB + 1.21), (0.044, ZB + 1.33), (0.04, ZB + 1.33)], seg=24, at=(FX, FY, 0))), enamel, parent=dec)
M("telescope_finder_fittings", pol(lathe([(0.03, ZB + 0.25), (0.022, ZB + 0.23), (0.022, ZB + 0.17), (0.026, ZB + 0.165), (0.026, ZB + 0.15), (0.015, ZB + 0.15)], seg=20, at=(FX, FY, 0)),
                                   *[comp.merge(torus(0.052, 0.008, seg=28, sides=6, at=(FX, FY, z)), rod((FX * 0.55, TY + 0.125, z), (FX * 0.82, FY - 0.045, z), 0.012, seg=8),
                                                *[rod((FX + 0.052 * math.cos(a), FY + 0.052 * math.sin(a), z), (FX + 0.034 * math.cos(a), FY + 0.034 * math.sin(a), z), 0.004, seg=6) for a in (0.5, 2.6, 4.7)]) for z in (ZB + 0.42, ZB + 1.08)]), brass, parent=dec)
M("telescope_balance", pol(comp.cyl(0.008, 1.5, at=(-0.2, TY + 0.02, ZB + 0.5), seg=8), comp.cyl(0.04, 0.09, at=(-0.2, TY + 0.02, ZB + 1.3), seg=20),
                           *[rod((-0.2, TY + 0.02, z), (-0.158, TY + 0.012, z), 0.008, seg=6) for z in (ZB + 0.5, ZB + 2.0)]), brass, parent=dec)
# the drawtube, diagonal and eyepiece rack out along the tube
foc = comp.pivot(col, root, "telescope_focus", P @ Vector((0, TY, ZB - 0.29)), parent=dec)
M("telescope_drawtube", pol(lathe([(0.05, ZB - 0.13), (0.05, ZB - 0.42), (0.056, ZB - 0.42), (0.056, ZB - 0.44)], seg=32, at=(0, TY, 0))), steel, parent=foc)
M("telescope_diagonal", pol(rbox((0.1, 0.1, 0.1), at=(0, TY, ZB - 0.49), r=0.012, seg=2)), black, parent=foc, smooth=False)
M("telescope_eyepiece", pol(xf(lathe([(0.034, 0.0), (0.034, 0.02), (0.026, 0.03), (0.026, 0.09), (0.03, 0.095), (0.03, 0.14), (0.024, 0.15), (0.012, 0.146)], seg=24), T(0, TY + 0.05, ZB - 0.49) @ R(-90, "X"))), brass, parent=foc)
rad = math.radians
out = (P.to_3x3() @ Vector((0, 0, -0.08)))
_lib.channel("ra", [(ra, "rotation_euler", 2, 0, rad(90))])
_lib.channel("dec", [(dec, "rotation_euler", 1, 0, rad(107))])
_lib.channel("slew", [(ra, "rotation_euler", 2, 0, rad(90)), (dec, "rotation_euler", 1, 0, rad(107))])
_lib.channel("focus", [(foc, "location", i, foc.location[i], foc.location[i] + out[i]) for i in (1, 2)])
_lib.channel("drive", [(drive, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "observatory", "telescope", made="blender/components/observatory/telescope.py", source="own geometry (a generic 12-inch refractor on a German equatorial mount)", license="ours", credit="",
            rig={"slew": "the tube swings from the pole to the moon: 90 degrees about the polar axis and 107 about the declination axis, ending 33 degrees up, due south (Blender +y, raea -z)",
                 "ra": "90 degrees about the polar axis alone", "dec": "107 degrees about the declination axis alone", "focus": "the drawtube, diagonal and eyepiece rack out 8 cm",
                 "drive": "the worm wheel and hour circle one whole turn on the polar shaft"},
            notes="origin: the pier's top (set it 1.55 m up on observatory/pier). latitude 40: the polar axis rises 40 degrees toward -y (raea +z). the tube is 4.2 m, 30 cm aperture")
