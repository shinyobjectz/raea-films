#!/usr/bin/env python3
"""The sounds that end on the arrival (T.arrive, 1890: the cut into the white), each cut to exactly its span in the
film and faded out over its last 0.12 s with a half-cosine, sample-accurate, so nothing stops dead at the cut.

raea's own fadeOut can't do this over so short a fade: it steps the gain once a frame and leaves 1/(fade * fps) of the
sound for the mixer's 5 ms edge, so a 0.12 s fadeOut still drops the last 28% of it in 5 ms (raea check: "stops dead
in 10 ms"). Writes assets/audio/v5/fx/{ship-drone,strike,port-rush}-into-white.wav from v3's takes.

  /tmp/ivyenv/bin/python -I scripts/into_white_v5.py
"""
import os
import numpy as np
import soundfile as sf

PROJ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
V3 = os.path.join(PROJ, "assets", "audio", "v3", "fx")
OUT = os.path.join(PROJ, "assets", "audio", "v5", "fx")
FPS, SR = 30, 48000
ARRIVE = 1890
FADE = 0.12
# (take, the frame it starts on in the film, the frame into the take it starts from): compositions/hype-sound-v5.tsx
CUES = [("ship-drone", 1710, 45), ("strike", 1776, 0), ("port-rush", 1830, 0)]


def main():
    os.makedirs(OUT, exist_ok=True)
    n_f = int(FADE * SR)
    fade = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n_f))
    for name, at, start in CUES:
        x, sr = sf.read(os.path.join(V3, name + ".wav"), always_2d=True)
        assert sr == SR, (name, sr)
        a = start * SR // FPS
        n = (ARRIVE - at) * SR // FPS
        y = x[a:a + n].copy()
        if len(y) < n:
            raise SystemExit("%s: the take is %d samples short of its span" % (name, n - len(y)))
        y[-n_f:] *= fade[:, None]
        y[-1] = 0
        sf.write(os.path.join(OUT, name + "-into-white.wav"), y, SR, subtype="PCM_24")
        print("%s-into-white.wav: frames %d-%d (%.3f s from %.3f s into v3's take), faded over its last %.2f s"
              % (name, at, ARRIVE, n / SR, a / SR, FADE))


if __name__ == "__main__":
    main()
