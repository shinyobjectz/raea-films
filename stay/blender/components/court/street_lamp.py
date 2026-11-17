# court/street-lamp: a street lamp on the pavement beyond the fence, Poly Haven's street_lamp_01 (CC0), 3.9 m. Its bulb
# is renamed street_lamp_glow and lit sodium orange. Rig: "on" is the scene's (the glow, a key per state).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("court", "street_lamp", "street_lamp_01", res="2k")
for o in parts.values():
    for m in o.data.materials:
        if m.name.startswith("street_lamp_01_bulb"):
            m.name = "street_lamp_glow"
            b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            for l in list(b.inputs["Emission Color"].links):
                m.node_tree.links.remove(l)
            b.inputs["Emission Color"].default_value = (1.0, 0.55, 0.18, 1)
            b.inputs["Emission Strength"].default_value = 600000.0
comp.export(col, root, "court", "street_lamp", made="blender/components/court/street_lamp.py", source="https://polyhaven.com/a/street_lamp_01 (its bulb lit)", license="CC0", credit=credit,
            rig={"on": "in the scene: the material street_lamp_glow's glow, a key per state"})
