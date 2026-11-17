# observatory/desk-lamp: the chart table's lamp, Poly Haven's desk_lamp_arm_01 (CC0), a sprung-arm clamp lamp, its bulb
# lit warm (desk_lamp_glow). It clamps on a table's edge: the origin is the clamp's foot, 9 cm under the table's top.
# Rig: "on" is the scene's: desk_lamp_glow's glow, a key per state.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "desk_lamp", "desk_lamp_arm_01", res="1k")
for o in parts.values():
    for m in o.data.materials:
        if m.name.endswith("_light") or "_light" in m.name:
            _lib.glow(m, "desk_lamp_glow", (1.0, 0.78, 0.5), 1600000.0)
comp.export(col, root, "observatory", "desk_lamp", made="blender/components/observatory/desk_lamp.py", source="https://polyhaven.com/a/desk_lamp_arm_01 (its bulb lit)", license="CC0", credit=credit,
            rig={"on": "in the scene: the material desk_lamp_glow's glow, a key per state"}, notes="clamps on a table's edge: set its origin 9 cm under the table's top")
