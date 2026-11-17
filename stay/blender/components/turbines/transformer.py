# turbines/transformer: the turbine's pad-mounted transformer kiosk, modelled by hand: a green steel cabinet 2.4 by 1.7
# by 2.0 m on a concrete plinth with cable ducts, double doors with recessed handles, hinges and a padlock, louvred
# vents, a bank of cooling fins on each end, lifting eyes on a sloped roof, an earth strap and a yellow hazard plate
# with a lightning flash. Concrete from a Poly Haven texture set. Rig: "doors" opens both doors 110 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

col, root = comp.fresh("transformer")
green = comp.mat("transformer_green", (0.05, 0.16, 0.09), rough=0.45)
steel = comp.mat("transformer_steel", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
dark = comp.mat("transformer_dark", (0.015, 0.015, 0.017), rough=0.7)
yellow = comp.mat("transformer_hazard", (0.9, 0.7, 0.02), rough=0.5)
copper = comp.mat("transformer_copper", (0.7, 0.35, 0.15), rough=0.35, metal=1.0)
conc = comp.ph_texture("transformer_concrete", "concrete_floor_worn_001", tile=3.0, res="1k")
M = _lib.maker(col, root)
W, D, H, P = 2.4, 1.7, 2.0, 0.25
pl = M("transformer_plinth", comp.merge(comp.box((W + 0.6, D + 0.6, P), at=(0, 0, P / 2)), *[comp.cyl(0.08, 0.3, at=(x, -D / 2 - 0.45, 0.0), seg=12) for x in (-0.6, 0, 0.6)]), conc)
comp.bevel(pl, 0.02, 2)
comp.uv_box(pl, 1.0)
body = M("transformer_cabinet", comp.box((W, D - 0.06, H), at=(0, 0.03, P + H / 2)), green)
comp.bevel(body, 0.015, 2)
roof = bmesh.new()
rv = [roof.verts.new(p) for p in ((-W / 2 - 0.08, -D / 2 - 0.08, 0), (W / 2 + 0.08, -D / 2 - 0.08, 0), (W / 2 + 0.08, D / 2 + 0.08, 0), (-W / 2 - 0.08, D / 2 + 0.08, 0),
                                  (-W / 2 - 0.08, -D / 2 - 0.08, 0.06), (W / 2 + 0.08, -D / 2 - 0.08, 0.06), (W / 2 + 0.08, 0, 0.2), (-W / 2 - 0.08, 0, 0.2), (W / 2 + 0.08, D / 2 + 0.08, 0.06), (-W / 2 - 0.08, D / 2 + 0.08, 0.06))]
for q in ((3, 2, 1, 0), (0, 1, 5, 4), (4, 5, 6, 7), (7, 6, 8, 9), (2, 3, 9, 8), (1, 2, 8, 6, 5), (3, 0, 4, 7, 9)):
    roof.faces.new([rv[i] for i in q])
xf(roof, T(0, 0, P + H))
M("transformer_roof", roof, green)
def eye(x, y, z):
    e = _lib.lathe([(0.05 + 0.014 * math.cos(i * math.pi / 3), 0.014 * math.sin(i * math.pi / 3)) for i in range(7)], seg=12)
    return xf(xf(e, R(90, "X")), T(x, y, z))


M("transformer_lifting_eyes", comp.merge(*[eye(sx * (W / 2 - 0.3), sy * 0.5, P + H + 0.19 - 0.12) for sx in (-1, 1) for sy in (-1, 1)]), steel, smooth=True)
doors = []
for s, name in ((-1, "l"), (1, "r")):
    hp = comp.pivot(col, root, f"transformer_door_{name}", (s * (W / 2 - 0.03), -D / 2, P))
    leaf = comp.merge(comp.box((W / 2 - 0.05, 0.04, H - 0.1), at=(s * (W / 4 - 0.005), -D / 2 - 0.0, P + H / 2)), comp.box((W / 2 - 0.25, 0.012, H - 0.45), at=(s * (W / 4), -D / 2 - 0.024, P + H / 2 + 0.05)))
    lo = M(f"transformer_door_{name}_leaf", leaf, green, parent=hp)
    comp.bevel(lo, 0.008, 2)
    lv = [comp.box((W / 2 - 0.4, 0.03, 0.022), at=(s * W / 4, -D / 2 - 0.03, P + 0.25 + i * 0.045)) for i in range(7)]
    lv += [comp.box((0.04, 0.03, 0.16), at=(s * (W / 2 - 0.03), -D / 2 - 0.03, P + z)) for z in (0.35, H / 2, H - 0.35)]            # hinges
    lv += [comp.box((0.05, 0.02, 0.2), at=(s * 0.12, -D / 2 - 0.03, P + 1.05)), comp.cyl(0.012, 0.05, at=(s * 0.12, -D / 2 - 0.08, P + 1.05), seg=8, axis="Y")]
    M(f"transformer_door_{name}_fittings", comp.merge(*lv), steel, parent=hp)
    doors.append((hp, s))
M("transformer_padlock", comp.merge(comp.box((0.05, 0.025, 0.045), at=(0, -D / 2 - 0.05, P + 0.93)), comp.tube([(-0.015, -D / 2 - 0.05, P + 0.95), (-0.015, -D / 2 - 0.05, P + 0.995), (0.015, -D / 2 - 0.05, P + 0.995), (0.015, -D / 2 - 0.05, P + 0.95)], 0.005, sides=2)), copper)
M("transformer_inside", comp.box((W - 0.12, 0.02, H - 0.14), at=(0, -D / 2 + 0.06, P + H / 2)), dark)
plate = comp.box((0.34, 0.006, 0.34), at=(-W / 4, -D / 2 - 0.034, P + 1.5))
M("transformer_hazard_plate", plate, yellow, parent=doors[0][0])
tri = bmesh.new()
tv = [tri.verts.new(p) for p in ((0.035, 0, 0.12), (-0.055, 0, -0.005), (0.0, 0, -0.005), (-0.035, 0, -0.12), (0.055, 0, 0.005), (0.0, 0, 0.005))]
tri.faces.new(tv[:3]); tri.faces.new(tv[3:])
xf(tri, T(-W / 4, -D / 2 - 0.039, P + 1.5))
M("transformer_hazard_flash", tri, dark, parent=doors[0][0])
fins = []
for s in (-1, 1):
    fins += [comp.box((0.22, 0.012, 1.3), at=(s * (W / 2 + 0.11), -0.55 + i * 0.07, P + 1.0)) for i in range(17)]
    fins += [comp.box((0.05, 1.2, 0.06), at=(s * (W / 2 + 0.03), 0, P + z)) for z in (0.4, 1.6)]
M("transformer_cooling_fins", comp.merge(*fins), green)
M("transformer_back_vents", comp.merge(*[comp.box((W - 0.6, 0.03, 0.025), at=(0, D / 2 + 0.005, P + 1.3 + i * 0.05)) for i in range(9)]), steel)
M("transformer_earth_strap", comp.merge(comp.box((0.04, 0.006, 0.5), at=(W / 2 - 0.2, -D / 2 - 0.004, P + 0.0)), comp.tube([(W / 2 - 0.2, -D / 2 - 0.01, P - 0.2), (W / 2 - 0.2, -D / 2 - 0.4, 0.03), (W / 2 + 0.3, -D / 2 - 0.6, 0.02)], 0.012, sides=2)), copper)
comp.channel("doors", [(hp, "rotation_euler", 2, 0, math.radians(-110 * s) * -1) for hp, s in doors])
comp.export(col, root, "turbines", "transformer", made="blender/components/turbines/transformer.py", source="own geometry (a generic pad-mounted transformer kiosk); concrete: https://polyhaven.com/a/concrete_floor_worn_001",
            license="ours; texture CC0", credit="Poly Haven (concrete_floor_worn_001)",
            rig={"doors": "both front doors open 110 degrees outward on their outer hinges (transformer_door_l, transformer_door_r)"})
