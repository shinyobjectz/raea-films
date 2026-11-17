#!/usr/bin/env python3
"""The v3 ending's sound effects, cut and worked from CC0 recordings: assets/audio/v3/src (fetched by
scripts/sfx_fetch.py from scripts/sfx_candidates_v3.tsv) and the v2 sources in assets/audio/real/src. Writes
assets/audio/v3/fx/*.wav (48 kHz stereo 16-bit) and assets/audio/v3/INDEX.md and SOURCES.md.

  /tmp/ivyenv/bin/python -I scripts/sfx_build_v3.py

Frames are the film's (30 fps); each file says where it starts against its cue in INDEX.md.
"""
import json, os, sys
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
V3 = os.path.join(PROJ, "assets", "audio", "v3")
FX = os.path.join(V3, "fx")
SRCS = [os.path.join(V3, "src"), os.path.join(PROJ, "assets", "audio", "real", "src")]
REAL = os.path.join(PROJ, "assets", "audio", "real")
FILM_V2 = os.path.join(PROJ, "out", "film-v2", "sound.wav")
SR = 48000
FPS = 30
META = {}
for d in SRCS:
    for l in open(os.path.join(d, "meta.jsonl")):
        m = json.loads(l)
        if m.get("ok") and m["key"] not in META:
            META[m["key"]] = dict(m, dir=d)
db = lambda v: 20 * np.log10(max(float(v), 1e-12))
sec = lambda n: int(round(n * SR))
frames = lambda f: f / FPS


def to48(x, sr):
    if x.ndim == 1:
        x = x[:, None]
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR:
        r = Fraction(SR, sr).limit_denominator(1000)
        x = signal.resample_poly(x, r.numerator, r.denominator, axis=0)
    return x


def load(key):
    m = META[key]
    x, sr = sf.read(os.path.join(m["dir"], m["file"]), always_2d=True)
    x = to48(x, sr)
    x = signal.sosfiltfilt(signal.butter(2, 25, "highpass", fs=SR, output="sos"), x, axis=0)
    return x - x.mean(axis=0)


def wav(path):
    x, sr = sf.read(path, always_2d=True)
    return to48(x, sr)


def cut(x, a, b=None):
    return x[sec(a):] if b is None else x[sec(a):sec(b)]


def fade(x, a_s, b_s):
    x = x.copy()
    a, b = sec(a_s), sec(b_s)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] ** 2
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    return x


def sos(kind, hz, order=2):
    return signal.butter(order, hz, kind, fs=SR, output="sos")


def lp(x, hz, order=4):
    return signal.sosfiltfilt(sos("lowpass", hz, order), x, axis=0)


def hp(x, hz, order=2):
    return signal.sosfiltfilt(sos("highpass", hz, order), x, axis=0)


def bp(x, lo, hi):
    return hp(lp(x, hi), lo)


def speed(x, rate):
    """play at `rate` (0.5: an octave down and twice as long)"""
    r = Fraction(rate).limit_denominator(400)
    return signal.resample_poly(x, r.denominator, r.numerator, axis=0)


def varispeed(x, rates, n_out):
    """play with a speed that changes over the output: `rates` is [(output seconds, speed)], straight lines between"""
    t = np.arange(n_out) / SR
    ts, rs = zip(*rates)
    r = np.interp(t, ts, rs)
    pos = np.concatenate([[0.0], np.cumsum(r[:-1])])
    if pos[-1] >= len(x) - 2:
        raise ValueError("varispeed runs past the source (%d of %d samples)" % (pos[-1], len(x)))
    i = np.arange(len(x))
    return np.stack([np.interp(pos, i, x[:, c]) for c in range(x.shape[1])], 1)


def env_curve(points, n):
    t = np.arange(n) / SR
    ts, gs = zip(*points)
    return np.interp(t, ts, gs)[:, None]


def pan(x, p):
    """constant power; p -1 left .. 1 right, a number or a per-sample array"""
    m = x.mean(1)
    p = np.broadcast_to(np.asarray(p, float), m.shape)
    a = (p + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], 1) * np.sqrt(2)


def place(x, at, n):
    out = np.zeros((n, 2))
    i = sec(at)
    if i < 0:
        x, i = x[-i:], 0
    x = x[: max(0, n - i)]
    out[i:i + len(x)] += x
    return out


def peak_to(x, dbfs=-3.0):
    return x * (10 ** (dbfs / 20) / max(1e-9, np.abs(x).max()))


def rms_to(x, dbfs):
    return x * (10 ** (dbfs / 20) / max(1e-9, np.sqrt(np.mean(x ** 2))))


def onset(x, thresh=0.1, after=0.0):
    a = np.abs(x[sec(after):]).max(1)
    k = sec(0.005)
    e = np.convolve(a, np.ones(k) / k, mode="same")
    return after + int(np.argmax(e > e.max() * thresh)) / SR


def loudest(x, win):
    """where the loudest `win` seconds start"""
    p = x.mean(1) ** 2
    c = np.convolve(p, np.ones(sec(win)), mode="valid")
    return int(np.argmax(c)) / SR


def steadiest(x, secs):
    hop = SR // 4
    lv = np.array([db(np.sqrt(np.mean(x[i:i + SR // 2] ** 2)) + 1e-9) for i in range(0, len(x) - SR // 2, hop)])
    w = int(secs * 4)
    best, bi = 1e9, 0
    for i in range(0, max(1, len(lv) - w)):
        seg = lv[i:i + w]
        cost = seg.std() + 0.5 * max(0, seg.max() - np.median(seg) - 6)
        if cost < best:
            best, bi = cost, i
    return bi * hop / SR


def comb(x, hz, g):
    d = max(1, int(SR / hz))
    a = np.zeros(d + 1); a[0] = 1; a[-1] = -g
    return signal.lfilter([1 - g], a, x, axis=0)


def ir(rt, seconds=None, pre=0.012, bright=0.5, seed=3, early=8, metal=0.0):
    """a room: sparse early reflections, a diffuse tail whose highs die first; `metal` adds a hard hull's ring"""
    rng = np.random.default_rng(seed)
    seconds = seconds or rt * 1.3
    n = sec(seconds)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for c in range(2):
        noise = rng.standard_normal(n)
        lo = signal.sosfilt(sos("lowpass", 1200), noise) * 10 ** (-3 * t / rt)
        hi = signal.sosfilt(sos("highpass", 1200), noise) * 10 ** (-3 * t / (rt * (0.35 + 0.4 * bright))) * bright
        out[:, c] = lo + hi
        b = sec(0.04)
        out[:b, c] *= np.linspace(0, 1, b) ** 2
        for _ in range(early):
            at = int(rng.uniform(0.006, 0.07) * SR)
            out[at, c] += rng.choice([-1, 1]) * rng.uniform(3, 7)
    if metal:
        for hz in (311.0, 467.0, 733.0, 1187.0):
            out += metal * comb(out * 0.02, hz, 0.93)
    out = np.concatenate([np.zeros((sec(pre), 2)), out])
    return out / np.sqrt((out ** 2).sum(0).mean())


def verb(x, room, wet, tail=None):
    n = len(x) + (len(room) if tail is None else sec(tail))
    xx = np.concatenate([x, np.zeros((max(0, n - len(x)), 2))])
    w = np.stack([signal.fftconvolve(xx[:, c], room[:, c])[:n] for c in range(2)], 1)
    return xx * (1 - wet) + w * wet * 0.35


OUT = {}


def put(name, y, keys, note):
    y = np.clip(y, -1, 1)
    OUT[name] = (y, keys, note)


# ---------------------------------------------------------------- the effects
def build():
    L = {k: load(k) for k in META if k in (
        "crack_a", "crack_b", "crack_c", "mud_a", "thunder_a", "hum_a", "hum_d", "engine_a", "wind_a", "rush_a",
        "jet_a", "torch_a", "nails_b", "type_b", "power_a", "murmur_a", "wow_a", "wow_b", "wow_e", "leaves_a")}
    ship = ir(2.4, bright=0.35, seed=11, metal=0.25)
    small = ir(0.7, bright=0.5, seed=5)

    # ---- 1524 the crack: a frozen puddle's crack three times slower and an octave and a half down (the ground
    # splitting), the soil cracking under it, and a log's crash slowed to a thud on the first frame
    x = L["crack_b"]; a = loudest(x, 0.8)
    ice = lp(speed(cut(x, max(0, a - 0.05), a + 1.35), 0.34), 7000)
    soil = lp(cut(L["crack_a"], onset(L["crack_a"]), onset(L["crack_a"]) + 4.6), 5000)
    c = L["crack_c"]; t = loudest(c, 0.3)
    thud = lp(speed(cut(c, max(0, t - 0.03), t + 1.2), 0.5), 1800)
    n = sec(5.2)
    y = place(peak_to(thud), 0.0, n) * 0.9 + place(peak_to(ice), 0.02, n) * 0.85 + place(peak_to(soil), 0.12, n) * 0.55
    put("crack", fade(peak_to(y), 0.002, 1.6), ["crack_b", "crack_a", "crack_c"],
        "the ground splitting: ice cracks at 0.34 speed, soil cracking, a log's crash at half speed (hit at 0.00 s)")

    # ---- the swamp water disturbed: hot bubbling mud
    m = L["mud_a"]; s0 = steadiest(m, 3.2)
    put("mud", fade(rms_to(cut(m, s0, s0 + 3.2), -24), 0.25, 1.0), ["mud_a"], "mud bubbling, the water stirred (3.2 s)")

    # ---- 1552 the beam stands: a transformer's hum rising an octave into a thud, then ringing (hit at 0.50 s)
    h = L["hum_a"]
    rise = varispeed(cut(h, 1.0), [(0, 0.5), (0.5, 1.25)], sec(0.5)) * env_curve([(0, 0), (0.42, 1), (0.5, 1)], sec(0.5))
    jet = L["jet_a"]; j0 = loudest(jet, 0.6)
    swell = lp(cut(jet, max(0, j0 - 0.7), j0 + 0.1)[::-1], 3500) * env_curve([(0, 0), (0.5, 1), (0.8, 1)], sec(0.8))
    pw = L["power_a"]; p0 = loudest(pw, 0.15)
    thunk = lp(speed(cut(pw, p0 - 0.04, p0 + 0.8), 0.6), 2500)
    th = L["thunder_a"]; s_on = onset(th, 0.3)
    whoomp = lp(speed(cut(th, s_on - 0.02, s_on + 1.6), 0.5), 900)
    ring = lp(varispeed(cut(h, 3.0), [(0, 1.25), (2.5, 1.1)], sec(2.5)), 4000) * env_curve([(0, 1), (2.5, 0)], sec(2.5)) ** 2
    n = sec(3.2)
    y = (place(peak_to(rise), 0.0, n) * 0.35 + place(peak_to(swell), -0.3, n) * 0.4 + place(peak_to(thunk), 0.49, n) * 0.8
         + place(peak_to(whoomp), 0.49, n) * 0.9 + place(peak_to(ring), 0.5, n) * 0.25)
    put("beam-up", fade(peak_to(y), 0.01, 0.6), ["hum_a", "jet_a", "power_a", "thunder_a"],
        "the beam stands: a transformer hum rising into a gym light's thud and a thunderclap at half speed (hit at 0.50 s)")

    # ---- 1552-1670 the beam's hum under the rise: transformer and fridge drone, climbing, cut as space opens
    dur = frames(1670 - 1552)
    a_ = varispeed(cut(h, 0.5), [(0, 0.9), (dur, 1.45)], sec(dur))
    b_ = varispeed(cut(L["hum_d"], 2.0), [(0, 0.55), (dur, 0.85)], sec(dur))
    y = bp(rms_to(a_, -24) + rms_to(b_, -27), 50, 3500) * env_curve([(0, 0.6), (dur * 0.6, 0.8), (dur - 0.2, 1.0), (dur, 1.0)], sec(dur))
    put("beam-hum", fade(rms_to(y, -24), 0.15, 0.07), ["hum_a", "hum_d"],
        "the beam's hum, rising as the camera climbs it (frames 1552-1670)")

    # ---- 1580 through the canopy: leaves rushing past
    lv = L["leaves_a"]; l0 = loudest(lv, 2.2)
    y = lp(cut(lv, l0, l0 + 2.4), 9000) * env_curve([(0, 0.2), (0.35, 1), (1.4, 1), (2.4, 0)], sec(2.4))
    put("canopy", fade(peak_to(y), 0.02, 0.3), ["leaves_a"], "leaves rushing past as the camera climbs through the canopy (2.4 s)")

    # ---- 1596-1670 into the cloud: a chimney's air rush and a strong wind, faster and louder, cut dead at space
    dur = frames(1670 - 1596)
    r = varispeed(cut(L["rush_a"], 2.0), [(0, 0.9), (dur, 1.25)], sec(dur))
    w = L["wind_a"]
    w = varispeed(cut(w, 0.5), [(0, 1.0), (dur, 1.3)], sec(dur))
    y = (rms_to(r, -22) + rms_to(w, -24)) * env_curve([(0, 0), (0.6, 0.45), (dur - 0.35, 1.0), (dur - 0.2, 1.0), (dur, 0.9)], sec(dur))
    put("wind-rise", fade(peak_to(hp(y, 60)), 0.05, 0.06), ["rush_a", "wind_a"],
        "air rushing faster into the cloud and the white, cut as space opens (frames 1596-1670)")

    # ---- space: the ship's drone, an old fridge an octave down with an engine room under it
    dur = 9.0
    a_ = lp(speed(cut(L["hum_d"], 10.0, 10.0 + dur / 2 + 0.2), 0.5), 700)[:sec(dur)]
    e = L["engine_a"]
    b_ = lp(speed(cut(e, 1.0, 1.0 + dur * 0.62), 0.62), 500)[:sec(dur)]
    y = rms_to(a_, -26) + rms_to(b_, -32)
    put("ship-drone", fade(rms_to(y, -24), 1.5, 1.5), ["hum_d", "engine_a"],
        "the mothership's drone: a fridge's hum an octave down, an engine room at 0.62 speed under it (9 s)")

    # ---- 1670-1736 the beam's tip climbing to the ship: the hum rising into the strike
    dur = frames(1736 - 1670)
    a_ = varispeed(cut(h, 6.0), [(0, 0.8), (dur, 1.7)], sec(dur))
    b_ = varispeed(cut(L["rush_a"], 12.0), [(0, 0.8), (dur, 1.4)], sec(dur))
    y = bp(rms_to(a_, -24) + rms_to(b_, -28), 80, 5000) * env_curve([(0, 0.25), (dur * 0.7, 0.55), (dur, 1.0)], sec(dur))
    put("beam-climb", fade(peak_to(y), 0.4, 0.02), ["hum_a", "rush_a"], "the beam climbing to the port, rising into the strike (frames 1670-1736)")

    # ---- 1736 the strike: a very close lightning strike at 0.55 speed, low-passed: felt more than heard (hit at 0.00 s)
    big = lp(speed(cut(th, s_on - 0.01, s_on + 4.4), 0.55), 1400)
    snap = hp(cut(th, s_on - 0.005, s_on + 0.25), 1500)
    sub = lp(speed(cut(pw, p0 - 0.04, p0 + 1.0), 0.45), 400)
    n = sec(7.5)
    y = place(peak_to(big), 0, n) + place(peak_to(snap), 0, n) * 0.18 + place(peak_to(sub), 0, n) * 0.7
    put("strike", fade(peak_to(y), 0.002, 2.5), ["thunder_a", "power_a"],
        "the beam strikes the port: a close lightning strike at 0.55 speed, low-passed, a light's thud an octave down under it")

    # ---- 1790-1850 into the port: rush and roar climbing into the white, cut dead at 1850
    dur = frames(1850 - 1790)
    a_ = varispeed(cut(L["rush_a"], 20.0), [(0, 0.9), (dur, 1.5)], sec(dur))
    b_ = lp(varispeed(cut(jet, max(0, j0 - 1.0)), [(0, 0.8), (dur, 1.25)], sec(dur)), 6000)
    c_ = varispeed(cut(h, 12.0), [(0, 1.0), (dur, 2.0)], sec(dur))
    y = (rms_to(a_, -22) + rms_to(b_, -24) + rms_to(c_, -30)) * env_curve([(0, 0.15), (dur * 0.5, 0.35), (frames(52), 1.0), (dur, 1.0)], sec(dur))
    put("port-rush", fade(peak_to(y), 0.2, 0.012), ["rush_a", "jet_a", "hum_a"],
        "the camera into the port: air, a jet's roar and the hum climbing into the white, cut at 1850 (frames 1790-1850)")

    # ---- 1850-2165 the review room: a big room's hum
    dur = frames(2165 - 1850) + 1.0
    s0 = steadiest(h, 12.0)
    a_ = lp(cut(h, s0, s0 + dur), 2500)
    b_ = lp(speed(cut(e, 4.0, 4.0 + dur * 0.5 + 0.2), 0.5), 400)[:sec(dur)]
    y = rms_to(a_, -32) + rms_to(b_, -36)
    put("room-tone", fade(rms_to(y, -30), 0.03, 1.0), ["hum_a", "engine_a"], "the review room: a transformer's hum in a large room, an engine an octave down (11.5 s)")

    # ---- the room's audience murmuring: a show crowd's walla slowed (lower, less human), doubled faster, in the hull
    mu = L["murmur_a"]
    a_ = speed(cut(mu, 2.0, 2.0 + 10 * 0.84), 0.84)
    b_ = pan(speed(cut(mu, 30.0, 30.0 + 10 * 1.12), 1.12), 0.5)
    n = min(len(a_), len(b_))
    y = lp(rms_to(a_[:n], -30) + rms_to(b_[:n], -34), 5000)
    y = verb(y, ship, 0.45, tail=0.0)[:n]
    put("murmur", fade(rms_to(y, -28), 0.5, 1.0), ["murmur_a"], "the room's audience murmuring, slowed and doubled, in the ship's hall (10 s)")

    # ---- 1912 the wow: a group's synchronized "Wow" a little slowed and lower, doubled higher, an "aah" and an "ooh"
    # under it, in the hall (the wow's onset at 0.10 s)
    wa = L["wow_a"]; w0 = onset(wa, 0.1)
    main = speed(cut(wa, w0 - 0.02), 0.87)
    hi_ = pan(speed(cut(wa, w0 - 0.02), 1.09), 0.6)
    we = L["wow_e"]; e0 = onset(we, 0.1, after=5.0)
    aah = pan(speed(cut(we, e0 - 0.02, e0 + 3.4), 0.85), -0.55)
    wb = L["wow_b"]; b0 = onset(wb, 0.1, after=5.6)
    ooh = pan(speed(cut(wb, b0 - 0.02, b0 + 2.6), 0.92), 0.25)
    n = sec(5.0)
    y = (place(peak_to(main), 0.10, n) + place(peak_to(hi_), 0.14, n) * 0.55 + place(peak_to(aah), 0.28, n) * 0.5
         + place(peak_to(ooh), 0.18, n) * 0.4)
    y = verb(lp(y, 9000), ship, 0.5, tail=0.0)[:n]
    put("wow", fade(peak_to(y), 0.005, 1.2), ["wow_a", "wow_e", "wow_b"],
        "the room's wow: a group's \"Wow\" at 0.87 speed, doubled at 1.09, a crowd's aah and ooh under it, in the hall")

    # ---- the film in the room, from its screen's speakers: v2's own mix from its frame 700 (the sun about to rise),
    # band-limited, a little driven, in the hall (the bloom at v2's 740 lands 40 frames in)
    if os.path.exists(FILM_V2):
        fm = wav(FILM_V2)
        y = cut(fm, frames(700), frames(700) + frames(2045 - 1872) + 0.5)
        y = bp(y, 220, 5500)
        y = np.tanh(peak_to(y, -1) * 1.6) / np.tanh(1.6)
        y = verb(pan(y, -0.15) * 0.8 + y * 0.2, ship, 0.4, tail=0.0)[:len(y)]
        put("film-room", fade(rms_to(y, -24), 0.03, 0.5), ["film_v2"],
            "the film on the room's screen: v2's mix from its frame 700, band-limited and driven, in the hall (frames 1872-2045)")

    # ---- 1986-2036 the alien hands typing: fast typing slowed, through a glassy comb, with fingernail taps raised
    ty = L["type_b"]; t0 = loudest(ty, 1.5)
    dur = frames(2036 - 1986) + 0.25
    a_ = speed(cut(ty, t0, t0 + dur * 0.82 + 0.1), 0.82)[:sec(dur)]
    a_ = 0.6 * a_ + 0.4 * comb(a_, 1730.0, 0.62)
    nb = L["nails_b"]; n0 = loudest(cut(nb, 6.0), 1.6) + 6.0
    b_ = pan(speed(cut(nb, n0, n0 + dur / 1.3 + 0.1), 1.3), 0.3)[:sec(dur)]
    y = peak_to(a_) + place(peak_to(b_) * 0.45, 0.0, len(a_))
    y = verb(hp(y, 180), small, 0.25, tail=0.4)
    put("alien-typing", fade(peak_to(y), 0.01, 0.3), ["type_b", "nails_b"],
        "alien hands typing: fast typing at 0.82 speed through a glassy comb, fingernail taps at 1.3 speed (frames 1986-2036)")

    # ---- 2058 the note posts: a drip and a fingernail on glass, both slowed, ringing
    dr = wav(os.path.join(REAL, "drip-0.wav")); tp = wav(os.path.join(REAL, "tap.wav"))
    n = sec(1.4)
    y = place(peak_to(speed(dr, 0.7)), 0, n) + place(peak_to(speed(tp, 0.62)), 0.0, n) * 0.6
    y = y + 0.35 * comb(y, 880.0, 0.8)
    y = verb(y, ship, 0.3, tail=0.0)[:n]
    put("note-post", fade(peak_to(y), 0.002, 0.6), ["drip_a", "tap_c"], "the alien note posting: a drip and a fingernail on glass, slowed, ringing (hit at 0.00 s)")

    # ---- 2165-2310 the robot's thruster past the lens and away to the ship: a blowtorch's flame, its level and pan
    # following the robot's path in components/orbit.tsx (closest about 2.4 m at frame ~2183, centre of frame ~2193,
    # peeling off at 2227, a speck by ~2290), duller as it goes
    to = L["torch_a"]; s0 = steadiest(cut(to, 8.0, 40.0), 5.5) + 8.0
    dur = frames(2310 - 2165)
    fl = cut(to, s0, s0 + dur)
    loc = np.arange(sec(dur)) / SR * FPS  # the shot's local frame
    A0, A1, B1 = -4, 62, 142
    u = np.clip((loc - A0) / (A1 - A0), 0, 1)
    lat = np.interp(u, [0, 0.33, 0.5, 0.75, 1], [-1.9, -0.85, -0.2, 0.35, 0.6])
    fwd = np.interp(u, [0, 0.33, 0.5, 0.75, 1], [2.3, 2.45, 2.8, 3.6, 5.0])
    d = np.hypot(lat, fwd)
    r_ = 0.0912; v0 = 6.6 / 66
    far = np.where(loc > A1, (v0 / r_) * (np.exp(r_ * np.clip(loc - A1, 0, B1 - A1)) - 1), 0)
    d = d + far
    g = (2.4 / d)[:, None] * np.where(loc > B1 - 4, np.clip((B1 - loc) / 4, 0, 1), 1)[:, None]
    p = np.clip(np.where(loc <= A1, lat / (fwd * 0.51), 0.12 * np.exp(-(loc - A1) / 30)), -1, 1)
    near = pan(fl, p) * g
    dull = lp(near, 900)
    mixw = np.clip(np.log10(d / 2.4) / 1.5, 0, 1)[:, None]
    y = near * (1 - mixw) + dull * mixw
    jp = lp(speed(cut(jet, max(0, j0 - 1.0), j0 + 1.2), 1.5), 4000)
    jp = pan(jp * env_curve([(0, 0), (0.6, 1), (1.0, 0.8), (len(jp) / SR, 0)], len(jp)), np.linspace(-0.7, 0.4, len(jp)))
    y = y + place(peak_to(jp) * 0.35, frames(2176 - 2165), len(y))
    put("thruster-pass", fade(peak_to(y), 0.25, 0.3), ["torch_a", "jet_a"],
        "the robot's thruster: a blowtorch's flame panned and levelled along its path past the lens and away, a jet's pass under it (frames 2165-2310)")


def write():
    os.makedirs(FX, exist_ok=True)
    rows, used = [], set()
    for name, (y, keys, note) in OUT.items():
        sf.write(os.path.join(FX, name + ".wav"), y, SR, subtype="PCM_16")
        rows.append((name, note, len(y) / SR, db(np.abs(y).max()), db(np.sqrt(np.mean(y ** 2))), ", ".join(keys)))
        used.update(keys)
    with open(os.path.join(V3, "INDEX.md"), "w") as f:
        f.write("# v3 sound effects\n\nCut and worked by scripts/sfx_build_v3.py from CC0 recordings (SOURCES.md). 48 kHz stereo 16-bit, in fx/.\n"
                "The score is score.wav (scripts/score_v3.py). compositions/hype-sound-v3.tsx places them.\n\n")
        f.write("| file | what | seconds | peak dBFS | RMS dBFS | source |\n|---|---|---|---|---|---|\n")
        for r in rows:
            f.write("| fx/%s.wav | %s | %.2f | %.1f | %.1f | %s |\n" % r)
    with open(os.path.join(V3, "SOURCES.md"), "w") as f:
        f.write("# Sources\n\nFrom freesound.org, each checked as CC0 1.0 (public domain dedication) on its page by scripts/sfx_fetch.py; "
                "the public preview file was fetched 2026-11-16 into src/ (meta.jsonl holds each page's licence links). "
                "drip_a and tap_c are v2's (assets/audio/real/SOURCES.md). film_v2 is this film's own v2 mix.\n\n")
        f.write("| key | title | author | page | licence |\n|---|---|---|---|---|\n")
        for k in sorted(used):
            if k == "film_v2":
                f.write("| film_v2 | the film's v2 sound mix (out/film-v2/sound.wav) | this project | - | own |\n")
                continue
            m = META[k]
            f.write("| %s | %s | %s | %s | %s |\n" % (k, m["title"].replace("|", "/"), m["author"], m["page"],
                                                     "CC0 1.0" if all("zero" in l for l in m["licence"]) else m["licence"]))
    for r in rows:
        print("%-14s %5.2f s  peak %6.1f  rms %6.1f  %s" % (r[0], r[2], r[3], r[4], r[1][:90]))


if __name__ == "__main__":
    build()
    write()
