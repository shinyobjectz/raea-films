# vinyl/stool: the listening station's wooden bar stool, 0.75 m (Poly Haven's bar_chair_round_01, CC0). One mesh;
# no rig (where it stands and how it is turned is the Model's position).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "stool", "bar_chair_round_01", res="1k")
done(col, root, "stool", "https://polyhaven.com/a/bar_chair_round_01", license="CC0", credit=credit)
