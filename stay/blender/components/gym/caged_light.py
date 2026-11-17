# gym/caged-light: a chain-hung fluorescent fitting in a wire guard, 1.16 m long ("caged lights"; Poly Haven's
# caged_hanging_light, CC0). Its origin is the top of its chains, at the roof. Rig: "sway" swings it 7 degrees about
# its hanging point along its length's axis (a ball has hit it); its glow is the scene's ("the lights come up").
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("gym", "caged_light", "caged_hanging_light", res="1k", origin="top")
print("PARTS", {k: ([tuple(round(c, 3) for c in v) for v in comp.box_of(o)], [m.name for m in o.data.materials]) for k, o in parts.items()})
glow = comp.mat("caged_light_glow", (1.0, 0.98, 0.92), rough=0.3, emit=(1.0, 0.96, 0.86), strength=22.0)
tubes = comp.mesh(col, root, "caged_light_tubes", comp.merge(*[comp.cyl(0.017, 1.0, at=(-0.5, y, -0.712), seg=12, axis="X") for y in (-0.055, 0.055)]), glow, smooth=True)
sw = comp.hang(col, root, list(parts.values()) + [tubes], "caged_light_sway", at=(0, 0, 0))
comp.channel("sway", [(sw, "rotation_euler", 0, 0, math.radians(7))])   # its length runs along x: it swings across it
comp.export(col, root, "gym", "caged_light", made="blender/components/gym/caged_light.py",
            source="https://polyhaven.com/a/caged_hanging_light; the two lit tubes are own geometry", license="CC0; tubes ours", credit=credit,
            rig={"sway": "the whole fitting swings 7 degrees on its chains about the hanging point",
                 "glow": "in the scene: the material caged_light_glow (two tubes added under the model's diffuser, inside its guard) and the light under it come up with the lights"})
