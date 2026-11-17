# v4, 32-end: the stars the camera tilts up to, from NASA's Deep Star Maps 2020 (NASA/Goddard SVS, Ernie Wright; public
# domain; from the Hipparcos-2, Tycho-2 and Gaia DR2 catalogues): a gnomonic patch of the real sky, made to lie on a
# plane square to the tilt's last view (orbit.tsx), so its stars are where a lens would put them.
#   usage: make_starfield.py RAW_F32 OUT.png   (RAW_F32: the 16k EXR decoded by ffmpeg to planar gbrpf32le)
# The view's centre is RA 16.6h, Dec -11 (over Ophiuchus, the Milky Way's dust lanes toward the galactic centre along
# the frame's foot, dark sky above for the logo), turned -25 degrees. The patch runs from 1.0 below the centre to 0.36
# above it and 0.78 either side, in units of the plane's distance (the tilt starts 40 degrees below; the view is +-16
# degrees high, +-27 wide), PX a unit (1.3 times the frame's own density at the centre), its edges fading to black.
# v4's light was the map's own through 1 - exp(-(v - FLOOR) GAIN): the Milky Way bright and the faint stars a grey
# grain over everything. v5 (stars-end-v5.png) shows it as a camera would barely catch it: the map is split into its
# stars (what stands over the map blurred 4 px) and the rest; the rest, blurred, its dark sky's floor (20th percentile)
# taken to black, is the Milky Way's glow at GLOW; each of the NST brightest stars is redrawn as a fine point (a
# Gaussian of PSF px) where the map has its peak, its brightness the peak's over the brightest's times BGAIN, half its
# own colour. Written sRGB.
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter

RA, DEC, ROLL = 16.6, -11.0, -25.0
X0, X1, Y0, Y1 = -0.78, 0.78, -1.0, 0.36
PX = 2450
GLOW, NST, BGAIN, PSF = 1.0, 20000, 3.0, 1.0
W0, H0 = 16384, 8192
m = np.memmap(sys.argv[1], dtype=np.float32, mode="r", shape=(3, H0, W0))
ra, dec, roll = np.radians(RA * 15), np.radians(DEC), np.radians(ROLL)
F = np.array([np.cos(dec) * np.cos(ra), np.cos(dec) * np.sin(ra), np.sin(dec)])
R = np.cross(F, [0, 0, 1.0]); R /= np.linalg.norm(R)
U = np.cross(R, F)
c, s = np.cos(roll), np.sin(roll)
R, U = c * R + s * U, -s * R + c * U
ow, oh = int(round((X1 - X0) * PX)), int(round((Y1 - Y0) * PX))
ow -= ow % 16; oh -= oh % 16
print("texture", ow, "x", oh)

def sample(d):
    a = np.arctan2(d[..., 1], d[..., 0]); b = np.arcsin(np.clip(d[..., 2], -1, 1))
    x = ((0.5 - a / (2 * np.pi)) * W0) % W0; y = np.clip((0.5 - b / np.pi) * H0, 0, H0 - 1.001)
    x0 = np.floor(x).astype(np.int64); y0 = np.floor(y).astype(np.int64); fx = (x - x0).astype(np.float32); fy = (y - y0).astype(np.float32); x1 = (x0 + 1) % W0
    out = []
    for ch in (2, 0, 1):  # r g b from planar g b r
        p = m[ch]
        out.append(p[y0, x0] * (1 - fx) * (1 - fy) + p[y0, x1] * fx * (1 - fy) + p[y0 + 1, x0] * (1 - fx) * fy + p[y0 + 1, x1] * fx * fy)
    return np.stack(out, -1)

def srgb(v):
    return np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)

acc = np.zeros((oh, ow, 3), np.float32)
B = 128
for r0 in range(0, oh, B):
    rows = np.arange(r0, min(oh, r0 + B))
    a = 0
    for sy in (0.25, 0.75):
        for sx in (0.25, 0.75):
            j, i = np.meshgrid(np.arange(ow) + sx, rows + sy)
            x = X0 + j / PX; y = Y1 - i / PX
            d = F[None, None] + x[..., None] * R[None, None] + y[..., None] * U[None, None]
            d /= np.linalg.norm(d, axis=-1, keepdims=True)
            a = a + sample(d) / 4
    acc[rows] = a

blur3 = lambda v, s: np.stack([gaussian_filter(v[..., c], s) for c in range(3)], -1)
stars = np.clip(acc - blur3(acc, 4), 0, None)
glow = blur3(acc - stars, 6)
glow = np.clip(glow - np.percentile(glow.mean(-1), 20), 0, None) * GLOW
L = stars.mean(-1)
ys, xs = np.nonzero((maximum_filter(L, size=5) == L) & (L > 1e-4))
amp = L[ys, xs]
order = np.argsort(-amp)[:NST]
ys, xs, amp = ys[order], xs[order], amp[order]
col = 0.5 + 0.5 * stars[ys, xs] / np.maximum(amp[:, None], 1e-9)
pts = np.zeros_like(acc)
for c in range(3):
    np.add.at(pts[..., c], (ys, xs), BGAIN * amp / amp.max() * col[:, c])
pts = blur3(pts, PSF) * (2 * np.pi * PSF * PSF)
v = glow + 1 - np.exp(-pts)
# the edges fade to black over 0.06 of a unit
j, i = np.meshgrid(np.arange(ow) + 0.5, np.arange(oh) + 0.5)
x = X0 + j / PX; y = Y1 - i / PX
e = np.minimum.reduce([x - X0, X1 - x, y - Y0, Y1 - y]) / 0.06
v *= (np.clip(e, 0, 1) ** 2)[..., None]
img = (np.clip(srgb(v), 0, 1) * 255 + 0.5).astype(np.uint8)
Image.fromarray(img).save(sys.argv[2])
print("stars", len(amp), "mean", img.mean(axis=(0, 1)).round(2), "max", img.max())
