#!/usr/bin/env python3
"""Key the flat magenta item media out of each captured app state, un-mixing what lies over it: a translucent panel,
a shadow, a lasso's fill or an anti-aliased edge over magenta keeps its own colour at its own opacity, so the film's
picture shows through it the way the real picture would. (scripts/key_states.sh's hard key left those purple.)

  /tmp/ivyenv/bin/python -I scripts/key_states.py      (writes assets/app-take/keyed/*.png; key_states.sh writes media.json)

A pixel c over magenta M = (255, 0, 255) at opacity a is c = a*f + (1-a)*M. For a neutral f the magenta cast
k = ((R+B)/2 - G)/255 is 1-a, so a = 1-k and f = (c - (1-a)M)/a. Only pixels whose red and blue match (a magenta
cast, not a blue or pink of the UI's own) are un-mixed; the rest stay opaque.
"""
import glob, os
import numpy as np
from PIL import Image

PROJ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
TAKE = os.path.join(PROJ, "assets", "app-take")
M = np.array([255.0, 0.0, 255.0])

for fn in sorted(glob.glob(os.path.join(TAKE, "states", "*.png"))):
    c = np.asarray(Image.open(fn).convert("RGB")).astype(np.float64)
    R, G, B = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip(((R + B) / 2 - G) / 255.0, 0, 1)
    cast = (np.abs(R - B) < 40) & (k > 0.04)
    a = np.where(cast, 1 - k, 1.0)
    a = np.where(a < 0.06, 0.0, a)  # flat magenta (and its encoder noise) goes
    safe = np.maximum(a, 1e-3)[..., None]
    f = np.clip((c - (1 - a)[..., None] * M) / safe, 0, 255)
    out = np.dstack([np.where(cast[..., None], f, c), a * 255]).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(TAKE, "keyed", os.path.basename(fn)))
    print(os.path.basename(fn), flush=True)
