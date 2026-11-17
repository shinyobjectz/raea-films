# tools/cel.py: the goose's cel texture. The supplied skin is a small photo; the reference is flat colour. Each texel
# becomes one of a few flat inks (white feathers, orange bill and feet, the dark of the mouth), smoothed at 4x so the
# edges between them are clean curves, with a drawn eye and nostril. Outside the skin's islands it is filled with the
# nearest ink, so no dark seam shows where islands meet.
# run: uv run -q --with pillow --with numpy --with scipy python tools/cel.py
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
src = np.asarray(Image.open("assets/goose/src/Duck_White__Diffuse.jpg").convert("RGB").resize((2048, 2048), Image.LANCZOS)).astype(float)
r, g, b = src[..., 0], src[..., 1], src[..., 2]; v = src.max(-1)
skin = v > 40
orange = skin & (r > g * 1.22) & (r - b > 55)
dark = orange & (v < 120)          # the mouth's inside, the creases of the feet
cls = np.zeros(src.shape[:2], int); cls[orange] = 1; cls[dark] = 2
# smooth each class's shape, then fill outside the islands with the nearest class
sm = np.stack([ndimage.gaussian_filter((cls == k).astype(float) * skin, 9) for k in range(3)], -1)
cls = sm.argmax(-1)
idx = ndimage.distance_transform_edt(~ndimage.binary_erosion(skin, iterations=6), return_distances=False, return_indices=True)
cls = cls[idx[0], idx[1]]
INK = np.array([[255, 252, 240], [245, 150, 36], [196, 84, 30]], np.uint8)
img = Image.fromarray(INK[cls]); d = ImageDraw.Draw(img); S = 4
# the bill's lighter top (a second orange where the photo was brightest)
top = (cls == 1) & (ndimage.gaussian_filter(v, 12) > 205)
arr = np.asarray(img).copy(); arr[ndimage.binary_opening(top, iterations=4)] = (250, 176, 60); img = Image.fromarray(arr); d = ImageDraw.Draw(img)
ex, ey = 121 * S, 36 * S
d.ellipse([ex - 30, ey - 34, ex + 30, ey + 34], fill=(92, 58, 40)); d.ellipse([ex - 23, ey - 27, ex + 23, ey + 27], fill=(24, 20, 22)); d.ellipse([ex - 12, ey - 20, ex - 2, ey - 9], fill=(255, 255, 255))
nx, ny = 76 * S, 60 * S; d.ellipse([nx - 13, ny - 8, nx + 13, ny + 8], fill=(214, 96, 70))
img.filter(ImageFilter.GaussianBlur(1.2)).save("assets/goose/cel.png"); print("wrote assets/goose/cel.png")
