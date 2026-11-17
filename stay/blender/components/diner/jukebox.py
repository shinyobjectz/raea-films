# diner/jukebox: a 1940s-style arched jukebox, 0.82 m wide and 1.5 m tall, modelled by hand: a walnut-veneer arched
# cabinet on a plinth, two arches of glowing tube round its front (jukebox_glow amber, jukebox_glow_b green), a
# window on the mechanism where a record stands on its spindle with the tone arm against it, a chrome selector strip
# of twelve buttons over a row of title cards, a coin slot, and a gold cloth grille behind five chrome bars and a
# chrome fan. Rig: "record" turns the record one whole turn on its spindle (its label has one white wedge, so the
# turn reads); "arm" swings the tone arm 22 degrees onto the record; the glow is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rod, rbox, pipe, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("jukebox")
M = _lib.maker(col, root)
W, HS, D = 0.82, 1.09, 0.6      # width, height of the straight sides, depth; the arch's radius is W/2
wood = comp.ph_texture("jukebox_wood", "walnut_veneer", tile=0.9, res="1k")
chrome = comp.mat("jukebox_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
glow_a = comp.mat("jukebox_glow", (1.0, 0.55, 0.12), rough=0.3, emit=(1.0, 0.5, 0.1), strength=5.0)
glow_b = comp.mat("jukebox_glow_b", (0.3, 1.0, 0.45), rough=0.3, emit=(0.25, 1.0, 0.4), strength=4.0)
dark = comp.mat("jukebox_mechanism", (0.03, 0.03, 0.035), rough=0.5)
cloth = comp.ph_texture("jukebox_cloth", "hessian_230", tile=0.25, res="1k", tint=(0.9, 0.62, 0.2))
vinyl = comp.mat("jukebox_record", (0.012, 0.012, 0.014), rough=0.22)
card = comp.mat("jukebox_cards", (0.9, 0.87, 0.75), rough=0.5, emit=(0.9, 0.85, 0.7), strength=0.6)
red = comp.mat("jukebox_buttons", (0.6, 0.04, 0.04), rough=0.25)
glass = comp.mat("jukebox_glass", (0.2, 0.22, 0.24), rough=0.03, alpha=0.14)
label = comp.mat("jukebox_label", (0.7, 0.1, 0.08), rough=0.5)
white = comp.mat("jukebox_label_mark", (0.92, 0.9, 0.85), rough=0.5)


def arch(w, hs, inset=0.0, n=24, z0=0.0):
    """The front's outline (x, z): up the left side, over the arch, down the right, inset from the edge."""
    r = w / 2 - inset
    pts = [(-r, z0)] + [(-r * math.cos(math.pi * i / n), hs + r * math.sin(math.pi * i / n)) for i in range(n + 1)] + [(r, z0)]
    return pts


def prism(pts, y0, y1):
    bm = bmesh.new()
    a = [bm.verts.new((x, y0, z)) for x, z in pts]
    b = [bm.verts.new((x, y1, z)) for x, z in pts]
    bm.faces.new(a)
    bm.faces.new(b[::-1])
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((a[i], b[i], b[j], a[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


body = M("jukebox_cabinet", prism(arch(W, HS, z0=0.08), -D / 2 + 0.04, D / 2), wood, smooth=False)
comp.bevel(body, 0.012, 3, angle=50)
comp.uv_box(body, 1.0)
pl = M("jukebox_plinth", rbox((W + 0.05, D + 0.02, 0.09), at=(0, 0.01, 0.045), r=0.012), dark, smooth=False)
# the face: a dark recess the rest sits on, then the two arches of tube
FY = -D / 2 + 0.04
M("jukebox_face", prism(arch(W, HS, inset=0.15, z0=0.14), FY - 0.006, FY + 0.01), dark, smooth=False)
for name, inset, r, m in (("jukebox_tube_outer", 0.045, 0.032, glow_a), ("jukebox_tube_inner", 0.112, 0.026, glow_b)):
    pts = [(x, FY - 0.012, z) for x, z in arch(W, HS, inset=inset, n=32, z0=0.16)]
    M(name, pipe(pts, r, sides=5), m)
caps = []
for inset, r in ((0.045, 0.034), (0.112, 0.028)):
    for sx in (-1, 1):
        caps.append(comp.cyl(r + 0.004, 0.035, at=(sx * (W / 2 - inset), FY - 0.012, 0.135), seg=20))
M("jukebox_tube_caps", comp.merge(*caps), chrome)
M("jukebox_arch_trim", pipe([(x, FY - 0.03, z) for x, z in arch(W, HS, inset=0.079, n=32, z0=0.16)], 0.007, sides=3), chrome)

# the window on the mechanism: the record on its spindle, the tone arm
WZ = 1.12
M("jukebox_window_frame", _lib.torus(0.205, 0.012, seg=48, sides=8, at=(0, FY - 0.012, WZ), axis="Y"), chrome)
M("jukebox_window_back", lathe([(0, 0), (0.2, 0), (0.2, 0.004), (0, 0.004)], seg=48, at=(0, FY - 0.004, WZ), axis="Y"), dark)
rec = comp.pivot(col, root, "jukebox_record", (0, FY - 0.03, WZ))
M("jukebox_record_disc", lathe([(0.004, 0), (0.15, 0), (0.151, 0.001), (0.15, 0.002), (0.004, 0.002)], seg=64, at=(0, FY - 0.031, WZ), axis="Y"), vinyl, parent=rec)
grooves = comp.merge(*[_lib.torus(r, 0.0006, seg=64, sides=4, at=(0, FY - 0.0312, WZ), axis="Y") for r in (0.07, 0.085, 0.1, 0.115, 0.13, 0.142)])
M("jukebox_record_grooves", grooves, comp.mat("jukebox_groove", (0.08, 0.08, 0.09), rough=0.12, metal=0.6), parent=rec)
M("jukebox_record_label", lathe([(0.004, 0), (0.052, 0), (0.052, 0.0008), (0.004, 0.0008)], seg=40, at=(0, FY - 0.0318, WZ), axis="Y"), label, parent=rec)
wedge = bmesh.new()
wv = [wedge.verts.new((0.012 * math.cos(a), FY - 0.0323, WZ + 0.012 * math.sin(a))) for a in (0.3, 0.9)] + [wedge.verts.new((0.048 * math.cos(a), FY - 0.0323, WZ + 0.048 * math.sin(a))) for a in (0.9, 0.75, 0.6, 0.45, 0.3)]
wedge.faces.new(wv)
bmesh.ops.recalc_face_normals(wedge, faces=wedge.faces)
for f in wedge.faces:
    if f.normal.y > 0:
        f.normal_flip()
M("jukebox_record_mark", wedge, white, parent=rec, smooth=False)
M("jukebox_spindle", comp.cyl(0.0035, 0.03, at=(0, FY - 0.045, WZ), seg=12, axis="Y"), chrome)
arm = comp.pivot(col, root, "jukebox_arm", (0.17, FY - 0.04, WZ + 0.1))
M("jukebox_arm_tube", comp.merge(rod((0.17, FY - 0.04, WZ + 0.1), (0.125, FY - 0.04, WZ - 0.06), 0.005), rbox((0.022, 0.014, 0.034), at=(0.122, FY - 0.04, WZ - 0.072), r=0.003),
                                 comp.cyl(0.014, 0.02, at=(0.17, FY - 0.05, WZ + 0.1), seg=16, axis="Y")), chrome, parent=arm)
M("jukebox_window_glass", lathe([(0, 0), (0.2, 0), (0.2, 0.003), (0, 0.003)], seg=48, at=(0, FY - 0.06, WZ), axis="Y"), glass)

# the selector strip, the title cards, the coin slot
M("jukebox_selector", rbox((0.5, 0.05, 0.075), at=(0, FY - 0.02, 0.83), r=0.008), chrome, smooth=False)
M("jukebox_buttons", comp.merge(*[rbox((0.026, 0.02, 0.03), at=(-0.209 + i * 0.038, FY - 0.05, 0.83), r=0.004) for i in range(12)]), red, smooth=False)
M("jukebox_cards", comp.merge(*[comp.box((0.076, 0.004, 0.022), at=(-0.205 + (i % 6) * 0.082, FY - 0.014, 0.755 - (i // 6) * 0.028)) for i in range(12)]), card, smooth=False)
M("jukebox_coin_slot", comp.merge(rbox((0.05, 0.016, 0.09), at=(0.31, FY - 0.004, 0.83), r=0.005), comp.box((0.004, 0.02, 0.03), at=(0.31, FY - 0.006, 0.845))), chrome, smooth=False)
# the grille
g = M("jukebox_grille_cloth", prism([(-0.25, 0.2), (-0.25, 0.66), (-0.21, 0.7), (0.21, 0.7), (0.25, 0.66), (0.25, 0.2)], FY - 0.012, FY - 0.006), cloth, smooth=False)
comp.uv_box(g, 1.0)
bars = [rod((0, FY - 0.03, 0.2), (0.25 * math.sin(math.radians(a)), FY - 0.03, 0.2 + 0.5 * math.cos(math.radians(a))), 0.008) for a in (-32, -16, 0, 16, 32)]
bars.append(_lib.sphere(0.035, at=(0, FY - 0.03, 0.21), seg=20, rings=10, scale=(1, 0.5, 1)))
M("jukebox_grille_bars", comp.merge(*bars), chrome)
M("jukebox_grille_frame", pipe(_lib.fillet([(-0.25, FY - 0.02, 0.2), (-0.25, FY - 0.02, 0.7), (0.25, FY - 0.02, 0.7), (0.25, FY - 0.02, 0.2), (-0.25, FY - 0.02, 0.2)], 0.04), 0.009, sides=3), chrome)

comp.channel("record", [(rec, "rotation_euler", 1, 0, 2 * math.pi)])
comp.channel("arm", [(arm, "rotation_euler", 1, 0, math.radians(-22))])
comp.export(col, root, "diner", "jukebox", made="blender/components/diner/jukebox.py",
            source="own geometry (a generic arched jukebox, no maker's name); wood https://polyhaven.com/a/walnut_veneer, grille cloth https://polyhaven.com/a/hessian_230", license="ours; textures CC0", credit="Poly Haven (walnut_veneer, hessian_230)",
            rig={"record": "the record one whole turn on its spindle, behind the window",
                 "arm": "the tone arm swings 22 degrees in over the record",
                 "glow": "in the scene: the materials jukebox_glow (the outer arch, amber) and jukebox_glow_b (the inner arch, green)"})
