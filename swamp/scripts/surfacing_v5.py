#!/usr/bin/env python3
"""The surfacing at the head of 01-water, v5: the lens comes up out of the peat water (take.ts RISE: the glass meets
the surface at frame 6.75 and is clear of it by 16.6, lenswater.tsx) and the water runs off it.

  - under: a hydrophone's dull roar and the slow swish of the camera moving through still water, low-passed to 1.1 kHz,
    held to frame 7 and gone by frame 15 as the glass leaves the water;
  - the break: a hand drawn gently up through water (a slosh, high-passed so it stays light), its swell on frame 13;
  - the run-off: a small trickle as the sheet drains off the glass (frames 14-42), and drops falling off the housing
    back into the swamp a few centimetres below as the runs and the big drops slide off (frames 19-58).

Every sound is a real CC0 recording (assets/audio/v5/src/meta.jsonl, assets/audio/v5/SOURCES.md). Writes
assets/audio/v5/fx/surfacing.wav (from frame 0 of the film) and assets/audio/v5/fx/bed-dead-under.wav: the dead
swamp's bed from 1.0 s in (the cue hype-sound-v5.tsx starts it from) low-passed to 380 Hz, the bed as heard from under
the water, which the mix crossfades into the bed itself as the lens breaks the surface.

  /tmp/ivyenv/bin/python -I scripts/surfacing_v5.py
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfx_build_v3 as X  # noqa: E402  (its helpers: wav, cut, lp, hp, fade, place, pan, rms_to, peak_to, env_curve)

PROJ = X.PROJ
SRC = os.path.join(PROJ, "assets", "audio", "v5", "src")
FX = os.path.join(PROJ, "assets", "audio", "v5", "fx")
SR, FPS = X.SR, X.FPS
f2s = lambda f: f / FPS

META = {}
for l in open(os.path.join(SRC, "meta.jsonl")):
    m = json.loads(l)
    if m.get("ok"):
        META[m["key"]] = m


def load(key):
    x = X.wav(os.path.join(SRC, META[key]["file"]))
    x = X.hp(x, 25)
    return x - x.mean(axis=0)


def build():
    n = X.sec(2.4)
    out = np.zeros((n, 2))

    # ---- under: felix.blume's sea under water (its calm first second) for the roar, Tim_Verberne's hydrophone swish
    # (one of its takes, 3.1 s in) for the camera's own movement through the water; both dull, as water hears
    roar = X.rms_to(X.lp(X.cut(load("uw_b"), 0.0, 0.7), 1100), -31)
    swish = X.peak_to(X.lp(X.cut(load("uw_a"), 3.1, 3.8), 1100), -16)
    under = X.place(roar, 0.0, n) + X.place(swish, 0.0, n)
    under *= X.env_curve([(0.0, 0.0), (0.02, 1.0), (f2s(7), 1.0), (f2s(15), 0.0), (2.4, 0.0)], n) ** 1.5
    out += under

    # ---- the break: Daen23's hand moving in water, the swell of one stroke (4.2-4.8 s), high-passed and light; it
    # starts as the glass meets the surface (frame 6) and swells as the waterline sweeps down the frame
    slosh = X.fade(X.hp(X.cut(load("move_a"), 4.2, 4.85), 180), 0.03, 0.2)
    out += X.place(X.peak_to(slosh, -15), f2s(6), n)

    # ---- the run-off: kyles's small trickle as the sheet drains, and AardsReal's drips into water as the drops fall
    trickle = X.fade(X.lp(X.cut(load("run_c"), 0.3, 1.4), 7000), 0.08, 0.5)
    out += X.place(X.rms_to(trickle, -38), f2s(14), n)
    drips = load("run_e")
    # its single drips (onsets measured on the recording: 0.21, 0.37, 0.49, 0.55, 0.62, 0.73 s), each 90 ms
    singles = [X.fade(X.cut(drips, a - 0.004, a + 0.09), 0.002, 0.05) for a in (0.21, 0.37, 0.49, 0.55, 0.62, 0.73)]
    falls = [(19, 0, -16, -0.3), (24, 2, -20, 0.25), (29, 1, -18, -0.1), (35, 4, -21, 0.4), (41, 3, -19, -0.35), (49, 5, -22, 0.15), (58, 2, -24, -0.2)]
    for f, k, pk, p in falls:
        out += X.place(X.pan(X.peak_to(singles[k], pk), p), f2s(f), n)

    peak = 20 * np.log10(np.abs(out).max())
    print("surfacing: %.2f s, peak %.1f dBFS" % (n / SR, peak))
    sf.write(os.path.join(FX, "surfacing.wav"), out.astype(np.float32), SR, subtype="PCM_16")

    # ---- the bed from under the water: bed-dead from 1.0 s, low-passed (zero phase, so it sums with the bed itself)
    bed = X.wav(os.path.join(PROJ, "assets", "audio", "real", "bed-dead.wav"))
    under_bed = X.lp(X.cut(bed, 1.0, 2.5), 380)
    sf.write(os.path.join(FX, "bed-dead-under.wav"), under_bed.astype(np.float32), SR, subtype="PCM_16")
    print("bed-dead-under: %.2f s" % (len(under_bed) / SR))


if __name__ == "__main__":
    build()
