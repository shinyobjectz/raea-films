# koi/koi: a kohaku koi, 0.62 m, modelled by hand: a white carp with red patches down its back, in eight overlapping
# body segments on a chain of pivots (so it bends without gaps), a dorsal fin in slices that bend with it, pectoral
# fins on their own pivots, pelvic fins, a forked tail fin, eyes and barbels. Its head faces -y, its belly on z 0;
# in the pond it swims a hand's depth under the water. Rig: "turn" curls it to its left (the shot's "the koi turn");
# "swim" wags the tail from side to side; "fins" folds the pectoral fins back.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

koi("koi", 0.62, "kohaku", 1.0, "a kohaku koi")
