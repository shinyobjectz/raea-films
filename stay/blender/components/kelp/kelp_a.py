# kelp/kelp-a: a full-grown giant kelp (Macrocystis pyrifera), modelled by hand: a holdfast of haptera and three
# stipes 12.4, 11.6 and 10 m long, each jointed every 0.65 m and carrying at every joint two wrinkled golden blades on
# their gas bladders, with a scimitar blade at the tip. Built standing; at rest it lies over in the current.
# Rig: "stand" stands every stipe up from its lean (about 58 degrees at the tips, toward +x) until it wavers upright
# (the current slows, the kelp stands). The blades and bladders are kelp_blade and kelp_bladder (they glow a little,
# as the sun through them).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root = L.kelp("kelp_a", [(0.0, 0.0, 12.4, 19, 58, 0), (0.12, 0.1, 11.6, 18, 62, 8), (-0.1, 0.08, 10.0, 16, 54, -10)], "")
comp.export(col, root, "kelp", "kelp_a", made="blender/components/kelp/kelp_a.py", source="own geometry and painting (giant kelp, Macrocystis pyrifera)", license="ours", credit="",
            rig={"stand": "every joint of the three stipes (kelp_a_N_joint_NN) straightens, from leaning down-current (+x; 58 degrees at the tips) to standing",
                 "glow": "in the scene: the materials kelp_blade and kelp_bladder (the sun through them)"},
            notes="12 m of water over it: its tips reach the surface when it stands.")
