# The copier's insides as the end card's glass catches them (the director, 11-12: "some kind of 3d scanner object ... just a
# reflection on the pane faintly behind the light beam as if we can see behind us in the glass at the machine").
# A scan carriage (its bar, a reflector round the lamp, the lamp's own light), the half-speed mirror carriage behind
# it, the rails and belts it rides, and the chassis floor with its ribs, screws and a ribbon cable, seen square from
# the glass. Only the lamp lights it, so the machine shows where the lamp is and falls to black away from it. The tube
# itself is hidden from the camera: the card's pass draws the beam. tools/card-copy.sh lays the frames faintly over
# the card, the carriage on the beam: frame k is the card's COPY.at + k/30 s, the lamp at
#   x = ((k/30)/sweep*1.3 - 0.15) * W   (pixels from the left, as card-copy.sh's P).
#   raea blender run blender/copier-under.py out/v3/copier-under [sweep=1.0] [frames=33]
import bpy, sys, math, os

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
sweep = float(argv[1]) if len(argv) > 1 else 1.0
frames = int(argv[2]) if len(argv) > 2 else 33
W, H = 13.5, 10.8                       # the frame in metres-ish: 100 px a unit
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 48
sc.cycles.use_denoising = True
try:
    sc.cycles.device = "GPU"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices: d.use = True
except Exception as e:
    print("cpu render:", e)
sc.render.resolution_x, sc.render.resolution_y = 1350, 1080
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "BW"
sc.view_settings.view_transform = "AgX"
world = bpy.data.worlds.new("dark"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs[1].default_value = 0.0
sc.world = world

def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m

steel = mat("steel", (0.55, 0.56, 0.58), 1.0, 0.32)
alu = mat("alu", (0.8, 0.8, 0.8), 1.0, 0.18)
black = mat("black", (0.025, 0.025, 0.027), 0.0, 0.6)
grey = mat("grey", (0.09, 0.09, 0.095), 0.2, 0.45)
belt = mat("belt", (0.015, 0.015, 0.015), 0.0, 0.85)
ribbon = mat("ribbon", (0.5, 0.5, 0.48), 0.0, 0.5)
mirror = mat("mirror", (0.9, 0.9, 0.9), 1.0, 0.04)
tube = mat("tube", (1, 1, 1), 0.0, 0.3, (0.85, 1.0, 0.91), 40.0)

def box(name, loc, size, m, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("bevel", "BEVEL"); bev.width = min(size) * 0.12; bev.segments = 2
    o.data.materials.append(m)
    if parent: o.parent = parent
    return o

def rod(name, loc, r, length, axis, m, parent=None):
    rot = (0, math.pi / 2, 0) if axis == "x" else (math.pi / 2, 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=loc, rotation=rot, vertices=32)
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    if parent: o.parent = parent
    return o

# the chassis: a floor under it all, ribs across it, screws along the ribs, a ribbon cable folding back to the carriage
box("floor", (0, 0, -3.0), (W * 1.6, H * 1.3, 0.1), grey)
for i in range(-6, 7):
    x = i * 1.25
    box(f"rib{i}", (x, 0, -2.85), (0.12, H * 1.1, 0.22), black)
    for y in (-4.2, -1.4, 1.4, 4.2):
        rod(f"screw{i}{y}", (x + 0.32, y, -2.92), 0.07, 0.06, "z", steel).rotation_euler = (0, 0, 0)
box("plate-a", (-3.1, 2.6, -2.7), (2.4, 1.6, 0.06), steel)
box("plate-b", (4.4, -2.9, -2.7), (1.8, 2.2, 0.06), steel)
for j in range(5):
    box(f"vent{j}", (4.4, -3.7 + j * 0.4, -2.66), (1.4, 0.12, 0.04), black)

# rails along the travel, top and bottom of frame; a toothed belt inside each
for s in (-1, 1):
    rod(f"rail{s}", (0, s * 5.65, -1.25), 0.11, W * 1.6, "x", steel)
    box(f"belt{s}", (0, s * 5.2, -1.45), (W * 1.6, 0.12, 0.05), belt)
    for k in range(-40, 41):
        box(f"tooth{s}{k}", (k * 0.25, s * 5.2, -1.41), (0.05, 0.12, 0.04), belt)
rib = box("ribbon", (0, -4.85, -2.2), (W * 1.2, 0.9, 0.02), ribbon)

# the scan carriage: a bar the height of the frame, the reflector round the lamp, the tube, the lamp's light down
car = bpy.data.objects.new("carriage", None); sc.collection.objects.link(car)
box("bar", (0.35, 0, -1.05), (0.42, H * 1.08, 0.26), black, car)
box("bar-lip", (-0.3, 0, -0.95), (0.08, H * 1.08, 0.18), steel, car)
for s in (-1, 1):
    box(f"shoe{s}", (0.1, s * 5.65, -1.25), (0.7, 0.45, 0.32), steel, car)
    box(f"clamp{s}", (0.1, s * 5.2, -1.38), (0.3, 0.25, 0.12), alu, car)
bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=H * 1.05, location=(0, 0, -0.75), rotation=(math.pi / 2, 0, 0), vertices=48)
refl = bpy.context.object; refl.name = "reflector"; refl.data.materials.append(alu); refl.parent = car
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
for v in refl.data.vertices: v.select = v.co.z > 0.02 or v.co.x > 0.05     # keep the trough under and behind the tube
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
refl.modifiers.new("solid", "SOLIDIFY").thickness = 0.02
t = rod("tube", (0, 0, -0.75), 0.06, H * 1.0, "y", tube, car)
t.visible_camera = False
for k in range(4):
    bpy.ops.object.light_add(type="AREA", location=(0, -4.5 + k * 3, -0.82))
    L = bpy.context.object; L.data.shape = "RECTANGLE"; L.data.size = 0.12; L.data.size_y = 3.0
    L.data.energy = 900; L.data.color = (0.85, 1.0, 0.91); L.parent = car
    L.rotation_euler = (0, 0, 0); L.rotation_euler.x = math.pi    # facing down into the machine
for k in range(4):
    bpy.ops.object.light_add(type="POINT", location=(0.15, -4.5 + k * 3, -0.9))
    p = bpy.context.object; p.data.energy = 120; p.data.shadow_soft_size = 0.1; p.data.color = (0.85, 1.0, 0.91); p.parent = car

# the mirror carriage, at half the scan carriage's speed (the optics' 2:1), an angled mirror strip on a frame
mc = bpy.data.objects.new("mirrors", None); sc.collection.objects.link(mc)
box("m-frame", (0, 0, -1.7), (0.7, H * 1.04, 0.3), black, mc)
m = box("m-glass", (0, 0, -1.5), (0.5, H * 1.0, 0.03), mirror, mc); m.rotation_euler.y = math.radians(45)
for s in (-1, 1): box(f"m-shoe{s}", (0, s * 5.65, -1.55), (0.6, 0.4, 0.28), steel, mc)

# the camera square to the glass, the frame's width across
cam = bpy.data.cameras.new("cam"); cam.type = "ORTHO"; cam.ortho_scale = W
co = bpy.data.objects.new("cam", cam); co.location = (0, 0, 6); sc.collection.objects.link(co); sc.camera = co

for k in range(frames):
    px = ((k / 30) / sweep * 1.3 - 0.15) * 1350            # card-copy.sh's P
    x = px / 100 - W / 2
    car.location.x = x
    mc.location.x = (x - W / 2 - 1.0) / 2                    # starts off the left edge, follows at half speed
    sc.render.filepath = os.path.join(out, f"{k:04d}.png")
    bpy.ops.render.render(write_still=True)
    print("frame", k, "x", round(x, 2))
