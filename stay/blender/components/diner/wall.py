# diner/wall: a 5.4 m run of the diner's back wall, 3 m tall, modelled by hand: white tile to 1.25 m, a chrome strip, a
# red tile band and a second chrome strip, mint painted plaster above, a black cove base, a stainless pass-through to
# the kitchen (a dark opening with a steel shelf, a ticket rail and two order tickets, and a heat lamp's glow,
# wall_pass_glow) and a round porthole door to the kitchen at the right. Its face at y 0, standing on the floor.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, lathe, T, R, S, xf

col, root = comp.fresh("wall")
M = _lib.maker(col, root)
W, H, TH = 5.4, 3.0, 1.25
tile = comp.ph_texture("wall_tile", "long_white_tiles", tile=1.27, res="2k")
paint = comp.ph_texture("wall_paint", "beige_wall_001", tile=3.0, res="1k", grey=True, tint=(0.62, 0.82, 0.72))
chrome = comp.mat("wall_chrome", (0.86, 0.86, 0.88), rough=0.16, metal=1.0)
steel = comp.mat("wall_steel", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
red = comp.mat("wall_red", (0.33, 0.008, 0.01), rough=0.2)
black = comp.mat("wall_base", (0.02, 0.02, 0.022), rough=0.5)
dark = comp.mat("wall_kitchen", (0.003, 0.003, 0.003), rough=0.9)
glow = comp.mat("wall_pass_glow", (1.0, 0.6, 0.25), rough=0.4, emit=(1.0, 0.5, 0.15), strength=12.0)
paper = comp.mat("wall_tickets", (0.9, 0.9, 0.82), rough=0.7)
t = M("wall_tile", comp.box((W, 0.1, TH), at=(0, 0.05, TH / 2)), tile, smooth=False)
comp.uv_box(t, 1.0)
p = M("wall_paint", comp.box((W, 0.1, H - TH - 0.16), at=(0, 0.05, TH + 0.16 + (H - TH - 0.16) / 2)), paint, smooth=False)
comp.uv_box(p, 1.0)
M("wall_band", comp.box((W, 0.104, 0.16), at=(0, 0.05, TH + 0.08)), red, smooth=False)
M("wall_strips", comp.merge(*[comp.cyl(0.012, W, at=(-W / 2, -0.002, z), seg=10, axis="X") for z in (TH, TH + 0.16)]), chrome)
M("wall_base", comp.box((W, 0.02, 0.12), at=(0, -0.008, 0.06)), black, smooth=False)
# the pass-through
PX, PZ, PW, PH = -0.9, 1.45, 1.5, 0.55
M("wall_pass_opening", comp.box((PW, 0.02, PH), at=(PX, -0.004, PZ + PH / 2)), dark, smooth=False)
fr = [comp.box((PW + 0.1, 0.05, 0.05), at=(PX, -0.02, z)) for z in (PZ - 0.025, PZ + PH + 0.025)] + [comp.box((0.05, 0.05, PH), at=(PX + sx * (PW / 2 + 0.025), -0.02, PZ + PH / 2)) for sx in (-1, 1)]
fr.append(rbox((PW + 0.16, 0.26, 0.03), at=(PX, -0.12, PZ - 0.04), r=0.005))
M("wall_pass_frame", comp.merge(*fr), steel, smooth=False)
M("wall_pass_lamp", comp.merge(*[comp.cyl(0.02, 0.5, at=(PX + x, -0.05, PZ + PH - 0.07), seg=12, axis="X") for x in (-0.6, 0.1)]), glow)
M("wall_ticket_rail", comp.box((PW - 0.1, 0.014, 0.022), at=(PX, -0.05, PZ + PH + 0.062)), chrome, smooth=False)
rnd = random.Random(4)
M("wall_tickets", comp.merge(*[xf(comp.box((0.075, 0.001, 0.16), at=(0, 0, -0.08)), T(PX + x, -0.058, PZ + PH + 0.06) @ R(rnd.uniform(-5, 5), "Y")) for x in (-0.5, -0.38, 0.2)]), paper, smooth=False)
# the kitchen door: a steel swing door with a porthole
DX = 1.85
M("wall_door", rbox((0.9, 0.04, 2.05), at=(DX, -0.012, 1.025), r=0.004), steel, smooth=False)
M("wall_door_frame", comp.merge(comp.box((0.06, 0.05, 2.1), at=(DX - 0.48, -0.02, 1.05)), comp.box((0.06, 0.05, 2.1), at=(DX + 0.48, -0.02, 1.05)), comp.box((1.02, 0.05, 0.06), at=(DX, -0.02, 2.11))), chrome, smooth=False)
M("wall_door_porthole", _lib.torus(0.17, 0.02, seg=40, sides=8, at=(DX, -0.035, 1.55), axis="Y"), chrome)
M("wall_door_glass", lathe([(0, 0), (0.165, 0), (0.165, 0.004), (0, 0.004)], seg=40, at=(DX, -0.037, 1.55), axis="Y"), dark)
M("wall_door_plates", comp.merge(comp.box((0.86, 0.004, 0.28), at=(DX, -0.034, 0.16)), comp.box((0.14, 0.004, 0.36), at=(DX - 0.33, -0.034, 1.1))), chrome, smooth=False)
comp.export(col, root, "diner", "wall", made="blender/components/diner/wall.py",
            source="own geometry; tile https://polyhaven.com/a/long_white_tiles, paint https://polyhaven.com/a/beige_wall_001", license="ours; textures CC0", credit="Poly Haven (long_white_tiles, beige_wall_001)",
            rig={"heat lamp": "in the scene: the material wall_pass_glow (the pass-through's heat lamps)"})
