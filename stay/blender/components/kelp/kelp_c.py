# kelp/kelp-c: a young giant kelp, one stipe 5.2 m long with three blades a joint (jointed every 0.4 m), modelled by
# hand like kelp-a. Rig: "stand" stands it up from its lean in the current (about 70 degrees at the tip).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root = L.kelp("kelp_c", [(0.0, 0.0, 5.2, 13, 70, -4)], "", turn_blades=3)
comp.export(col, root, "kelp", "kelp_c", made="blender/components/kelp/kelp_c.py", source="own geometry and painting (a young giant kelp)", license="ours", credit="",
            rig={"stand": "every joint of the stipe (kelp_c_1_joint_NN) straightens, from leaning down-current (70 degrees at the tip) to standing",
                 "glow": "in the scene: the materials kelp_blade and kelp_bladder"})
