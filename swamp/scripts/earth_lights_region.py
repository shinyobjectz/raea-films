# The Gulf of Mexico's city lights at 0.6 km, from Black Marble 2016's 500 m tiles A1 (180W-90W) and B1 (90W-0), both
# 0-90N, 21600 x 21600 (NASA Earth Observatory, public domain; sources in assets/textures/earth/SOURCES.md), for the
# shots that look down on it from low orbit; the global map (earth-lights.jpg) is 5 km a texel.
#
#   /tmp/ivyenv/bin/python -I scripts/earth_lights_region.py A1.jpg B1.jpg assets/textures/earth
#
# Writes earth-lights-gulf.jpg: longitude LON0..LON1 across, latitude LAT1 (top) .. LAT0, PPD texels a degree, the
# lights alone as in earth_maps.py (what stands warm above the blue moonlit land, in its own colour).
import sys, os
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
a1, b1, dst = sys.argv[1], sys.argv[2], sys.argv[3]
LON0, LON1, LAT0, LAT1, PPD = -120, -76, 12, 46, 180
S = 240  # the tiles' texels a degree
y0, y1 = (90 - LAT1) * S, (90 - LAT0) * S
left = Image.open(a1).crop(((LON0 + 180) * S, y0, 90 * S, y1))
right = Image.open(b1).crop((0, y0, (LON1 + 90) * S, y1))
whole = Image.new("RGB", (left.width + right.width, y1 - y0))
whole.paste(left, (0, 0))
whole.paste(right, (left.width, 0))
del left, right
W, H = (LON1 - LON0) * PPD, (LAT1 - LAT0) * PPD
n = np.asarray(whole.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
del whole
L = np.clip((n[..., 0] - 0.72 * n[..., 2] - 0.04) / 0.28, 0, 1)
warm = np.array([1.0, 0.70, 0.40], np.float32)
col = warm[None, None, :] * (1 - L[..., None] ** 2) + np.array([1.0, 0.93, 0.82], np.float32)[None, None, :] * L[..., None] ** 2
lights = (np.clip(L[..., None] * col, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)
Image.fromarray(lights).save(os.path.join(dst, "earth-lights-gulf.jpg"), quality=93, subsampling=0)
print("size", W, H, "bounds", LON0, LON1, LAT0, LAT1, "lit share", round(float((L > 0.05).mean()), 4))
