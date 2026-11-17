# kelp/kelp-bass: a kelp bass (Paralabrax clathratus), 45 cm, modelled and painted by hand: olive-brown above with
# pale blotches along its back and a white belly; the same build as the garibaldi. Swims toward -x.
# Rig: "tail" beats the tail; "swim" carries it 0.68 m ahead.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import numpy as np
def paint(u, v, n):
    img = np.zeros(u.shape + (3,))
    img[:] = (0.3, 0.27, 0.1)
    img *= (0.6 + 0.8 * n)[..., None]
    blot = (np.sin(u * 38 + 3 * n) > 0.55) & (v > 0.55) & (np.sin(v * 30) > -0.2)
    img[blot] = (0.72, 0.7, 0.5)
    belly = np.clip((0.42 - v) / 0.2, 0, 1)[..., None]
    return img * (1 - belly) + np.array((0.85, 0.84, 0.74)) * belly
L.fish("kelp_bass", 0.45, 0.13, 0.065, paint, "own geometry and painting (a kelp bass)", {}, snout=0.62, seed=13)
