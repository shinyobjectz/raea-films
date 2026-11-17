# The song's voice as numbers for the bill: the harmonic (non-drum) energy between 250 Hz and 3.4 kHz, per film frame,
# as an open amount 0..1 with syllable-rate movement. usage: python3 tools/voice.py SONG.wav OUT.json
import sys, json, numpy as np
from scipy.io import wavfile
from scipy.signal import stft
from scipy.ndimage import median_filter
sr, x = wavfile.read(sys.argv[1]); x = x.astype(np.float64); x = x.mean(axis=1) if x.ndim > 1 else x; x /= np.abs(x).max() or 1
hop = sr // 120; f, t, Z = stft(x, sr, nperseg=2048, noverlap=2048 - hop, boundary=None); S = np.abs(Z)
H = median_filter(S, size=(1, 31)); P = median_filter(S, size=(31, 1)); mask = H ** 2 / (H ** 2 + P ** 2 + 1e-12)   # harmonic over percussive
band = (f >= 250) & (f <= 3400); env = (S * mask)[band].sum(axis=0)
low = (S * mask)[(f >= 40) & (f < 200)].sum(axis=0)
FPS = 30; n = int(len(x) / sr * FPS) + 1; tt = np.arange(n) / FPS
e = np.interp(tt, t + 1024 / sr, env); e = e / np.percentile(e, 98)
slow = np.convolve(e, np.ones(45) / 45, mode="same")            # the phrase's level
fast = np.clip((e - 0.72 * slow) / (0.6 * slow + 0.08), 0, 1)   # what moves faster than the phrase: syllables
gate = np.clip((slow - 0.12) / 0.2, 0, 1)                       # shut when nobody's singing
openv = np.clip(fast * gate, 0, 1); openv = np.convolve(openv, [0.25, 0.5, 0.25], mode="same")
json.dump({"fps": FPS, "open": [round(float(v), 3) for v in openv], "level": [round(float(v), 3) for v in np.clip(slow, 0, 1)]}, open(sys.argv[2], "w"))
print("frames", n, "open mean", openv.mean().round(3), "singing share", (gate > 0.5).mean().round(2))
print("per 2 beats level:", " ".join(f"{slow[int(i * 1.332 * FPS):int((i + 1) * 1.332 * FPS)].mean():.2f}" for i in range(int(len(x) / sr / 1.332))))
