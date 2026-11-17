# sea/pier-lamp: a cast-iron lamp post, 3.9 m, for the pier's deck (Poly Haven's street_lamp_01, CC0, by Josh Dean).
# Its bulb is its own material (pier_lamp_glow), lit warm. Rig: "on" is the scene's: pier_lamp_glow's glow.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root, parts, credit = comp.ph_component("sea", "pier_lamp", "street_lamp_01", res="1k")
for o in parts.values():
    for i, m in enumerate(o.data.materials):
        if m and "bulb" in m.name:
            m.name = "pier_lamp_glow"
            b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            for l in list(b.inputs["Emission Color"].links):
                m.node_tree.links.remove(l)
            b.inputs["Emission Color"].default_value = (1.0, 0.62, 0.28, 1)
            b.inputs["Emission Strength"].default_value = 12000.0
comp.export(col, root, "sea", "pier_lamp", made="blender/components/sea/pier_lamp.py", source="https://polyhaven.com/a/street_lamp_01", license="CC0", credit=credit,
            rig={"on": "in the scene: the material pier_lamp_glow's glow (12,000 lit, 0 dark), a key per state"})
