# kelp/garibaldi: a garibaldi (Hypsypops rubicundus), the kelp forest's bright orange damselfish, 30 cm, modelled and
# painted by hand: a deep body, dorsal, anal, pelvic and pectoral fins, eyes, and a forked tail on its own joint.
# It swims toward -x, its side to the camera, 0.14 m off the floor it is placed on.
# Rig: "tail" beats the tail from side to side; "swim" carries it 0.45 m ahead.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import numpy as np
def paint(u, v, n):
    img = np.zeros(u.shape + (3,))
    img[:] = (1.0, 0.52, 0.06)
    img *= (0.8 + 0.35 * n)[..., None]
    img[v < 0.3] *= (1.0, 0.9, 0.8)
    return img
L.fish("garibaldi", 0.30, 0.15, 0.055, paint, "own geometry and painting (a garibaldi)", {"glow": "in the scene: the material garibaldi_skin glows a little so it reads in the blue"}, snout=0.46, seed=5)
