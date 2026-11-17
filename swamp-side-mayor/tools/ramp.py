# tools/ramp.py: the grass's colours, root (bottom) to tip (top), four patches side by side (assets/glb/grass-ramp.png).
# The roots match the ground's greens so a clump grows out of it; the tips lighten toward a warm yellow-green.
# run: uv run -q --with pillow --with numpy python tools/ramp.py
import numpy as np
from PIL import Image
hx = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
pairs = [("#3f8f2e", "#97d34e"), ("#469a33", "#a8dc56"), ("#3a8a2c", "#86c946"), ("#4d9f36", "#b7e062")]
H = 256; img = np.zeros((H, 64 * len(pairs), 4))
for k, (r, t) in enumerate(pairs):
    v = np.linspace(1, 0, H)[:, None] ** 1.3   # top row = tip
    img[:, k * 64:(k + 1) * 64, :3] = (hx(r) * (1 - v) + hx(t) * v)[:, None, :] * np.ones((1, 64, 1))
img[..., 3] = 255
Image.fromarray(img.astype(np.uint8)).save("assets/glb/grass-ramp.png"); print("ramp")
