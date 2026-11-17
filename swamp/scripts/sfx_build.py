#!/usr/bin/env python3
"""The film's real sound effects: CC0 field and foley recordings (assets/audio/real/src, fetched by
scripts/sfx_fetch.py, licences in src/meta.jsonl) cut into the files the mix plays, in assets/audio/real/.

  /tmp/ivyenv/bin/python -I scripts/sfx_build.py

Spot effects are cut to their onset (5 ms before it), end where they fall 50 dB under their peak (or at a
length limit), get 2 ms / 25 ms fades and peak at -3 dBFS. Beds take the steadiest stretch of their recording
(the window whose one-second levels vary least and hold no spike), fade 1.5 s at each end, and sit at
-26 dBFS RMS. Everything is 48 kHz stereo 16-bit, high-passed at 25 Hz with no DC. Writes INDEX.md and
SOURCES.md beside them.
"""
import json, os, sys
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
REAL = os.path.join(PROJ, "assets", "audio", "real")
SRC = os.path.join(REAL, "src")
SR = 48000
META = {json.loads(l)["key"]: json.loads(l) for l in open(os.path.join(SRC, "meta.jsonl"))}
HP = signal.butter(2, 25, "highpass", fs=SR, output="sos")
db = lambda v: 20 * np.log10(max(float(v), 1e-12))


def load(key):
    m = META[key]
    x, sr = sf.read(os.path.join(SRC, m["file"]), always_2d=True)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR:
        r = Fraction(SR, sr).limit_denominator(1000)
        x = signal.resample_poly(x, r.numerator, r.denominator, axis=0)
    x = signal.sosfiltfilt(HP, x, axis=0)
    return x - x.mean(axis=0)


def env(x, ms=5):
    n = max(1, int(SR * ms / 1000))
    a = np.abs(x).max(axis=1)
    return np.convolve(a, np.ones(n) / n, mode="same")


def fade(x, a_ms, b_ms):
    x = x.copy()
    a, b = int(SR * a_ms / 1000), int(SR * b_ms / 1000)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] ** 2
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    return x


def spot(x, maxlen=2.0, floor_db=-50, at=None, pitch=1.0):
    """one event: from 5 ms before its onset (or from `at` seconds) to where it falls under its peak by floor_db"""
    if at is not None:
        x = x[int(at * SR):]
    e = env(x)
    pk = e.max()
    on = int(np.argmax(e > pk * 0.1))
    s = max(0, on - int(0.005 * SR))
    y = x[s : s + int(maxlen * SR)]
    e = env(y, 20)
    above = np.where(e > pk * 10 ** (floor_db / 20))[0]
    end = min(len(y), (above[-1] if len(above) else len(y)) + int(0.03 * SR))
    y = y[:end]
    if pitch != 1.0:
        r = Fraction(pitch).limit_denominator(200)
        y = signal.resample_poly(y, r.denominator, r.numerator, axis=0)
    y = fade(y, 2, min(25, len(y) * 1000 / SR / 4))
    return y * (10 ** (-3 / 20) / np.abs(y).max())


def events(x, n, gap=0.25, maxlen=0.6):
    """the n strongest separate events in a long recording, each cut as spot() cuts one"""
    e = env(x, 3)
    peaks, _ = signal.find_peaks(e, distance=int(gap * SR), height=e.max() * 0.15)
    peaks = sorted(peaks, key=lambda p: -e[p])[:n]
    return [spot(x[max(0, p - int(0.04 * SR)) :], maxlen) for p in sorted(peaks)]


def bed(x, secs, avoid=()):
    """the steadiest `secs` of a recording: the window whose one-second levels vary least, with no spike"""
    hop = SR // 2
    rms = np.array([np.sqrt(np.mean(x[i : i + SR] ** 2)) + 1e-9 for i in range(0, len(x) - SR, hop)])
    lv = 20 * np.log10(rms)
    w = int(secs * 2)
    best, bi = 1e9, 0
    for i in range(0, max(1, len(lv) - w)):
        t0, t1 = i / 2, i / 2 + secs
        if any(a < t1 and b > t0 for a, b in avoid):
            continue
        seg = lv[i : i + w]
        cost = seg.std() + 0.5 * max(0, seg.max() - np.median(seg) - 6)
        if cost < best:
            best, bi = cost, i
    y = x[bi * hop : bi * hop + int(secs * SR)]
    y = fade(y, 1500, 1500)
    y = y * (10 ** (-26 / 20) / np.sqrt(np.mean(y**2)))
    if np.abs(y).max() > 10 ** (-3 / 20):
        y *= 10 ** (-3 / 20) / np.abs(y).max()
    return y, bi * hop / SR


def hp(x, hz):
    return signal.sosfiltfilt(signal.butter(2, hz, "highpass", fs=SR, output="sos"), x, axis=0)


def lp(x, hz):
    return signal.sosfiltfilt(signal.butter(4, hz, "lowpass", fs=SR, output="sos"), x, axis=0)


def mix(*parts):
    n = max(len(p) for p, _ in parts)
    out = np.zeros((n, 2))
    for p, g in parts:
        out[: len(p)] += p * 10 ** (g / 20)
    return out


OUT = {}  # name -> (array, source keys, note)


def put(name, y, keys, note):
    OUT[name] = (y, keys, note)


def build():
    L = {k: load(k) for k in META}
    # ---- beds
    y, t = bed(L["dead_c"], 34); z, t2 = bed(L["dead_b"], 34)
    put("bed-dead", mix((y, -2), (z, -4)) * 0.9, ["dead_c", "dead_b"], f"wind in dry reed (from {t:.1f} s) over tiny waves lapping (from {t2:.1f} s)")
    # (alive_b, a cicada swamp, put 85% of its energy above 6 kHz: too sharp under music; this pair is balanced)
    y, t = bed(hp(L["alive_d"], 80), 34); z, t2 = bed(hp(L["alive_c"], 80), 34)
    put("bed-alive", mix((y, -1.5), (z, -8)), ["alive_d", "alive_c"], f"wetland field by day (from {t:.1f} s) with Pantanal insects and birds under it (from {t2:.1f} s)")
    y, t = bed(L["birds_a"], 30)
    put("birds", y, ["birds_a"], f"dawn chorus (from {t:.1f} s)")
    y, t = bed(L["dusk_a"], 34)
    put("bed-dusk", y, ["dusk_a"], f"small marsh at evening: frogs, crickets (from {t:.1f} s)")
    y, t = bed(L["shimmer_c"], 20)
    put("shimmer", y, ["shimmer_c"], f"night crickets, calm (from {t:.1f} s)")
    y, t = bed(L["wash_b"], 12)
    put("lap", y, ["wash_b"], f"running water, for the mist rolling in (from {t:.1f} s)")
    y, t = bed(L["hover_c"], 6)
    put("hover", y, ["hover_c"], f"a small fan's steady whirr, the robot's hover (from {t:.1f} s)")
    # ---- the keyboard
    put("key", spot(L["key_d"], 0.35), ["key_d"], "one key pressed")
    put("key-2", spot(L["key_c"], 0.35), ["key_c"], "one key pressed, another")
    put("slam", spot(L["key_a"], 0.5, pitch=0.82), ["key_a"], "a hard key hit, pitched down 18%: the Return slam")
    t = L["typing_a"]
    put("typing", fade(t[: int(9.0 * SR)] * (10 ** (-3 / 20) / np.abs(t).max()), 5, 200), ["typing_a"], "typing on a modded Omnikey 101, 9 s")
    # ---- taps on the glass
    put("tap", spot(L["tap_c"], 0.3), ["tap_c"], "a fingernail on glass")
    put("tap-2", spot(L["tap_a"], 0.3), ["tap_a"], "a fingernail on a glass bottle")
    put("tick", spot(L["tap_d"], 0.25), ["tap_d"], "a small relay")
    # its flyback whine (a 16.3 kHz tone, a third of the recording's energy) is real but pierces the mix: low-passed out
    put("wake", spot(lp(L["wake_a"], 11000), 3.0, floor_db=-60), ["wake_a"], "a CRT switching on, its 16 kHz whine filtered out")
    # ---- water
    for i, d in enumerate(events(L["drip_a"], 4, gap=0.4)):
        put(f"drip-{i}", d, ["drip_a"], "a single drip")
    put("drop", spot(L["drop_a"], 1.6), ["drop_a"], "a pebble into water")
    put("splash", spot(L["drop_c"], 0.8), ["drop_c"], "a small splash")
    put("wash", fade(spot(L["wash_a"], 3.5, floor_db=-70), 2, 600), ["wash_a"], "water poured onto grass")
    put("pebble", spot(L["pebble_a"], 0.9), ["pebble_a"], "a pebble tumbling")
    # ---- the world growing
    put("creak", spot(L["creak_a"], 2.5, floor_db=-60), ["creak_a"], "a tree creaking")
    y, t = bed(L["leaves_a"], 4)
    put("leaves", fade(y * (10 ** (-3 / 20) / np.abs(y).max()), 300, 900), ["leaves_a"], f"a gust through leaves (from {t:.1f} s)")
    y, t = bed(L["reeds_a"], 2.5)
    put("reeds", fade(y * (10 ** (-3 / 20) / np.abs(y).max()), 150, 600), ["reeds_a"], f"reeds rustling (from {t:.1f} s)")
    put("gust", spot(L["scrub_a"], 3.4, floor_db=-60), ["scrub_a"], "a gust of wind: the time-lapse scrub")
    put("swish", spot(L["scrub_c"], 0.65), ["scrub_c"], "bamboo swooshed: the robot's loop")
    # ---- the robot
    put("servo", spot(L["servo_b"], 1.0), ["servo_b"], "a servo's short arm move")
    put("servo-2", spot(L["servo_d"], 1.2), ["servo_d"], "a small robot servo")
    put("servo-3", spot(L["servo_a"], 1.0), ["servo_a"], "a servo")
    # ---- the note
    y = L["pencil_d"]
    put("marker", fade(y[int(0.3 * SR) : int(1.75 * SR)] * (10 ** (-3 / 20) / np.abs(y).max()), 20, 120), ["pencil_d"], "a marker on a whiteboard, 1.45 s: drawing the loop")
    put("marker-circle", spot(L["pencil_a"], 0.8), ["pencil_a"], "a marker drawing a circle")
    # ---- creatures
    put("frog", spot(L["frog_b"], 1.0), ["frog_b"], "a green frog")
    put("frog-2", spot(L["frog_c"], 1.3), ["frog_c"], "a frog croak")
    put("frog-3", spot(L["frog_a"], 1.1), ["frog_a"], "a grey tree frog")
    put("cricket", spot(L["cricket_b"], 1.0), ["cricket_b"], "one cricket's chirp")
    put("crow", spot(L["dead_e"], 1.6, floor_db=-40, at=bed_peak(L["dead_e"])), ["dead_e"], "a distant crow")


def bed_peak(x):
    e = env(x, 50)
    return max(0.0, int(np.argmax(e)) / SR - 0.2)


def write():
    os.makedirs(REAL, exist_ok=True)
    rows, used = [], set()
    for name, (y, keys, note) in OUT.items():
        y = np.clip(y, -1, 1)
        sf.write(os.path.join(REAL, name + ".wav"), y, SR, subtype="PCM_16")
        rms = np.sqrt(np.mean(y**2))
        e = env(y)
        onset = np.argmax(e > e.max() * 0.1) / SR * 1000
        rows.append((name, note, len(y) / SR, db(np.abs(y).max()), db(rms), onset, ", ".join(keys)))
        used.update(keys)
    with open(os.path.join(REAL, "INDEX.md"), "w") as f:
        f.write("# Real sound effects\n\nCut by scripts/sfx_build.py from CC0 recordings (SOURCES.md). 48 kHz stereo 16-bit.\n\n")
        f.write("| file | what | seconds | peak dBFS | RMS dBFS | onset ms | source |\n|---|---|---|---|---|---|---|\n")
        for r in rows:
            f.write("| %s.wav | %s | %.2f | %.1f | %.1f | %.0f | %s |\n" % r)
    with open(os.path.join(REAL, "SOURCES.md"), "w") as f:
        f.write("# Sources\n\nAll from freesound.org, each checked as CC0 1.0 (public domain dedication) on its page; the public preview file was fetched 2026-11-16.\n\n")
        f.write("| key | title | author | page | licence |\n|---|---|---|---|---|\n")
        for k in sorted(used):
            m = META[k]
            f.write("| %s | %s | %s | %s | %s |\n" % (k, m["title"].replace("|", "/"), m["author"], m["page"], "CC0 1.0" if "zero" in " ".join(m["licence"]) else m["licence"]))
    for r in rows:
        print("%-14s %5.2f s  peak %6.1f  rms %6.1f  onset %4.0f ms  %s" % (r[0], r[2], r[3], r[4], r[5], r[1]))


if __name__ == "__main__":
    build()
    write()
