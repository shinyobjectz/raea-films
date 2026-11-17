# turbines/cabin: the wind farm's switchgear cabin, modelled by hand: a precast building 6 by 3 m and 2.9 m high on a
# concrete plinth, ribbed steel walls in grey-green, a flat roof with a drip edge, a steel door with a kick plate, a
# lever handle and a hazard plate, louvred vents, a bulkhead lamp, a cable trough to the road, a whip aerial and a
# small dish on the roof, and a rain pipe. Cladding and concrete from Poly Haven texture sets. Rig: "door" opens the
# door 100 degrees outward on its left hinges, showing the dark inside.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe

col, root = comp.fresh("cabin")
clad = comp.ph_texture("cabin_cladding", "box_profile_metal_sheet", tile=2.0, res="1k", grey=True, tint=(0.42, 0.5, 0.45))
conc = comp.ph_texture("cabin_concrete", "concrete_floor_worn_001", tile=3.0, res="1k")
steel = comp.mat("cabin_steel", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
door_m = comp.mat("cabin_door", (0.2, 0.26, 0.24), rough=0.45)
dark = comp.mat("cabin_inside", (0.004, 0.004, 0.004), rough=0.9)
yellow = comp.mat("cabin_hazard", (0.9, 0.7, 0.02), rough=0.5)
black = comp.mat("cabin_black", (0.01, 0.01, 0.012), rough=0.6)
lamp = comp.mat("cabin_lamp", (1.0, 0.95, 0.8), rough=0.3, emit=(1.0, 0.9, 0.7), strength=3000.0)
M = _lib.maker(col, root)
W, D, H, P = 6.0, 3.0, 2.9, 0.2
pl = M("cabin_plinth", comp.box((W + 0.5, D + 0.5, P), at=(0, 0, P / 2)), conc)
comp.bevel(pl, 0.02, 2)
comp.uv_box(pl, 1.0)
wl = M("cabin_walls", comp.box((W, D, H), at=(0, 0, P + H / 2)), clad)
comp.uv_box(wl, 1.0)
rf = M("cabin_roof", comp.merge(comp.box((W + 0.3, D + 0.3, 0.12), at=(0, 0, P + H + 0.06)), comp.box((W + 0.36, D + 0.36, 0.04), at=(0, 0, P + H + 0.13))), steel)
comp.bevel(rf, 0.01, 2)
corner = [comp.box((0.08, 0.08, H), at=(sx * W / 2, sy * D / 2, P + H / 2)) for sx in (-1, 1) for sy in (-1, 1)]
M("cabin_corner_trims", comp.merge(*corner), steel)
DW, DH, DX = 1.0, 2.1, -1.6
M("cabin_doorway", comp.box((DW, 0.02, DH), at=(DX, -D / 2 - 0.005, P + DH / 2)), dark)
M("cabin_door_frame", comp.merge(comp.box((0.07, 0.07, DH + 0.07), at=(DX - DW / 2 - 0.035, -D / 2 - 0.02, P + DH / 2)), comp.box((0.07, 0.07, DH + 0.07), at=(DX + DW / 2 + 0.035, -D / 2 - 0.02, P + DH / 2)),
                                   comp.box((DW + 0.14, 0.07, 0.07), at=(DX, -D / 2 - 0.02, P + DH + 0.035)), comp.box((DW + 0.3, 0.3, 0.03), at=(DX, -D / 2 - 0.16, P + 0.0))), steel)
hinge = comp.pivot(col, root, "cabin_door_hinge", (DX - DW / 2, -D / 2 - 0.04, P))
leaf = M("cabin_door_leaf", comp.box((DW - 0.01, 0.045, DH - 0.01), at=(DX, -D / 2 - 0.04, P + DH / 2)), door_m, parent=hinge)
comp.bevel(leaf, 0.006, 2)
fit = [comp.box((DW - 0.06, 0.004, 0.25), at=(DX, -D / 2 - 0.064, P + 0.16)), comp.box((0.05, 0.02, 0.18), at=(DX + DW / 2 - 0.1, -D / 2 - 0.07, P + 1.02)),
       comp.cyl(0.011, 0.05, at=(DX + DW / 2 - 0.1, -D / 2 - 0.12, P + 1.05), seg=8, axis="Y"), comp.cyl(0.011, 0.13, at=(DX + DW / 2 - 0.22, -D / 2 - 0.115, P + 1.05), seg=8, axis="X")]
fit += [comp.cyl(0.014, 0.12, at=(DX - DW / 2 + 0.0, -D / 2 - 0.066, P + z), seg=8) for z in (0.25, 1.0, 1.75)]
M("cabin_door_fittings", comp.merge(*fit), steel, parent=hinge)
M("cabin_door_hazard", comp.box((0.3, 0.004, 0.3), at=(DX, -D / 2 - 0.065, P + 1.55)), yellow, parent=hinge)
fl = bmesh.new()
fv = [fl.verts.new(p) for p in ((0.03, 0, 0.11), (-0.05, 0, 0.0), (0.0, 0, 0.0), (-0.03, 0, -0.11), (0.05, 0, 0.0), (0.0, 0, 0.0))]
fl.faces.new(fv[:3]); fl.faces.new(fv[3:])
xf(fl, T(DX, -D / 2 - 0.069, P + 1.55))
M("cabin_door_hazard_flash", fl, black, parent=hinge)
vents = []
for vx, vz in ((0.6, 2.2), (2.2, 2.2), (0.6, 0.6), (2.2, 0.6)):
    vents.append(comp.box((0.9, 0.05, 0.55), at=(vx, -D / 2 - 0.02, P + vz)))
    vents += [xf(xf(comp.box((0.84, 0.012, 0.07), at=(0, 0, 0)), R(35, "X")), T(vx, -D / 2 - 0.05, P + vz - 0.22 + i * 0.075)) for i in range(7)]
M("cabin_vents", comp.merge(*vents), steel)
M("cabin_lamp_body", comp.box((0.26, 0.1, 0.14), at=(DX, -D / 2 - 0.05, P + DH + 0.32)), steel)
M("cabin_lamp", comp.box((0.2, 0.04, 0.09), at=(DX, -D / 2 - 0.105, P + DH + 0.31)), lamp)
comp.uv_box(M("cabin_cable_trough", comp.merge(comp.box((0.5, 3.2, 0.12), at=(2.6, -D / 2 - 1.85, 0.04)), *[comp.box((0.52, 0.02, 0.13), at=(2.6, -D / 2 - 0.5 - i * 0.6, 0.045)) for i in range(5)]), conc), 1.0)
roofkit = [comp.cyl(0.012, 2.4, at=(2.5, 1.0, P + H + 0.15), seg=6), comp.cyl(0.04, 0.3, at=(2.5, 1.0, P + H + 0.15), seg=8), comp.cyl(0.03, 0.9, at=(-2.3, 0.9, P + H + 0.15), seg=8)]
dish = lathe([(0.0, 0.0), (0.12, 0.012), (0.24, 0.05), (0.3, 0.085)], seg=24)
xf(dish, R(-80, "X")); xf(dish, T(-2.3, 0.82, P + H + 1.0))
roofkit.append(dish)
M("cabin_aerials", comp.merge(*roofkit), steel, smooth=True)
M("cabin_rain_pipe", comp.merge(comp.tube([(W / 2 + 0.06, D / 2 - 0.2, P + H + 0.02), (W / 2 + 0.1, D / 2 - 0.2, P + H - 0.2), (W / 2 + 0.07, D / 2 - 0.2, P + H - 0.5), (W / 2 + 0.07, D / 2 - 0.2, 0.25), (W / 2 + 0.2, D / 2 - 0.2, 0.1)], 0.04, sides=3)), steel, smooth=True)
comp.channel("door", [(hinge, "rotation_euler", 2, 0, math.radians(-100))])
comp.export(col, root, "turbines", "cabin", made="blender/components/turbines/cabin.py",
            source="own geometry (a generic switchgear cabin); textures: https://polyhaven.com/a/box_profile_metal_sheet, https://polyhaven.com/a/concrete_floor_worn_001",
            license="ours; textures CC0", credit="Poly Haven (box_profile_metal_sheet, concrete_floor_worn_001)",
            rig={"door": "the steel door opens 100 degrees outward on its left hinges (cabin_door_hinge), showing the dark inside", "lamp": "in the scene: the material cabin_lamp (the bulkhead lamp over the door)"})
