# koi/deer-scarer: a shishi-odoshi, modelled by hand: a bamboo tube 0.8 m long rocking on an axle between two short
# bamboo uprights lashed with black twine, a feed spout from a taller post trickling water into its mouth (the
# water a part of its own material, scarer_water), the flat stone its tail knocks on, and a rough stone basin with
# pebbles under the mouth. Its mouth faces -y. Rig: "tip" rocks the tube from mouth-up 25 degrees (filling, its
# tail on the knocking stone) to mouth-down 30 degrees (emptying); play it back fast for the knock.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("deer_scarer")
rng = random.Random(14)
bamboo = comp.mat("scarer_bamboo", srgb((0.66, 0.62, 0.32)), rough=0.42)
green = comp.mat("scarer_bamboo_green", srgb((0.42, 0.52, 0.22)), rough=0.42)
twine = comp.mat("scarer_twine", srgb((0.06, 0.05, 0.05)), rough=0.9)
dark = comp.mat("scarer_hollow", (0.01, 0.01, 0.008), rough=0.9)
water = comp.mat("scarer_water", srgb((0.7, 0.86, 0.9)), rough=0.03, alpha=0.5)
rock = comp.ph_texture("scarer_stone", "lichen_rock", tile=0.9, res="1k")
AZ = 0.42
ups = comp.merge(*[xf(culm(0.55, 0.022, nodes=0.2), T(sx * 0.075, 0, 0)) for sx in (-1, 1)])
shade(M("deer_scarer_uprights", ups, green), 50)
shade(M("deer_scarer_axle", comp.cyl(0.007, 0.2, at=(-0.1, 0, AZ), seg=10, axis="X"), bamboo))
shade(M("deer_scarer_lashings", comp.merge(*[torus(0.024, 0.004, 16, 6, at=(sx * 0.075, 0, z)) for sx in (-1, 1) for z in (AZ - 0.03, AZ + 0.03, AZ + 0.04)]), twine), 80)
tip = comp.pivot(col, root, "deer_scarer_tube", (0, 0, AZ))
tube = xf(culm(0.8, 0.036, nodes=0.26, seg=16), T(0, 0.35, AZ) @ R(90, "X"))
shade(M("deer_scarer_tube_culm", tube, bamboo, parent=tip), 50)
M("deer_scarer_tube_hollow", comp.cyl(0.03, 0.002, at=(0, -0.4515, AZ), seg=16, axis="Y"), dark, parent=tip)
tip.rotation_euler[0] = math.radians(-25)
bpy.context.view_layer.update()
MY, MZ = -0.45 * math.cos(math.radians(25)), AZ + 0.45 * math.sin(math.radians(25))
shade(M("deer_scarer_post", xf(culm(1.0, 0.027, nodes=0.24), T(0.3, MY - 0.02, 0)), green), 50)
SZ = MZ + 0.2
shade(M("deer_scarer_spout", xf(culm(0.31, 0.014, nodes=0.18, seg=10), T(0.33, MY - 0.02, SZ + 0.02) @ R(-94, "Y")), bamboo), 50)
shade(M("deer_scarer_spout_lashing", torus(0.03, 0.004, 16, 6, at=(0.3, MY - 0.02, SZ + 0.02)), twine), 80)
shade(M("deer_scarer_stream", comp.tube([(0.022, MY - 0.02, SZ - 0.003), (0.008, MY - 0.02, SZ - 0.03), (0.0, MY - 0.01, MZ + 0.04), (0.0, MY, MZ - 0.012)], 0.005, sides=2), water), 80)
k = M("deer_scarer_knock_stone", stone(rng, (0.4, 0.34, 0.24), at=(0, 0.36, -0.03), rough=0.14, flat=0.5), rock, smooth=True)
comp.uv_box(k, 1.0)
basin = bmesh.new()
bmesh.ops.create_icosphere(basin, subdivisions=3, radius=1.0)
for v in basin.verts:
    v.co *= 1 + noise.noise(v.co * 1.3 + Vector((4, 2, 9))) * 0.16
    if v.co.z > 0.25:
        v.co.z = 0.25 - (0.5 * max(0, 1 - (v.co.x ** 2 + v.co.y ** 2) / 0.5))
    if v.co.z < -0.3:
        v.co.z = -0.3
xf(basin, T(0, -0.52, 0.1) @ S(0.3, 0.27, 0.34))
b = M("deer_scarer_basin", basin, rock, smooth=True)
comp.uv_box(b, 1.0)
M("deer_scarer_basin_water", comp.cyl(0.15, 0.002, at=(0, -0.52, 0.13), seg=24), comp.mat("scarer_basin_water", srgb((0.12, 0.26, 0.24)), rough=0.03, alpha=0.75))
pb = M("deer_scarer_pebbles", comp.merge(*[stone(rng, (rng.uniform(0.04, 0.09), rng.uniform(0.04, 0.07), 0.035), at=(rng.uniform(-0.4, 0.4), rng.uniform(-0.9, -0.3), -0.005), sub=2, rough=0.1, flat=0.6) for _ in range(26)]), rock, smooth=True)
comp.uv_box(pb, 1.0)
channel("tip", [(tip, "rotation_euler", 0, math.radians(-25), math.radians(30))])
done(col, root, "deer_scarer", "own geometry (a generic shishi-odoshi); https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (texture)",
     rig={"tip": "the bamboo tube rocks 55 degrees about its axle, from mouth-up (filling) to mouth-down (emptying)", "water": "in the scene: the material scarer_water (the trickle and the basin's water)"})
