# pool/deck-chair: a white plastic monobloc chair for the deck (Poly Haven's plastic_monobloc_chair_01, CC0). No rig
# (where it stands and how it's turned is the scene's).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
col, root, parts, credit = comp.ph_component("pool", "deck_chair", "plastic_monobloc_chair_01", res="1k", origin="floor")
done(col, root, "deck_chair", source="https://polyhaven.com/a/plastic_monobloc_chair_01", license="CC0", credit=credit, rig={"position": "the Model's own position and turn on the deck"})
