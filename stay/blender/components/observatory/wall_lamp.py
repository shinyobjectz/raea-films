# observatory/wall-lamp: a caged bulkhead lamp on the wall, Poly Haven's industrial_wall_lamp (CC0), its glass made
# the observer's red safelight (wall_lamp_glow). Its back at y 0, the origin its middle.
# Rig: "on" is the scene's: wall_lamp_glow's glow, a key per state.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "wall_lamp", "industrial_wall_lamp", res="1k", origin="back")
for o in parts.values():
    for m in o.data.materials:
        if "glass" in m.name:
            _lib.glow(m, "wall_lamp_glow", (1.0, 0.16, 0.06), 380000.0)
comp.export(col, root, "observatory", "wall_lamp", made="blender/components/observatory/wall_lamp.py", source="https://polyhaven.com/a/industrial_wall_lamp (its glass lit red)", license="CC0", credit=credit,
            rig={"on": "in the scene: the material wall_lamp_glow's glow (the red safelight), a key per state"})
