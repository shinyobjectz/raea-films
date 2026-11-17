# The Earth's maps for components/earth.tsx, from NASA's masters (all public domain; sources in
# assets/textures/earth/SOURCES.md). Equirectangular, 8192 x 4096, longitude -180 at the left, north at the top.
#
#   /tmp/ivyenv/bin/python -I scripts/earth_maps.py MASTERS_DIR assets/textures/earth
#
# MASTERS_DIR holds day.jpg (Blue Marble NG, July 2004, 21600 x 10800), night.jpg (Black Marble 2016, 13500 x 6750),
# elev.jpg (GEBCO 2008 land elevation, 21600 x 10800) and clouds-8192.tif (Blue Marble clouds, 8192 x 4096).
#
#   earth-day.jpg    the land and sea as they are, cloud-free
#   earth-lights.jpg the city lights alone (what stands warm above Black Marble's blue moonlit land), in their colour
#   earth-data.png   R the land's height, G water (the Blue Marble's flat ocean and lakes), B the clouds
import sys, os
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
W, H = 8192, 4096

day = Image.open(os.path.join(src, "day.jpg")).convert("RGB").resize((W, H), Image.LANCZOS)
day.save(os.path.join(dst, "earth-day.jpg"), quality=95, subsampling=0)
d = np.asarray(day).astype(np.int16)
# water: the flat dark blue the Blue Marble gives open water (2, 5, 20) and its lakes (1, 3, 7)
water = (d[..., 0] < 14) & (d[..., 1] < 16) & (d[..., 2] < 34) & (d[..., 2] >= d[..., 0])
del d, day

elev = np.asarray(Image.open(os.path.join(src, "elev.jpg")).convert("L").resize((W, H), Image.LANCZOS))
clouds = np.asarray(Image.open(os.path.join(src, "clouds-8192.tif")).convert("L"))
assert clouds.shape == (H, W), clouds.shape
data = np.stack([elev, (water * 255).astype(np.uint8), clouds], -1)
Image.fromarray(data).save(os.path.join(dst, "earth-data.png"), optimize=False, compress_level=6)
print("water share", round(float(water.mean()), 3), "clouds mean", round(float(clouds.mean() / 255), 3))
del data, elev, clouds

n = np.asarray(Image.open(os.path.join(src, "night.jpg")).convert("RGB").resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
# lights: red standing above blue (moonlit land, ice and sea are blue, cities warm or white)
L = np.clip((n[..., 0] - 0.72 * n[..., 2] - 0.04) / 0.28, 0, 1)
warm = np.array([1.0, 0.70, 0.40], np.float32)
col = warm[None, None, :] * (1 - L[..., None] ** 2) + np.array([1.0, 0.93, 0.82], np.float32)[None, None, :] * L[..., None] ** 2
lights = (np.clip(L[..., None] * col, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)
Image.fromarray(lights).save(os.path.join(dst, "earth-lights.jpg"), quality=93, subsampling=0)
print("lit share", round(float((L > 0.05).mean()), 4))
