# kelp/sheephead: a male California sheephead (Semicossyphus pulcher), 60 cm, modelled and painted by hand: a black
# head with a white chin, a brick-red middle and a black tail end; the same build as the garibaldi (fins, eyes, a
# tail on its own joint). Swims toward -x. Rig: "tail" beats the tail; "swim" carries it 0.9 m ahead.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import numpy as np
def paint(u, v, n):
    img = np.zeros(u.shape + (3,))
    img[:] = (0.75, 0.16, 0.1)
    img *= (0.8 + 0.4 * n)[..., None]
    edge = u + 0.03 * np.sin(v * 9) + 0.04 * (n - 0.5)
    img[edge < 0.3] = (0.03, 0.03, 0.035)
    img[edge > 0.66] = (0.03, 0.03, 0.035)
    img[(u < 0.17) & (v < 0.42) & (v > 0.2)] = (0.9, 0.88, 0.82)
    return img
L.fish("sheephead", 0.60, 0.22, 0.09, paint, "own geometry and painting (a California sheephead)", {}, snout=0.55, seed=8)
