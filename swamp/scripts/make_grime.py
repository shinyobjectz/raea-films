#!/usr/bin/env python3
"""Procedural grime for old plastic: a seamless tile that multiplies a material's colour. Fractal noise makes the
blotchy stains, thin contour lines of the same noise make the tide marks where water stood and dried, fine noise the
mottling and specks. Writes assets/textures/grime.png. Run with a python that has numpy and pillow."""
import os, numpy as np
from PIL import Image
rng = np.random.default_rng(5); N = 1024
def noise(beta, lo=1):
    """periodic fractal noise: white noise shaped 1/f^beta in the frequency domain, so it tiles"""
    f = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    f = np.sqrt(f) * N; amp = np.where(f >= lo, np.maximum(f, 1) ** -beta, 0)
    x = np.fft.ifft2(np.fft.fft2(rng.standard_normal((N, N))) * amp).real
    x = (x - x.mean()) / x.std()
    return 1 / (1 + np.exp(-1.6 * x))  # 0..1, centred on 0.5
big, mid, fine = noise(1.8, 2), noise(1.5, 5), noise(0.9, 30)
stain = np.clip((big - 0.5) * 5, 0, 1)                      # blotches over about half the surface
tide = np.exp(-((mid - 0.5) / 0.012) ** 2) * (0.3 + 0.7 * stain)
speck = np.clip((fine - 0.78) * 9, 0, 1)
dark = np.clip(stain * (0.35 + 0.3 * mid) + tide * 0.55 + speck * 0.5 + 0.12 * fine, 0, 0.85)
clean = np.array([255, 252, 244.0]); dirt = np.array([70, 58, 40.0]); algae = np.array([84, 98, 52.0])
g = np.clip((noise(1.6, 3) - 0.6) * 6, 0, 1) * stain
col = dirt[None, None] * (1 - g[..., None]) + algae[None, None] * g[..., None]
rgb = clean[None, None] * (1 - dark[..., None]) + col * dark[..., None]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../assets/textures/grime.png")
Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(out); print(out)
