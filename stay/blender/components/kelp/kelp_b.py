# kelp/kelp-b: a second giant kelp, two stipes 11.2 and 8.6 m long from one holdfast, modelled by hand like kelp-a
# (jointed every 0.62 m, two blades and bladders a joint). Rig: "stand" stands it up from its lean in the current
# (about 64 degrees at the tips, toward +x, a little across).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root = L.kelp("kelp_b", [(0.0, 0.0, 11.2, 18, 64, 14), (0.1, -0.1, 8.6, 14, 60, -6)], "")
comp.export(col, root, "kelp", "kelp_b", made="blender/components/kelp/kelp_b.py", source="own geometry and painting (giant kelp, Macrocystis pyrifera)", license="ours", credit="",
            rig={"stand": "every joint of the two stipes (kelp_b_N_joint_NN) straightens, from leaning down-current (64 degrees at the tips) to standing",
                 "glow": "in the scene: the materials kelp_blade and kelp_bladder"})
