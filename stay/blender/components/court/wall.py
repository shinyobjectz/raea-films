# court/wall: the blank side of the building the court backs onto, modelled by hand: 18 m of brick 7.5 m high (Poly
# Haven red_brick_03) on a concrete plinth under a stone coping, three steel-framed windows behind bar guards, with their sills and
# lintels, a steel fire door in its frame with a kick plate and a pull handle, a bulkhead light over it in a wire
# guard (its glass its own material, wall_lamp_glow), a cast downpipe on its brackets to a shoe at the ground, and a
# vent grille. The wall's face is at y 0, the building behind it; the origin is the middle of its foot.
# Rig: "door" opens the fire door 80 degrees outward about its hinges; "on" (the bulkhead's glow) is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rod, rbox, pipe, fillet, sphere, T, R, S, xf

col, root = comp.fresh("wall")
M = _lib.maker(col, root)
brick = comp.ph_texture("wall_brick", "red_brick_03", tile=1.3, res="2k", tint=(0.75, 0.72, 0.72))
conc = comp.ph_texture("wall_concrete", "concrete_floor_worn_001", tile=2.0, res="1k", tint=(0.72, 0.72, 0.74))
steel = comp.mat("wall_door", (0.1, 0.16, 0.2), rough=0.35, metal=0.5)
iron = comp.mat("wall_iron", (0.05, 0.05, 0.055), rough=0.4, metal=0.8)
glow = comp.mat("wall_lamp_glow", (1.0, 0.85, 0.6), rough=0.3, emit=(1.0, 0.72, 0.4), strength=250000.0)
W, H, TH = 18.0, 7.5, 0.5
DX, DW, DH = 5.2, 1.0, 2.1                 # the door's middle, width, height
bm = comp.box((W, TH, H), at=(0, TH / 2, H / 2))
w = M("wall_brick", bm, brick, smooth=False)
comp.uv_box(w, 1.0)
pl = M("wall_plinth", comp.merge(comp.box((W + 0.06, 0.06, 0.55), at=(0, -0.03, 0.275)), comp.box((W + 0.16, TH + 0.16, 0.14), at=(0, TH / 2, H + 0.07))), conc, smooth=False)
comp.bevel(pl, 0.012, 2)
comp.uv_box(pl, 1.0)
glass = comp.mat("wall_glass", (0.03, 0.04, 0.05), rough=0.08, metal=0.9)
for i, x in enumerate((-5.6, -1.8, 2.0)):
    M(f"wall_window_{i + 1}_glass", comp.box((1.3, 0.02, 2.0), at=(x, -0.012, 3.6)), glass, smooth=False)
    bars = [comp.box((0.035, 0.05, 2.0), at=(x + dx, -0.03, 3.6)) for dx in (-0.65, -0.217, 0.217, 0.65)] + [comp.box((1.335, 0.05, 0.035), at=(x, -0.03, 2.6 + j * 0.5)) for j in range(5)]
    bars += [rod((x - 0.62 + k * 0.155, -0.075, 2.62), (x - 0.62 + k * 0.155, -0.075, 4.58), 0.007, seg=5) for k in range(9)] + [comp.box((1.3, 0.012, 0.03), at=(x, -0.075, z)) for z in (2.75, 3.6, 4.45)]
    M(f"wall_window_{i + 1}_bars", comp.merge(*bars), iron, smooth=False)
    tr = M(f"wall_window_{i + 1}_stone", comp.merge(comp.box((1.6, 0.14, 0.1), at=(x, -0.05, 2.53)), comp.box((1.6, 0.1, 0.22), at=(x, -0.04, 4.73))), conc, smooth=False)
    comp.bevel(tr, 0.01, 2)
    comp.uv_box(tr, 1.0)
# the door: its frame fixed, the leaf hung on the left
fr = [comp.box((0.07, 0.1, DH + 0.07), at=(DX + sx * (DW / 2 + 0.035), -0.03, (DH + 0.07) / 2)) for sx in (-1, 1)] + [comp.box((DW + 0.14, 0.1, 0.07), at=(DX, -0.03, DH + 0.035))]
M("wall_door_frame", comp.merge(*fr), iron, smooth=False)
M("wall_door_dark", comp.box((DW, 0.02, DH), at=(DX, 0.03, DH / 2)), comp.mat("wall_door_dark", (0.01, 0.01, 0.012), rough=0.9), smooth=False)
hinge = comp.pivot(col, root, "wall_door_hinge", (DX - DW / 2, -0.06, 0))
leaf = M("wall_door_leaf", comp.box((DW - 0.01, 0.045, DH - 0.01), at=(DX, -0.045, DH / 2)), steel, parent=hinge, smooth=False)
comp.bevel(leaf, 0.004, 2)
fit = [comp.box((DW - 0.06, 0.004, 0.26), at=(DX, -0.07, 0.17)), rbox((0.07, 0.006, 0.26), at=(DX + DW / 2 - 0.1, -0.07, 1.05), r=0.002, seg=1),
       pipe(fillet([(DX + DW / 2 - 0.1, -0.07, 0.96), (DX + DW / 2 - 0.1, -0.12, 0.96), (DX + DW / 2 - 0.1, -0.12, 1.14), (DX + DW / 2 - 0.1, -0.07, 1.14)], 0.02, n=4), 0.009, sides=3)]
fit += [comp.cyl(0.012, 0.11, at=(DX - DW / 2 + 0.004, -0.075, z), seg=10) for z in (0.25, 1.0, 1.75)]
M("wall_door_fittings", comp.merge(*fit), comp.mat("wall_door_steel", (0.6, 0.6, 0.62), rough=0.3, metal=1.0), parent=hinge, smooth=False)
# the bulkhead light over the door
LZ = DH + 0.45
M("wall_lamp_body", comp.merge(rbox((0.2, 0.05, 0.3), at=(DX, -0.025, LZ), r=0.01, seg=2), comp.box((0.03, 0.03, 0.2), at=(DX, -0.015, LZ + 0.24))), iron, smooth=False)
M("wall_lamp_glass", sphere(0.07, at=(DX, -0.07, LZ), seg=20, rings=12, scale=(1.05, 0.75, 1.75)), glow)
cage = [rod((DX + 0.085 * math.cos(a), -0.05, LZ + 0.13 * math.sin(a)), (DX + 0.05 * math.cos(a), -0.135, LZ + 0.08 * math.sin(a)), 0.003, seg=4) for a in (math.pi * 2 * i / 8 for i in range(8))]
cage.append(_lib.torus(0.085, 0.003, seg=20, sides=4, at=(DX, -0.05, LZ), axis="Y"))
for d, k in ((0.045, 0.8), (0.085, 0.6)):
    t = _lib.torus(0.085, 0.003, seg=20, sides=4, axis="Y")
    xf(t, T(DX, -0.05 - d, LZ) @ S(k, 1, k))
    cage.append(t)
M("wall_lamp_guard", comp.merge(*cage), iron)
# the downpipe and the vent
PX = -8.2
dp = [comp.cyl(0.05, H - 0.5, at=(PX, -0.09, 0.28), seg=14), comp.box((0.3, 0.2, 0.22), at=(PX, -0.1, H - 0.2)), rod((PX, -0.09, 0.3), (PX, -0.24, 0.1), 0.05, seg=14)]
dp += [comp.merge(comp.cyl(0.058, 0.05, at=(PX, -0.09, z), seg=14), comp.box((0.2, 0.012, 0.04), at=(PX, -0.03, z + 0.025))) for z in (1.2, 3.0, 4.8, 6.4)]
M("wall_downpipe", comp.merge(*dp), iron)
M("wall_vent", comp.merge(comp.box((0.5, 0.03, 0.35), at=(8.0, -0.015, 2.6)), *[xf(comp.box((0.46, 0.035, 0.008)), T(8.0, -0.035, 2.47 + i * 0.045) @ R(35, "X")) for i in range(7)]), iron, smooth=False)
_lib.channel("door", [(hinge, "rotation_euler", 2, 0, math.radians(-80))])
comp.export(col, root, "court", "wall", made="blender/components/court/wall.py", source="own geometry; Poly Haven textures red_brick_03 and concrete_floor_worn_001", license="CC0", credit="Poly Haven",
            rig={"door": "the fire door opens 80 degrees outward about its hinges", "on": "in the scene: the material wall_lamp_glow's glow (the bulkhead light over the door), a key per state"},
            notes="origin: the middle of the wall's foot; its face at y 0, the building behind")
