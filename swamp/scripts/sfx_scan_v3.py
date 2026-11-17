#!/usr/bin/env python3
"""Print each fetched recording's length, level over time (0.5 s steps, dB) and centroid, with its description.
  sfx_scan_v3.py SRC_DIR [key ...]"""
import json, os, sys
import numpy as np
import soundfile as sf

src = sys.argv[1]
want = set(sys.argv[2:])
for l in open(os.path.join(src, "meta.jsonl")):
    m = json.loads(l)
    if not m["ok"] or (want and m["key"] not in want):
        continue
    x, sr = sf.read(os.path.join(src, m["file"]), always_2d=True)
    mono = x.mean(1)
    h = sr // 2
    lv = [20 * np.log10(np.sqrt(np.mean(mono[i:i + h] ** 2)) + 1e-9) for i in range(0, len(mono) - h, h)]
    S = np.abs(np.fft.rfft(mono[: sr * 20] * np.hanning(len(mono[: sr * 20]))))
    f = np.fft.rfftfreq(len(mono[: sr * 20]), 1 / sr)
    cen = float((S * f).sum() / S.sum())
    print(f"== {m['key']} {m['title'][:70]} | {len(mono)/sr:.1f}s sr={sr} ch={x.shape[1]} peak={20*np.log10(np.abs(x).max()):.1f} centroid={cen:.0f}Hz")
    print("   lv:", " ".join(f"{v:.0f}" for v in lv[:90]))
    print("   desc:", m["desc"][:260])
