#!/usr/bin/env python3
"""The film on the review room's screen, v5: from T.roomPlay (2032) to T.hands (2140) the screen shows v5's own frames
740-790 (11-sun), 822-864 (13-water) and 896-912 (15-leaves). This cuts v5's mix at those frames, joins them in that
order (a 12 ms equal-power crossfade centred on each cut, so the joins don't click), and works it as v3's film-room
was worked (scripts/sfx_build_v3.py): band-limited, a little driven, then in a small room, low and dull, as if from
the screen's own speakers across the room. Writes assets/audio/v5/fx/film-room-v5.wav.

  /tmp/ivyenv/bin/python -I scripts/film_room_v5.py out/v5/sound/hype-v5-nofilm.wav

The mix it reads is compositions/hype-sound-v5.tsx rendered with FILM_ROOM off (it can't hear itself).
"""
import os, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfx_build_v3 as X  # noqa: E402  (its helpers: cut, bp, verb, ir, pan, rms_to, peak_to, fade)

PROJ = X.PROJ
OUT = os.path.join(PROJ, "assets", "audio", "v5", "fx", "film-room-v5.wav")
SR, FPS = X.SR, X.FPS
SEGMENTS = [(740, 790), (822, 864), (896, 912)]  # v5's frames, in the order the room's screen shows them
XF = 0.012  # seconds


def main(src):
    mix, sr = sf.read(src, always_2d=True)
    assert sr == SR, sr
    h = X.sec(XF / 2)
    parts = [mix[X.sec(a / FPS) - h:X.sec(b / FPS) + h] for a, b in SEGMENTS]
    n = X.sec(XF)
    w = np.linspace(0, np.pi / 2, n)[:, None]
    y = parts[0]
    for p in parts[1:]:
        y = np.concatenate([y[:-n], y[-n:] * np.cos(w) + p[:n] * np.sin(w), p[n:]])
    want = sum(b - a for a, b in SEGMENTS) / FPS
    print("joined %.3f s (the screen's %.3f s)" % ((len(y) - 2 * h) / SR, want))
    y = y[h:len(y) - h] if h else y
    # v3's chain, duller and in a small room: band-limited lower than v3's 220-5500 Hz, driven, then the room
    y = X.bp(y, 160, 3200)
    y = np.tanh(X.peak_to(y, -1) * 1.6) / np.tanh(1.6)
    small = X.ir(0.6, bright=0.25, seed=5)
    y = X.verb(X.pan(y, -0.15) * 0.8 + y * 0.2, small, 0.45, tail=0.5)
    y = X.fade(X.rms_to(y, -24), 0.02, 0.5)
    y = np.clip(y, -1, 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sf.write(OUT, y, SR, subtype="PCM_16")
    print("%s: %.2f s, peak %.1f dBFS, rms %.1f dBFS" % (OUT, len(y) / SR, X.db(np.abs(y).max()), X.db(np.sqrt(np.mean(y ** 2)))))


if __name__ == "__main__":
    main(sys.argv[1])
