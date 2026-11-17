#!/usr/bin/env python3
"""Levels of a WAV over the film's sections (frames at 30 fps): RMS and peak dBFS per span, and an optional compare.
  audio_levels_v3.py FILE [--vs OTHER --upto FRAME] [--step FRAMES]"""
import sys
import numpy as np
import soundfile as sf

a = sys.argv[1:]
x, sr = sf.read(a[0], always_2d=True)
fr = lambda f: int(f * sr / 30)
db = lambda v: 20 * np.log10(max(float(v), 1e-9))
if "--vs" in a:
    y, sr2 = sf.read(a[a.index("--vs") + 1], always_2d=True)
    up = fr(float(a[a.index("--upto") + 1]))
    p, q = x[:up].mean(1), y[:up].mean(1)
    g = np.dot(p, q) / np.dot(q, q)
    print(f"compare to frame {a[a.index('--upto') + 1]}: corr {np.corrcoef(p, q)[0,1]:.4f}, gain {db(abs(g)):.2f} dB, residual {db(np.sqrt(np.mean((p - g * q) ** 2)) / np.sqrt(np.mean(p**2)))} dB rel")
step = int(a[a.index("--step") + 1]) if "--step" in a else 0
spans = [(i, i + step) for i in range(0, int(len(x) / sr * 30), step)] if step else [
    (0, 534), (534, 1320), (1320, 1430), (1430, 1520), (1520, 1580), (1580, 1670), (1670, 1736), (1736, 1790),
    (1790, 1850), (1850, 1912), (1912, 1980), (1980, 2045), (2045, 2072), (2072, 2152), (2152, 2165), (2165, 2262),
    (2262, 2325)]
print(f"{a[0]}: {len(x)/sr:.3f} s, {sr} Hz, {x.shape[1]} ch")
for s, e in spans:
    seg = x[fr(s):fr(e)]
    if len(seg) == 0:
        continue
    print(f"  {s:5d}-{e:<5d} rms {db(np.sqrt(np.mean(seg**2))):6.1f}  peak {db(np.abs(seg).max()):6.1f}")
