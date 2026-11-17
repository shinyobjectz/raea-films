# The opening's rooms (the director, 11-11: "the first 30-40s econds right now is all ofcicie id rather not be there and shift
# into amny other places we can build and center on something liek a door for match cuts"; "brand new scenes of rooms
# and place like the home kitchen"). Six rooms on one plan, so one walk can run through them all: 4.6 m wide, 6.4 m
# deep, 2.7 m high, a door in the middle of the far wall, a window in the right wall. Each room's shell is its own
# components (floor, ceiling, the wall with the door, the door's leaf, a side wall with a window, a plain side wall, the
# wall behind us), in its own floor and its own paint; its furniture is Poly Haven's scanned and modelled pieces
# (CC0), one component each (sidecars carry the source and credit).
#   raea blender run blender/rooms.py                 every room
#   raea blender run blender/rooms.py -- kitchen      one room      (-- kitchen:shell  only its shell)
# Prints "size PLACE NAME w h d" for each piece, which sets/rooms.ts reads from the sidecars to lay the rooms out.
import os, sys, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector

WX, DZ, HT, TH = 4.6, 6.4, 2.7, 0.15
DOOR_W, DOOR_H = 0.95, 2.08
MADE = "blender/rooms.py"

# place: its floor (a Poly Haven texture, tile in m), its walls' paint (a tint over grey plaster), the door's colour,
# and its pieces: (name, asset, how it stands: floor | back (on a wall) | top (from the ceiling), a turn in degrees)
ROOMS = {
    "kitchen": dict(floor=("floor_tiles_06", 1.2), wall=(0.74, 0.79, 0.70), door=(0.85, 0.82, 0.74), pieces=[
        ("cabinet", "painted_wooden_cabinet", "floor", 0), ("cabinet-b", "painted_wooden_cabinet_02", "floor", 0), ("sideboard", "modern_wooden_cabinet", "floor", 0),
        ("stove", "electric_stove", "floor", 0), ("microwave", "vintage_microwave", "floor", 0), ("kettle", "vintage_electric_kettle", "floor", 0),
        ("table", "dining_table", "floor", 0), ("chair", "dining_chair_02", "floor", 0), ("cutting-board", "wooden_cutting_board", "floor", 0),
        ("pot", "brass_pot_01", "floor", 0), ("pan", "brass_pan_01", "floor", 0), ("enamel-pot", "pot_enamel_01", "floor", 0), ("tea-set", "tea_set_01", "floor", 0),
        ("bowl", "wooden_bowl_01", "floor", 0), ("apple", "food_apple_01", "floor", 0), ("lemon", "lemon", "floor", 0), ("bananas", "bananas", "floor", 0),
        ("croissant", "croissant", "floor", 0), ("cake", "carrot_cake", "floor", 0), ("bottles", "wine_bottles_01", "floor", 0), ("jug", "metal_jug", "floor", 0),
        ("lamp", "hanging_industrial_lamp", "top", 0), ("plant", "potted_plant_01", "floor", 0), ("clock", "wall_clock", "back", 0),
    ]),
    "living": dict(floor=("wood_floor", 1.6), wall=(0.86, 0.80, 0.70), door=(0.42, 0.30, 0.22), pieces=[
        ("sofa", "Sofa_01", "floor", 0), ("sofa-b", "sofa_02", "floor", 0), ("armchair", "ArmChair_01", "floor", 0), ("lounge-chair", "mid_century_lounge_chair", "floor", 0),
        ("coffee-table", "CoffeeTable_01", "floor", 0), ("television", "Television_01", "floor", 0), ("console", "ClassicConsole_01", "floor", 0),
        ("bookshelf", "wooden_bookshelf_worn", "floor", 0), ("side-table", "side_table_01", "floor", 0), ("ottoman", "Ottoman_01", "floor", 0),
        ("plant", "potted_plant_04", "floor", 0), ("tree", "pachira_aquatica_01", "floor", 0), ("ceiling-lamp", "modern_ceiling_lamp_01", "top", 0),
        ("frame", "fancy_picture_frame_01", "back", 0), ("frame-b", "hanging_picture_frame_01", "back", 0), ("frame-c", "hanging_picture_frame_02", "back", 0),
        ("books", "decorative_book_set_01", "floor", 0), ("chess", "chess_set", "floor", 0), ("boombox", "boombox", "floor", 0), ("clock", "vintage_grandfather_clock_01", "floor", 0),
    ]),
    "study": dict(floor=("herringbone_parquet", 1.4), wall=(0.24, 0.33, 0.30), door=(0.30, 0.20, 0.14), pieces=[
        ("cabinet", "chinese_cabinet", "floor", 0), ("console", "chinese_console_table", "floor", 0), ("armchair", "chinese_armchair", "floor", 0),
        ("vitrine", "vintage_cabinet_01", "floor", 0), ("drawers", "drawer_cabinet", "floor", 0), ("table", "round_wooden_table_01", "floor", 0),
        ("rocking-chair", "Rockingchair_01", "floor", 0), ("encyclopedia", "book_encyclopedia_set_01", "floor", 0), ("mantel-clock", "mantel_clock_01", "floor", 0),
        ("oil-lamp", "vintage_oil_lamp", "floor", 0), ("mirror", "ornate_mirror_01", "back", 0), ("frame", "standing_picture_frame_01", "floor", 0),
        ("vase", "antique_ceramic_vase_01", "floor", 0), ("brass-vase", "brass_vase_01", "floor", 0), ("chandelier", "lantern_chandelier_01", "top", 0),
        ("ukulele", "Ukulele_01", "floor", 0), ("projector", "filmstrip_projector_8mm", "floor", 0), ("microscope", "industrial_microscope", "floor", 0), ("laptop", "classic_laptop", "floor", 0),
    ]),
    "workshop": dict(floor=("concrete_floor_worn_001", 2.4), wall=(0.62, 0.63, 0.62), door=(0.20, 0.34, 0.40), pieces=[
        ("drill-press", "drill_press_01", "floor", 0), ("vice", "bench_vice_01", "floor", 0), ("tool-cart", "tool_cart", "floor", 0), ("storage-cart", "industrial_storage_cart", "floor", 0),
        ("shelves", "steel_frame_shelves_01", "floor", 0), ("shelves-b", "steel_frame_shelves_02", "floor", 0), ("welding-cart", "portable_welding_cart", "floor", 0),
        ("hand-truck", "hand_truck", "floor", 0), ("stool", "metal_stool_01", "floor", 0), ("propane", "propane_tank", "floor", 0), ("sledgehammer", "sledgehammer_01", "floor", 0),
        ("wrench", "pipe_wrench", "floor", 0), ("crate", "wooden_crate_01", "floor", 0), ("crate-b", "wooden_crate_02", "floor", 0), ("bin", "metal_trash_can", "floor", 0),
        ("generator", "portable_generator", "floor", 0), ("barrel", "Barrel_01", "floor", 0), ("bench", "WoodenTable_02", "floor", 0), ("wall-lamp", "industrial_wall_lamp", "back", 0),
        ("spray-paint", "spray_paint_bottles", "floor", 0),
    ]),
    "greenhouse": dict(floor=("terracotta_floor_tiles", 1.4), wall=(0.90, 0.90, 0.86), door=(0.22, 0.38, 0.28), pieces=[
        ("planter", "planter_box_01", "floor", 0), ("planter-b", "planter_box_02", "floor", 0), ("planter-c", "planter_box_03", "floor", 0), ("tray", "seeding_tray_01", "floor", 0),
        ("plant", "potted_plant_01", "floor", 0), ("plant-b", "potted_plant_02", "floor", 0), ("plant-c", "potted_plant_04", "floor", 0), ("calathea", "calathea_orbifolia_01", "floor", 0),
        ("anthurium", "anthurium_botany_01", "floor", 0), ("tree", "pachira_aquatica_01", "floor", 0), ("fern", "fern_02", "floor", 0),
        ("watering-can", "watering_can_metal_01", "floor", 0), ("gloves", "garden_gloves_01", "floor", 0), ("trowel", "trowel_01", "floor", 0), ("compost", "compost_bags", "floor", 0),
        ("bucket", "wooden_bucket_01", "floor", 0), ("basket", "wicker_basket_01", "floor", 0), ("clay-pot", "planter_pot_clay", "floor", 0), ("gnome", "garden_gnome", "floor", 0),
        ("bench", "painted_wooden_bench", "floor", 0), ("table", "WoodenTable_03", "floor", 0), ("boots", "rubber_boots", "floor", 0), ("hose", "garden_hose_wall_mounted_01", "back", 0),
    ]),
    "dining": dict(floor=("old_wood_floor", 1.6), wall=(0.30, 0.36, 0.42), door=(0.86, 0.83, 0.76), pieces=[
        ("table", "gallinera_table", "floor", 0), ("chair", "gallinera_chair", "floor", 0), ("chair-b", "WoodenChair_01", "floor", 0), ("cabinet", "GothicCabinet_01", "floor", 0),
        ("commode", "GothicCommode_01", "floor", 0), ("chandelier", "lantern_chandelier_01", "top", 0), ("cake", "strawberry_chocolate_cake", "floor", 0), ("goblets", "brass_goblets", "floor", 0),
        ("tea-set", "tea_set_01", "floor", 0), ("plate", "carved_wooden_plate", "floor", 0), ("bottles", "wine_bottles_01", "floor", 0), ("frame", "fancy_picture_frame_02", "back", 0),
        ("mirror", "ornate_mirror_01", "back", 0), ("vase", "antique_ceramic_vase_01", "floor", 0), ("lantern", "brass_diya_lantern", "floor", 0), ("pomegranate", "food_pomegranate_01", "floor", 0),
        ("pears", "food_pears_asian_01", "floor", 0), ("clock", "vintage_grandfather_clock_01", "floor", 0), ("plant", "potted_plant_02", "floor", 0),
    ]),
    "cellar": dict(floor=("brick_floor_003", 1.6), wall=(0.40, 0.36, 0.32), door=(0.24, 0.17, 0.12), pieces=[
        ("barrels", "wooden_barrels_01", "floor", 0), ("barrel", "Barrel_01", "floor", 0), ("crate", "wooden_crate_01", "floor", 0), ("crate-b", "wooden_crate_02", "floor", 0),
        ("bottles", "wine_bottles_01", "floor", 0), ("shelves", "steel_frame_shelves_03", "floor", 0), ("lantern", "Lantern_01", "floor", 0), ("oil-lamp", "vintage_oil_lamp", "floor", 0),
        ("chest", "treasure_chest", "floor", 0), ("cans", "russian_food_cans_01", "floor", 0), ("bucket", "wooden_bucket_02", "floor", 0), ("basket", "wicker_basket_02", "floor", 0),
        ("sweet-potato", "sweet_potato", "floor", 0), ("onion", "yellow_onion", "floor", 0), ("jug", "metal_jug", "floor", 0), ("wooden-lantern", "wooden_lantern_01", "floor", 0),
        ("hand-truck", "hand_truck", "floor", 0), ("gallon", "plastic_bottle_gallon", "floor", 0),
    ]),
    "kidsroom": dict(floor=("wood_floor_worn", 1.6), wall=(0.62, 0.72, 0.80), door=(0.90, 0.88, 0.82), pieces=[
        ("bed", "GothicBed_01", "floor", 0), ("nightstand", "ClassicNightstand_01", "floor", 0), ("nightstand-b", "painted_wooden_nightstand", "floor", 0), ("alarm-clock", "alarm_clock_01", "floor", 0),
        ("desk", "SchoolDesk_01", "floor", 0), ("chair", "SchoolChair_01", "floor", 0), ("drawers", "vintage_wooden_drawer_01", "floor", 0), ("television", "Television_02", "floor", 0),
        ("toy-chest", "treasure_chest", "floor", 0), ("football", "football", "floor", 0), ("bat", "baseball_bat", "floor", 0), ("gamepad", "gamepad", "floor", 0), ("console", "gaming_console", "floor", 0),
        ("duck", "rubber_duck_toy", "floor", 0), ("dartboard", "dartboard", "back", 0), ("boombox", "boombox", "floor", 0), ("frame", "hanging_picture_frame_02", "back", 0),
        ("lamp", "desk_lamp_arm_01", "floor", 0), ("ukulele", "Ukulele_01", "floor", 0), ("books", "book_encyclopedia_set_01", "floor", 0), ("ceiling-lamp", "modern_ceiling_lamp_01", "top", 0),
    ]),
    "hallway": dict(floor=("laminate_floor_02", 1.6), wall=(0.80, 0.72, 0.58), door=(0.34, 0.24, 0.17), pieces=[
        ("side-table", "side_table_tall_01", "floor", 0), ("frame", "hanging_picture_frame_03", "back", 0), ("frame-b", "fancy_picture_frame_02", "back", 0),
        ("sconce", "industrial_caged_sconce", "back", 0), ("plant", "potted_plant_02", "floor", 0), ("stool", "chinese_stool", "floor", 0), ("vase", "ceramic_vase_01", "floor", 0),
    ]),
}


def size_of(col):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in col.all_objects:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    return [round(hi.x - lo.x, 3), round(hi.z - lo.z, 3), round(hi.y - lo.y, 3)]


def done(col, root, place, name, source, license, credit, rig=None):
    bpy.context.view_layer.update()
    print("size", place, name, *size_of(col))
    comp.export(col, root, place, name.replace("-", "_"), made=MADE, source=source, license=license, credit=credit, rig=rig)
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()


def wall_with(opening, W, plaster, skirt, name, col, root):
    """A wall W wide, its outside at y 0 and its face toward -y, with one opening (x0, x1, z0, z1) or none."""
    if opening is None:
        pieces = [comp.box((W, TH, HT), at=(0, -TH / 2, HT / 2))]
    else:
        x0, x1, z0, z1 = opening
        pieces = [comp.box((x0 + W / 2, TH, HT), at=((x0 - W / 2) / 2, -TH / 2, HT / 2)), comp.box((W / 2 - x1, TH, HT), at=((x1 + W / 2) / 2, -TH / 2, HT / 2)),
                  comp.box((x1 - x0, TH, HT - z1), at=((x0 + x1) / 2, -TH / 2, z1 + (HT - z1) / 2))]
        if z0 > 0:
            pieces.append(comp.box((x1 - x0, TH, z0), at=((x0 + x1) / 2, -TH / 2, z0 / 2)))
    w = comp.mesh(col, root, f"{name}_face", comp.merge(*pieces), plaster)
    comp.uv_box(w, 1.0)
    sk = [comp.box((W, 0.014, 0.11), at=(0, -TH - 0.007, 0.055))] if opening is None or opening[2] > 0 else [
        comp.box((opening[0] + W / 2, 0.014, 0.11), at=((opening[0] - W / 2) / 2, -TH - 0.007, 0.055)), comp.box((W / 2 - opening[1], 0.014, 0.11), at=((opening[1] + W / 2) / 2, -TH - 0.007, 0.055))]
    comp.mesh(col, root, f"{name}_skirting", comp.merge(*sk), skirt)


def shell(place, spec):
    tex, tile = spec["floor"]
    lic, cred = "ours; textures CC0", f"Poly Haven ({tex}, painted_plaster_wall)"
    src = f"own geometry; floor: https://polyhaven.com/a/{tex}; plaster: https://polyhaven.com/a/painted_plaster_wall"
    P = lambda: comp.ph_texture(f"{place}_plaster", "painted_plaster_wall", tile=2.4, tint=spec["wall"], grey=True, res="1k")
    SK = lambda: comp.mat(f"{place}_skirting", (0.9, 0.89, 0.85), rough=0.5)
    # the floor
    col, root = comp.fresh("floor")
    f = comp.mesh(col, root, "floor_boards", comp.box((WX + 0.4, DZ + 0.4, 0.05), at=(0, 0, -0.025)), comp.ph_texture(f"{place}_floor", tex, tile=tile, res="2k"))
    comp.uv_box(f, 1.0)
    done(col, root, place, "floor", src, lic, cred)
    # the ceiling: its underside at z 0
    col, root = comp.fresh("ceiling")
    comp.mesh(col, root, "ceiling_slab", comp.box((WX + 0.4, DZ + 0.4, 0.1), at=(0, 0, 0.05)), comp.mat(f"{place}_ceiling", (0.93, 0.92, 0.89), rough=0.9))
    cornice = comp.merge(comp.box((WX, 0.08, 0.08), at=(0, -DZ / 2 + 0.04, -0.04)), comp.box((WX, 0.08, 0.08), at=(0, DZ / 2 - 0.04, -0.04)), comp.box((0.08, DZ, 0.08), at=(-WX / 2 + 0.04, 0, -0.04)), comp.box((0.08, DZ, 0.08), at=(WX / 2 - 0.04, 0, -0.04)))
    comp.mesh(col, root, "ceiling_cornice", cornice, comp.mat(f"{place}_cornice", (0.95, 0.94, 0.91), rough=0.6))
    done(col, root, place, "ceiling", src, lic, cred)
    # the wall with the door: the opening in its middle, the casing round it
    col, root = comp.fresh("wall_door")
    wall_with((-DOOR_W / 2, DOOR_W / 2, 0, DOOR_H), WX, P(), SK(), "wall_door", col, root)
    C = 0.09
    casing = comp.merge(comp.box((C, TH + 0.04, DOOR_H + C), at=(-DOOR_W / 2 - C / 2, -TH / 2, (DOOR_H + C) / 2)), comp.box((C, TH + 0.04, DOOR_H + C), at=(DOOR_W / 2 + C / 2, -TH / 2, (DOOR_H + C) / 2)), comp.box((DOOR_W, TH + 0.04, C), at=(0, -TH / 2, DOOR_H + C / 2)))
    co = comp.mesh(col, root, "wall_door_casing", casing, comp.mat(f"{place}_casing", (0.93, 0.92, 0.88), rough=0.45))
    comp.bevel(co, 0.006, 2)
    done(col, root, place, "wall-door", src, lic, cred)
    # the door's leaf: its hinge at the origin (the opening's left edge), closed along +x; "open" swings it 105 degrees away from the room
    col, root = comp.fresh("door")
    piv = comp.pivot(col, root, "door_leaf_pivot", (0, 0, 0))
    leaf_m = comp.mat(f"{place}_door", spec["door"], rough=0.42)
    LW, LH, LT = DOOR_W - 0.012, DOOR_H - 0.012, 0.042
    panels = [comp.box((LW, LT, LH), at=(LW / 2 + 0.006, 0, LH / 2 + 0.006))]
    lo = comp.mesh(col, root, "door_leaf", comp.merge(*panels), leaf_m, parent=piv)
    comp.bevel(lo, 0.004, 2)
    # four raised panels each face, a brass knob and its rose each side
    for side in (-1, 1):
        for (px, pz, pw, ph) in ((0.25, 1.5, 0.3, 0.86), (0.7, 1.5, 0.3, 0.86), (0.25, 0.52, 0.3, 0.72), (0.7, 0.52, 0.3, 0.72)):
            po = comp.mesh(col, root, f"door_panel_{'ab'[side > 0]}_{int(px * 100)}_{int(pz * 100)}", comp.box((pw, 0.012, ph), at=(px + 0.006, side * (LT / 2 + 0.004), pz)), leaf_m, parent=piv)
            comp.bevel(po, 0.006, 2)
        brass = comp.mat(f"{place}_door_brass", (0.83, 0.66, 0.32), rough=0.25, metal=1.0)
        comp.mesh(col, root, f"door_knob_{'ab'[side > 0]}", comp.merge(comp.cyl(0.028, 0.008, at=(LW - 0.07, side * (LT / 2 + 0.004), 1.02), seg=24, axis="Y"), comp.cyl(0.011, 0.05, at=(LW - 0.07, side * (LT / 2 + 0.03), 1.02), seg=16, axis="Y"), comp.cyl(0.03, 0.03, at=(LW - 0.07, side * (LT / 2 + 0.065), 1.02), seg=24, axis="Y")), brass, parent=piv)
    comp.channel("open", [(piv, "rotation_euler", 2, 0, math.radians(105))])
    done(col, root, place, "door", "own geometry (a four-panel door)", "ours", "", rig={"open": "the leaf swings 105 degrees on its hinge, away from the room"})
    # the side wall with a window: 1.7 m wide, 1.45 m high, its sill at 0.9 m, a third of the way down the room
    col, root = comp.fresh("wall_window")
    OW, OH, SILL, CX = 1.7, 1.45, 0.9, 0.6
    wall_with((CX - OW / 2, CX + OW / 2, SILL, SILL + OH), DZ, P(), SK(), "wall_window", col, root)
    F = 0.055
    fr = comp.merge(
        comp.box((OW, F, F), at=(CX, -0.07, SILL + F / 2)), comp.box((OW, F, F), at=(CX, -0.07, SILL + OH - F / 2)),
        comp.box((F, F, OH), at=(CX - OW / 2 + F / 2, -0.07, SILL + OH / 2)), comp.box((F, F, OH), at=(CX + OW / 2 - F / 2, -0.07, SILL + OH / 2)),
        comp.box((F * 0.8, F, OH), at=(CX, -0.07, SILL + OH / 2)), comp.box((OW, F, F * 0.8), at=(CX, -0.07, SILL + OH * 0.5)))
    fo = comp.mesh(col, root, "wall_window_frame", fr, comp.mat(f"{place}_window_frame", (0.93, 0.92, 0.88), rough=0.4))
    comp.bevel(fo, 0.004, 2)
    comp.mesh(col, root, "wall_window_glass", comp.box((OW - 2 * F, 0.006, OH - 2 * F), at=(CX, -0.07, SILL + OH / 2)), comp.mat(f"{place}_window_glass", (0.8, 0.9, 0.95), rough=0.02, alpha=0.12))
    so = comp.mesh(col, root, "wall_window_sill", comp.box((OW + 0.1, TH + 0.08, 0.035), at=(CX, -TH / 2 - 0.04, SILL - 0.017)), comp.mat(f"{place}_sill", (0.9, 0.89, 0.85), rough=0.5))
    comp.bevel(so, 0.006, 2)
    done(col, root, place, "wall-window", src, lic, cred)
    # the plain side wall, and the wall behind us
    for name, W in (("wall-side", DZ), ("wall-back", WX)):
        col, root = comp.fresh(name.replace("-", "_"))
        wall_with(None, W, P(), SK(), name.replace("-", "_"), col, root)
        done(col, root, place, name, src, lic, cred)


def pieces(place, spec, only=None):
    for name, asset, origin, turn in spec["pieces"]:
        if only and name not in only:
            continue
        try:
            col, root, parts, credit = comp.ph_component(place, name.replace("-", "_"), asset, res="1k", origin=origin, turn=turn)
            done(col, root, place, name, f"https://polyhaven.com/a/{asset}", "CC0", credit)
        except Exception as e:          # one missing asset doesn't stop the room; it is printed and the layout skips it
            print("FAILED", place, name, asset, repr(e)[:200])


argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
want = [a for a in argv if not a.endswith(".py")]
for place, spec in ROOMS.items():
    sel = [w for w in want if w.split(":")[0] == place]
    if want and not sel:
        continue
    part = sel[0].split(":")[1] if sel and ":" in sel[0] else None
    if part in (None, "shell"):
        shell(place, spec)
    if part in (None, "pieces"):
        pieces(place, spec)
    elif part not in ("shell",):
        pieces(place, spec, only=part.split(","))
print("rooms done")
