#!/usr/bin/env python3
"""The v4 sound effects, cut and worked from CC0 recordings (assets/audio/v4/src, fetched by scripts/sfx_fetch.py from
scripts/sfx_candidates_v4.tsv; v3's and v2's sources too) and, for the droid's voice and the screen's chime, made here.
Writes assets/audio/v4/fx/*.wav (48 kHz stereo 16-bit), assets/audio/v4/INDEX.md and SOURCES.md.

  /tmp/ivyenv/bin/python -I scripts/sfx_build_v4.py

Frames are the film's (30 fps, components/timeline.ts T); each file's INDEX row says where it sits against its cue.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfx_build_v3 as B  # noqa: E402  (helpers, and v3's and v2's sources)

PROJ = B.PROJ
V4 = os.path.join(PROJ, "assets", "audio", "v4")
FX = os.path.join(V4, "fx")
SRC4 = os.path.join(V4, "src")
SR, FPS = B.SR, B.FPS
sec, frames, cut, fade, lp, hp, bp, speed, varispeed = B.sec, B.frames, B.cut, B.fade, B.lp, B.hp, B.bp, B.speed, B.varispeed
env_curve, pan, place, peak_to, rms_to, comb, verb, onset, loudest, steadiest = (
    B.env_curve, B.pan, B.place, B.peak_to, B.rms_to, B.comb, B.verb, B.onset, B.loudest, B.steadiest)

# the film's beats (components/timeline.ts)
T = dict(tremor=1518, crack=1530, blast=1566, beam=1586, rise=1620, orbit=1710, strike=1776, port=1830, arrive=1890,
         linkIn=1906, room=2010, end=2325, pass_=2352, sad=2364, tilt=2425, fishOut=836, fishIn=851)
WALK = [(0, 1926), (2, 1932), (1, 1942), (3, 1950)]  # (head, first step)
STEP, STEPS, SIT = 14, 4, 4
HEAD_PAN = {0: -0.55, 2: -0.28, 1: 0.3, 3: 0.58}  # heads 0 and 2 on the room's left, 1 and 3 on its right

META4 = {}
for l in open(os.path.join(SRC4, "meta.jsonl")):
    m = json.loads(l)
    if m.get("ok"):
        META4[m["key"]] = dict(m, dir=SRC4)


def load4(key):
    m = META4[key]
    x, sr = sf.read(os.path.join(m["dir"], m["file"]), always_2d=True)
    x = B.to48(x, sr)
    x = hp(x, 25)
    return x - x.mean(axis=0)


def hits(x, n, gap=0.12, pre=0.008, length=0.6, skip=0.0):
    """the n strongest separate transients in x (at least `gap` s apart), each cut from `pre` before to `length` after"""
    a = np.abs(x).max(1)
    k = sec(0.004)
    e = np.convolve(a, np.ones(k) / k, mode="same")
    e[:sec(skip)] = 0
    pk, pr = signal.find_peaks(e, distance=sec(gap), height=e.max() * 0.05)
    out = []
    for i in pk[np.argsort(pr["peak_heights"])[::-1]]:
        if len(out) >= n:
            break
        j = i  # back up to the transient's start
        while j > 0 and e[j - 1] > e[i] * 0.3 and i - j < sec(0.03):
            j -= 1
        if j < sec(pre) or j + sec(length) > len(x):
            continue
        out.append(fade(x[j - sec(pre): j + sec(length)], 0.002, length * 0.4))
    if not out:
        raise ValueError("no transients found")
    return out


def fit(x, n):
    """x cut or padded with silence to n samples"""
    return x[:n] if len(x) >= n else np.concatenate([x, np.zeros((n - len(x), x.shape[1]))])


def place_on(x, at, n, thresh=0.5):
    """x placed so its attack (where it first reaches `thresh` of its peak) lands at `at` seconds"""
    return place(x, at - onset(x, thresh), n)


def tone(f_hz, n, phase=0.0):
    """a sine whose frequency follows f_hz (a number or a per-sample array)"""
    f = np.broadcast_to(np.asarray(f_hz, float), (n,))
    return np.sin(phase + 2 * np.pi * np.cumsum(f) / SR)


OUT = {}


def put(name, y, keys, note, at=""):
    OUT[name] = (np.clip(y, -1, 1), keys, note, at)


def build():
    rng = np.random.default_rng(404)
    L3 = {k: B.load(k) for k in ("crack_a", "crack_b", "crack_c", "thunder_a", "hum_a", "hum_d", "engine_a", "rush_a",
                                 "jet_a", "torch_a", "power_a", "wind_a")}
    L = {k: load4(k) for k in META4}
    ship = B.ir(2.4, bright=0.35, seed=11, metal=0.25)
    small = B.ir(0.7, bright=0.5, seed=5)
    key = B.wav(os.path.join(B.REAL, "key.wav")); key2 = B.wav(os.path.join(B.REAL, "key-2.wav"))
    th = L3["thunder_a"]; s_on = loudest(th, 0.1) - 0.05  # the clap
    pw = L3["power_a"]; p0 = loudest(pw, 0.15)
    h = L3["hum_a"]

    # ================================================================ the ground opening
    # ---- 1518 the tremor: a deep earthquake rumble swelling, the keys rattling faster, grit trickling (to the blast)
    dur = frames(T["blast"] - T["tremor"]) + 0.4
    n = sec(dur)
    qb = L["quake_b"]; q0 = loudest(qb, 3.0)
    sub = fit(lp(speed(cut(qb, q0, q0 + dur * 0.8 + 0.1), 0.8), 160), n)
    qa = L["quake_a"]; a0 = loudest(qa, 2.5)
    mid = fit(bp(cut(qa, a0, a0 + dur), 60, 1400), n)
    swell = env_curve([(0, 0.0), (0.25, 0.35), (dur - 0.45, 1.0), (dur - 0.4, 1.0), (dur, 0.0)], n)
    rumble = (rms_to(sub, -18) + rms_to(mid, -24)) * swell
    rattle = np.zeros((n, 2))
    clicks = [fade(key, 0.0, 0.06), fade(key2, 0.0, 0.08)]  # v2's cut key presses (0.17 s, 0.22 s)
    t = 0.12
    while t < dur - 0.45:
        k = hp(speed(clicks[int(rng.integers(len(clicks)))], float(rng.uniform(0.9, 1.25))), 500)
        g = 0.15 + 0.85 * (t / dur) ** 1.4
        rattle += place(pan(fade(k, 0.001, 0.03), float(rng.uniform(-0.4, 0.4))) * g * float(rng.uniform(0.5, 1.0)), t, n)
        t += float(rng.uniform(0.35, 0.6) * (1 - 0.85 * t / dur) + 0.025)
    gr = L["gravel_a"]; g0 = loudest(gr, 1.2)
    grit = fit(hp(cut(gr, g0, g0 + dur), 700), n) * env_curve([(0, 0), (0.5, 0.3), (dur - 0.4, 1.0), (dur, 0)], n)
    y = peak_to(rumble, -3) + peak_to(rattle, -14) + peak_to(grit, -17)  # gravel is spiky: set by its peak
    put("ground-tremor", fade(peak_to(y, -2), 0.08, 0.35), ["quake_b", "quake_a", "key", "key-2", "gravel_a"],
        "the ground shaking: an earthquake's rumble at 0.8 speed swelling, the keys rattling faster, grit trickling",
        "cue at T.tremor (1518); swells to the blast at 1.60 s, gone by 1.95 s")

    # ---- 1530 the crack: the ground splitting (v3's: ice cracks slowed, soil cracking, a log's thud), light sizzling out
    # of it, and the ground's groan rising to the blast
    x = L3["crack_b"]; a = loudest(x, 0.8)
    ice = lp(speed(cut(x, max(0, a - 0.05), a + 1.35), 0.34), 7000)
    soil = lp(cut(L3["crack_a"], onset(L3["crack_a"]), onset(L3["crack_a"]) + 4.6), 5000)
    c = L3["crack_c"]; tt = loudest(c, 0.3)
    thud = lp(speed(cut(c, max(0, tt - 0.03), tt + 1.2), 0.5), 1800)
    up = frames(T["blast"] - T["crack"])  # 1.2 s to the blast
    n = sec(4.6)
    arc = L["arc_a"]; r0 = steadiest(arc, up + 0.2)
    sizzle = fit(hp(cut(arc, r0, r0 + up + 0.1), 1800), sec(up + 0.1)) * env_curve([(0, 0.25), (up, 1.0), (up + 0.06, 0)], sec(up + 0.1))
    tz = L["tesla_a"]; z0 = loudest(tz, up)
    crackle = fit(hp(cut(tz, z0, z0 + up + 0.1), 900), sec(up + 0.1)) * env_curve([(0, 0.0), (up * 0.5, 0.5), (up, 1.0), (up + 0.06, 0)], sec(up + 0.1))
    groan = lp(varispeed(cut(L["quake_a"], 2.0), [(0, 0.5), (up, 0.85)], sec(up + 0.1)), 500) * env_curve(
        [(0, 0.2), (up, 1.0), (up + 0.08, 0)], sec(up + 0.1))
    y = (place_on(peak_to(thud), 0.0, n) * 0.85 + place_on(peak_to(ice), 0.01, n) * 0.8 + place_on(peak_to(soil), 0.06, n) * 0.5
         + place(rms_to(sizzle, -24), 0.05, n) + place(rms_to(crackle, -27), 0.1, n) + place(rms_to(groan, -17), 0.0, n))
    put("ground-crack", fade(peak_to(y, -2), 0.002, 1.8), ["crack_b", "crack_a", "crack_c", "arc_a", "tesla_a", "quake_a"],
        "the ground splitting (ice cracks at 0.34 speed, soil cracking, a log's thud), electric sizzle and crackle leaking out "
        "of it and the ground's groan rising, all cut at the blast", "cue at T.crack (1530): hit at 0.00 s, the build stops at 1.20 s")

    # ---- 1566 the blast: a huge explosion's boom slowed and darkened, a punchy boom on top; stones and earth thrown,
    # then chunks landing all around (1572-1615) and splashing into the water; debris settling
    ba = L["boom_a"]; b_on = onset(ba, 0.1)
    big = speed(fade(cut(ba, b_on - 0.02, b_on + 1.85), 0.0, 0.5), 0.82)
    big = lp(big, 2600) + 0.8 * lp(big, 110)
    punch = lp(cut(L["boom_b"], 0, 2.1), 5000)
    sub = lp(speed(cut(L["boom_b"], 0, 2.1), 0.6), 150)
    whoomp = lp(speed(cut(th, s_on - 0.02, s_on + 1.6), 0.5), 900)
    thrown = cut(L["rock_d"], 0, 3.0)
    spill = cut(L["rock_c"], 0, 4.0)
    n = sec(5.5)
    y = (place_on(peak_to(big), 0.0, n) + place_on(peak_to(punch), 0.0, n) * 0.55 + place_on(peak_to(sub), 0.0, n) * 0.6
         + place_on(peak_to(whoomp), 0.0, n) * 0.45 + place_on(peak_to(thrown), 0.03, n) * 0.5
         + place_on(peak_to(spill), 0.12, n) * 0.4)
    pool = []
    for k_, nn in (("rock_a", 14), ("rock_b", 14), ("rock_e", 10), ("gravel_a", 8), ("crumble_a", 4)):
        pool += [(k_, hh) for hh in hits(L[k_], nn, gap=0.1, length=0.5)]
    order = rng.permutation(len(pool))
    landings = np.sort(np.concatenate([rng.normal(0.65, 0.22, 26), rng.uniform(0.2, 1.65, 14)]))
    landings = landings[(landings > 0.18) & (landings < 1.7)]
    for i, tl in enumerate(landings):
        _, hh = pool[order[i % len(pool)]]
        hh = speed(hh, float(rng.uniform(0.75, 1.05)))
        far = float(rng.uniform(0, 1))
        hh = lp(hh, 7000 - 5000 * far)
        g = (1.0 - 0.45 * far) * (1.0 - 0.35 * tl / 1.7) * float(rng.uniform(0.55, 1.0))
        y += place(pan(peak_to(hh), float(rng.uniform(-0.85, 0.85))) * g * 0.42, float(tl), n)
    splash = B.wav(os.path.join(B.REAL, "splash.wav"))
    for tl, p_, g in ((0.78, -0.5, 0.35), (1.05, 0.45, 0.3), (1.32, -0.1, 0.22)):
        y += place(pan(peak_to(speed(splash, float(rng.uniform(0.8, 1.0)))), p_) * g, tl, n)
    cr = L["crumble_a"]; c0 = loudest(cr, 1.5)
    settle = fit(hp(cut(cr, c0, c0 + 2.6), 300), sec(2.6)) * env_curve([(0, 0), (0.4, 1), (2.6, 0)], sec(2.6))
    gr2 = fit(hp(cut(gr, 6.0, 9.0), 500), sec(3.0)) * env_curve([(0, 0), (0.6, 1), (3.0, 0)], sec(3.0))
    y += place(peak_to(settle, -12), 1.4, n) + place(peak_to(gr2, -16), 1.6, n)  # spiky: set by their peaks
    put("ground-blast", fade(peak_to(y, -1.5), 0.002, 1.6),
        ["boom_a", "boom_b", "thunder_a", "rock_d", "rock_c", "rock_a", "rock_b", "rock_e", "gravel_a", "crumble_a", "splash"],
        "the bank blows open: a huge explosion at 0.82 speed darkened, a boom on top, stones thrown, then chunks landing all "
        "round (stone, rockfall and gravel impacts at random, near and far) and splashing in the water; debris settling",
        "cue at T.blast (1566): the boom at 0.00 s, chunks land 0.2-1.7 s")

    # ================================================================ the beam
    # ---- 1570-1586 the charge and the ignition: a tesla coil's rising scream, a transformer whining up and a synth
    # sweep into a high-voltage discharge, a zap, a thunder snap, a light's thud (hit at 0.533 s)
    ch = frames(T["beam"] - (T["blast"] + 4))  # 0.533 s
    n = sec(3.6)
    tu = L["tesla_up"]; u0 = loudest(tu, 2.0)
    scream = bp(varispeed(cut(tu, max(0, u0 - 3.0)), [(0, 0.7), (ch, 1.6)], sec(ch)), 300, 9000)
    whine = varispeed(cut(h, 1.0), [(0, 0.5), (ch, 1.8)], sec(ch))
    f_sw = 260 * (2400 / 260) ** ((np.arange(sec(ch)) / sec(ch)) ** 1.6)
    sweep = (tone(f_sw, sec(ch)) + 0.3 * tone(f_sw * 2.01, sec(ch)))[:, None] * np.ones((1, 2))
    rise_env = env_curve([(0, 0.0), (ch * 0.6, 0.45), (ch, 1.0)], sec(ch))
    charge = (rms_to(scream, -20) + rms_to(whine, -24) + rms_to(sweep, -30)) * rise_env
    hv = L["hv_a"]; v0 = loudest(hv, 0.25)
    disch = cut(hv, max(0, v0 - 0.05), v0 + 1.6)
    zp = L["zap_a"]; zz = loudest(zp, 0.3)
    zap = cut(zp, max(0, zz - 0.04), zz + 0.9)
    snap = hp(cut(th, s_on - 0.005, s_on + 0.3), 1500)
    thunk = lp(speed(cut(pw, p0 - 0.04, p0 + 0.8), 0.6), 2500)
    whoomp = lp(speed(cut(th, s_on - 0.02, s_on + 1.6), 0.5), 900)
    y = (place(charge, 0.0, n) + place_on(peak_to(disch), ch, n) * 0.75 + place_on(peak_to(zap), ch, n) * 0.5
         + place_on(peak_to(snap), ch, n) * 0.35 + place_on(peak_to(thunk), ch, n) * 0.7 + place_on(peak_to(whoomp), ch, n) * 0.85)
    put("beam-ignite", fade(peak_to(y, -1.5), 0.02, 1.0), ["tesla_up", "hum_a", "hv_a", "zap_a", "thunder_a", "power_a"],
        "the beam's charge and ignition: a tesla coil rising, a transformer whining up and a synth sweep (made) into a "
        "high-voltage discharge, a zap, a thunder snap and a light's thud", "cue at T.blast+4 (1570): the hit at 0.533 s (T.beam)")

    # ---- 1586-1710 the beam standing: a thick pitched core on A (made: harmonics of 55 Hz, two copies a beat apart,
    # through a slowly sweeping comb), a tesla coil's buzz and sparks and a transformer under it; from the rise (1620)
    # it climbs a fourth and opens up as the camera rides it into the white; cut dead as space opens
    dur = frames(T["orbit"] - T["beam"])
    n = sec(dur)
    tt_ = np.arange(n) / SR
    rise_at = frames(T["rise"] - T["beam"])
    climb = np.interp(tt_, [0, rise_at, dur], [0, 0, 1]) ** 1.5
    f0 = 55.0 * 2 ** (5 / 12 * climb)
    core = np.zeros(n)
    for k in range(1, 13):
        core += (1 / k) * (tone(f0 * k, n) + tone(f0 * k * 1.004 + 0.31, n, phase=k))
    sweep_hz = 180 + 140 * np.sin(2 * np.pi * 0.23 * tt_)  # the comb's tuning sweeping: the beam's slow phasing
    out = np.zeros(n)
    delay = (SR / sweep_hz)
    idx = np.arange(n) - delay
    i0 = np.clip(np.floor(idx).astype(int), 0, n - 1); fr = idx - np.floor(idx)
    out = core + 0.75 * (core[i0] * (1 - fr) + core[np.clip(i0 + 1, 0, n - 1)] * fr)
    bright = 400 + 5600 * climb
    lo = lp(out[:, None], 600)[:, 0]
    hi = hp(out[:, None], 600)[:, 0] * np.clip((bright - 400) / 5600 + 0.25, 0, 1)
    core2 = (lo + hi)[:, None] * np.ones((1, 2))
    core2 = core2 * (1 + 0.15 * np.sin(2 * np.pi * np.array([3.1, 3.4]) * tt_[:, None]))  # a shimmer in it, L and R apart
    tz0 = steadiest(tz, dur)
    buzz = fit(bp(cut(tz, tz0, tz0 + dur), 90, 8000), n)
    hum = varispeed(cut(h, 0.5), [(0, 0.9), (rise_at, 0.9), (dur, 1.3)], n)
    sparks = fit(hp(cut(arc, 0.0, dur), 1500), n) * env_curve([(0, 1.0), (dur, 0.6)], n)
    swell = env_curve([(0, 1.0), (0.4, 0.75), (rise_at, 0.7), (dur - 0.15, 1.0), (dur, 1.0)], n)
    y = (rms_to(core2, -20) + rms_to(buzz, -25) + rms_to(hum, -27) + rms_to(sparks, -33)) * swell
    put("beam-sustain", fade(peak_to(y, -3), 0.06, 0.03), ["tesla_a", "hum_a", "arc_a"],
        "the beam standing: a pitched core on A (made), phasing; a tesla coil's buzz, a transformer, sparks; climbing a "
        "fourth and opening up from the rise; cut as space opens", "cue at T.beam (1586), len to T.orbit (1710)")

    # ---- 1710-1776 in orbit, the beam's head racing straight up to the ship: v3's climbing hum and rush, a tesla
    # coil's scream accelerating and a phasing whoosh, a made glide from A2 up two octaves, into the strike
    dur = frames(T["strike"] - T["orbit"])
    n = sec(dur)
    a_ = varispeed(cut(h, 6.0), [(0, 0.8), (dur, 1.7)], n)
    b_ = varispeed(cut(L3["rush_a"], 12.0), [(0, 0.8), (dur, 1.4)], n)
    sc = bp(varispeed(cut(tu, max(0, u0 - 6.0)), [(0, 0.8), (dur, 2.1)], n), 400, 9000)
    wa = L["whoosh_a"]; wp = loudest(wa, 0.1) + 0.05
    wh = place(speed(cut(wa, wp - 1.0, wp + 0.02), 0.6), dur - 1.7, n)
    fg = 110 * 4 ** ((np.arange(n) / n) ** 1.8)
    glide = (tone(fg, n) + 0.4 * tone(fg * 1.5, n) + 0.25 * tone(fg * 2.003, n))[:, None] * np.ones((1, 2))
    y = (rms_to(a_, -24) + rms_to(b_, -28) + rms_to(sc, -28) + rms_to(glide, -31)) * env_curve(
        [(0, 0.3), (dur * 0.6, 0.6), (dur, 1.0)], n) + peak_to(wh, -14)
    put("beam-race", fade(peak_to(bp(y, 50, 12000), -3), 0.3, 0.02), ["hum_a", "rush_a", "tesla_up", "whoosh_a"],
        "the beam's head racing straight up to the ship: a hum and rush climbing, a tesla coil's scream accelerating, a "
        "phasing whoosh, a made glide up two octaves, cut into the strike", "cue at T.orbit (1710), len to T.strike (1776)")

    # ================================================================ the arrival
    # ---- the review room's hum, from the arrival to the end card (v3's recipe, longer)
    dur = frames(T["end"] - T["arrive"]) + 1.0
    s0 = min(steadiest(h, dur), len(h) / SR - dur - 0.1)
    a_ = fit(lp(cut(h, s0, s0 + dur), 2500), sec(dur))
    e = L3["engine_a"]
    b_ = fit(lp(speed(cut(e, 4.0, 4.0 + dur * 0.5 + 0.2), 0.5), 400), sec(dur))
    y = rms_to(a_, -32) + rms_to(b_, -36)
    put("room-tone-v4", fade(rms_to(y, -30), 0.03, 1.0), ["hum_a", "engine_a"],
        "the review room: a transformer's hum in a large room, an engine an octave down", "cue at T.arrive (1890), len to T.end")

    # ---- 1906 the review link lands on the room's screen: an alien chime (made: two inharmonic bell tones rising, a
    # soft low swell under them as the screen wakes), in the hall
    n = sec(3.0)
    tt_ = np.arange(n) / SR
    def bell(f, at, dur, g):
        m = np.zeros(n); i = sec(at); k = min(n - i, sec(dur))
        t_ = np.arange(k) / SR
        mod = 1.9 * np.exp(-t_ * 3.0) * np.sin(2 * np.pi * f * 1.41 * t_)
        m[i:i + k] = g * np.sin(2 * np.pi * f * t_ + mod) * np.exp(-t_ * 2.2) * (1 - np.exp(-t_ * 400))
        return m
    chime = bell(659.0, 0.0, 2.5, 1.0) + bell(987.0, 0.16, 2.5, 0.8) + bell(1318.0, 0.32, 2.2, 0.35)
    low = np.sin(2 * np.pi * 110 * tt_) * np.interp(tt_, [0, 0.3, 1.2, 3.0], [0, 0.5, 0.35, 0])
    y = np.stack([chime * 0.9 + low, chime + low], 1)
    y = B.verb(y, ship, 0.45, tail=0.0)[:n]
    put("link-chime", fade(peak_to(y, -3), 0.002, 1.2), [], "the review link arriving on the room's screen: an alien chime (made) in the hall",
        "cue at T.linkIn (1906): the first tone at 0.00 s")

    # ---- 1926-2000 the aliens walking in to their seats: muffled footsteps on metal, slowed (heavier, lower), each
    # alien its own speed and side; a chair's creak as each sits
    steps = hits(L["step_b"], 10, gap=0.25, length=0.45) + hits(L["step_a"], 8, gap=0.25, length=0.45)
    t_last = max(f0_ + (STEPS - 1) * STEP + SIT for _, f0_ in WALK)
    n = sec(frames(t_last - T["arrive"]) + 2.2)
    ca = L["chair_a"]
    creaks = hits(ca, 6, gap=0.6, length=1.1, pre=0.05)
    y = np.zeros((n, 2))
    for w, (head, f0_) in enumerate(WALK):
        rate = [0.72, 0.68, 0.76, 0.7][w]
        for s in range(STEPS):
            st = steps[(w * STEPS + s) % len(steps)]
            st = lp(speed(st, rate * float(rng.uniform(0.97, 1.03))), 3200)
            g = (0.65 + 0.35 * s / (STEPS - 1)) * float(rng.uniform(0.85, 1.0))
            y += place(pan(peak_to(st), HEAD_PAN[head]) * g, frames(f0_ + s * STEP - T["arrive"]), n)
        cr_ = lp(speed(creaks[w % len(creaks)], 0.85), 5000)
        y += place(pan(peak_to(cr_), HEAD_PAN[head]) * 0.5, frames(f0_ + (STEPS - 1) * STEP + SIT - T["arrive"]) - 0.05, n)
    y = B.verb(y, ship, 0.3, tail=0.0)[:n]
    put("alien-steps", fade(peak_to(y, -3), 0.002, 0.8), ["step_b", "step_a", "chair_a"],
        "the aliens walking in: muffled footsteps on metal at 0.68-0.76 speed, each alien from its side, a step every "
        "14 frames, and a chair's creak at 0.85 speed as each sits (timeline WALK)", "cue at T.arrive (1890)")

    # ================================================================ the fish (components/fish.tsx: 1.7 m from the
    # camera, a little right of centre; out at 836, back in nose first at 851, its crown of drops to about 858)
    FISH_PAN = 0.22
    fc = L["fish_c"]; c0 = onset(fc, 0.1)
    out_ = cut(fc, max(0, c0 - 0.02), c0 + 1.2)
    fa = L["fish_a"]; a0 = onset(fa, 0.1)
    out2 = cut(fa, max(0, a0 - 0.02), a0 + 0.6)
    n = sec(1.4)
    y = place(peak_to(out_), 0.0, n) + place(peak_to(out2), 0.0, n) * 0.35
    put("fish-out", fade(peak_to(pan(y, FISH_PAN), -4), 0.002, 0.5), ["fish_c", "fish_a"], "a fish leaving the water: a tiny splash",
        "cue at T.fishOut (836): the splash at 0.02 s")
    fb = L["fish_b"]; b0 = loudest(fb, 0.15)
    plop = cut(fb, max(0, b0 - 0.08), b0 + 1.6)
    drop = B.wav(os.path.join(B.REAL, "drop.wav"))
    n = sec(1.8)
    y = place(peak_to(plop), 0.0, n) + place(peak_to(drop), 0.07, n) * 0.45
    put("fish-in", fade(peak_to(pan(y, FISH_PAN), -3), 0.002, 0.6), ["fish_b", "drop"], "the fish dropping back in: a fish's splash and a plop",
        "cue at T.fishIn-2 (849): the splash at 0.08 s")

    # ================================================================ the ravens (components/birds.tsx, 15-leaves
    # 896-940): the flock drops out of the big crown from 898 and streams left over the monitor, more lift off the
    # crowns behind, a pair crosses close from right to left (nearest about 925), and they call as they go
    def balance(x, p):
        """a stereo recording tilted toward p (-1 left .. 1 right), keeping its width; p a number or per-sample array"""
        p = np.broadcast_to(np.asarray(p, float), (len(x),))[:, None]
        return x * np.concatenate([np.sqrt(1 - 0.6 * p), np.sqrt(1 + 0.6 * p)], 1)
    n = sec(3.6)
    fa_ = L["flap_a"]; a0 = onset(fa_, 0.2)
    flock = speed(cut(fa_, max(0, a0 - 0.03), a0 + 4.0), 0.86)  # pigeons a size up: ravens' slower, deeper beat
    flock = balance(flock, np.interp(np.arange(len(flock)) / SR, [0, 1.5, 3.5], [0.25, -0.2, -0.5]))
    fd_ = L["flap_d"]; d1 = onset(cut(fd_, 3.8, 7.0), 0.2) + 3.8  # the doves' second burst
    more = lp(speed(cut(fd_, max(0, d1 - 0.03), d1 + 2.4), 0.9), 4500)  # farther: duller
    fb_ = L["flap_b"]; b0 = loudest(fb_, 0.15)
    close = speed(cut(fb_, max(0, b0 - 1.0), b0 + 1.8), 0.9)
    c_pk = loudest(close, 0.15)
    close = pan(close, np.interp(np.arange(len(close)) / SR, [0, c_pk - 0.5, c_pk + 0.6, c_pk + 1.5], [0.8, 0.6, -0.5, -0.7]))
    ca = hp(L["caw_a"], 250)
    croaks = hits(ca, 3, gap=0.35, pre=0.02, length=0.55)
    # the flush: the doves' first burst, loudest at the start, so the scare lands on the frame the first birds go
    d0 = onset(cut(fd_, 0.4, 3.0), 0.2) + 0.4
    flush = speed(cut(fd_, max(0, d0 - 0.02), d0 + 1.4), 0.9)
    flush = balance(flush, 0.3)
    y = place(peak_to(flock), 0.05, n)
    y += place(peak_to(flush), 0.0, n) * 0.8
    y += place(peak_to(more), 0.3, n) * 0.4
    y += place(peak_to(close), 0.9 - c_pk, n) * 0.5
    for (at, g, p, dull), c in zip([(0.45, 0.42, -0.1, 0), (1.0, 0.32, 0.2, 0), (1.75, 0.22, -0.45, 3500)], croaks):
        c = pan(c, p)
        y += place(peak_to(lp(c, dull) if dull else c), at, n) * g
    # wingbeats are all transient (26 dB from peak to RMS), so under the canopy's swell they vanish before they're loud
    # enough: a compressor that catches each transient at once (80 ms release, 4:1 over 24 dB under the peak) brings the
    # flutter up to them
    y = peak_to(y, 0)
    a_ = np.abs(y).max(1)
    env = np.zeros_like(a_)
    kr = np.exp(-1 / (0.08 * SR))
    e_ = 0.0
    for i, v in enumerate(a_):
        e_ = max(v, kr * e_)
        env[i] = e_
    th = 10 ** (-24 / 20)
    gain = np.where(env > th, (np.maximum(env, 1e-9) / th) ** (1 / 4 - 1), 1.0)
    y = y * gain[:, None]
    put("birds-flee", fade(peak_to(y, -3), 0.003, 1.0), ["flap_a", "flap_d", "flap_b", "caw_a"],
        "the ravens scared out of the trees: a flush of doves' wings at the start, a flock's take-off a size down (0.86 "
        "speed) drifting left, the doves' second burst behind it, duller, a close take-off crossing right to left, "
        "peaking at 0.90 s, and three raven croaks; compressed 4:1",
        "cue at 897: the first wingbeats at 0.03 s, the close pair's loudest at 0.90 s")

    # ================================================================ the end
    # ---- 2325-2440 the robot's thruster: a blowtorch's flame swelling to the lens and away, closest at T.pass, panned
    # left to right through the middle as it passes, duller and fainter as it climbs to the ship; a jet's pass under it
    to = L3["torch_a"]; s0 = steadiest(cut(to, 8.0, 40.0), 5.5) + 8.0
    dur = frames(T["tilt"] + 15 - T["end"])
    n = sec(dur)
    loc = np.arange(n) / SR * FPS
    pc = T["pass_"] - T["end"]
    d = np.where(loc <= pc, 1.2 + (pc - loc) * 0.11, 1.2 * np.exp((loc - pc) / 22))
    g = np.clip(1.2 / d, 0, 1)[:, None]
    p = np.clip(np.where(loc <= pc, -0.9 + 0.9 * loc / pc, 0.75 * (1 - np.exp(-(loc - pc) / 8))), -1, 1)
    fl = fit(cut(to, s0, s0 + dur), n)
    near = pan(fl, p) * g
    dull = lp(near, 900)
    mixw = np.clip(np.log10(d / 1.2) / 1.4, 0, 1)[:, None]
    y = near * (1 - mixw) + dull * mixw
    put("thruster-v4", fade(peak_to(y, -3), 0.3, 0.6), ["torch_a"],
        "the robot's thruster: a blowtorch's flame, its level and pan along the robot's path, closest at T.pass, away to "
        "the ship", "cue at T.end (2325): closest at 0.90 s (T.pass)")

    # ---- the woosh as it passes the lens: a phasing whoosh's peak and an arrow's flyby, panned left to right fast
    wa = L["whoosh_a"]; w0 = loudest(wa, 0.5)
    w1 = cut(wa, max(0, w0 - 1.0), w0 + 0.9)
    wb_ = L["whoosh_b"]
    jet = L3["jet_a"]; j0 = loudest(jet, 0.6)
    jp = lp(speed(cut(jet, max(0, j0 - 0.8), j0 + 0.8), 1.6), 6000)
    n = sec(2.0)
    y = place(peak_to(w1), 0.0, n) + place(peak_to(wb_), 0.95, n) * 0.5 + place(peak_to(jp), 1.0 - 0.8 / 1.6, n) * 0.4
    pp = np.interp(np.arange(n) / SR, [0, 0.8, 1.0, 1.25, 2.0], [-0.85, -0.6, 0.0, 0.6, 0.8])
    y = pan(y, pp)
    pk = loudest(y, 0.1) + 0.05  # its loudest moment onto 1.00 s
    y = place(y, 1.0 - pk, n)
    put("robot-woosh", fade(peak_to(y, -2), 0.15, 0.5), ["whoosh_a", "whoosh_b", "jet_a"],
        "the robot past the lens: a phasing whoosh's peak, an arrow's flyby and a jet's pass, sweeping left to right",
        "cue at T.pass-30 (2322): the peak at 1.00 s")

    # ---- 2364 the robot's sad warble (made): a droid's voice of FM chirps, each sliding down, ring-modulated, then a
    # long descending whistle with a sigh's vibrato; dry, a little of a small room
    n = sec(1.9)
    tt_ = np.arange(n) / SR
    v = np.zeros(n)
    def chirp(at, dur, f_a, f_b, g, mod=0.0):
        i = sec(at); k = sec(dur); t_ = np.arange(k) / SR
        f = f_a * (f_b / f_a) ** (t_ / dur)
        car = tone(f + mod * 40 * np.sin(2 * np.pi * 28 * t_), k)
        env = np.sin(np.pi * np.clip(t_ / dur, 0, 1)) ** 0.6
        v[i:i + k] += g * car * env
    chirp(0.00, 0.11, 1450, 1180, 0.7, 1.0)
    chirp(0.14, 0.09, 1600, 1300, 0.6, 1.0)
    chirp(0.27, 0.16, 1250, 900, 0.75, 0.5)
    k0 = sec(0.48); kk = sec(1.25); t_ = np.arange(kk) / SR
    f = 1150 * (430 / 1150) ** ((t_ / 1.25) ** 0.8) * (1 + 0.025 * np.sin(2 * np.pi * 5.2 * t_) * np.clip(t_ / 0.4, 0, 1))
    env = np.clip(t_ / 0.05, 0, 1) * np.clip((1.25 - t_) / 0.45, 0, 1) ** 1.5
    v[k0:k0 + kk] += 0.9 * tone(f, kk) * env
    ring = v * (0.75 + 0.25 * np.sin(2 * np.pi * 62 * tt_))
    y = np.stack([ring, ring], 1)
    y = B.verb(lp(y, 6500), small, 0.18, tail=0.0)[:n]
    put("droid-sad", fade(peak_to(y, -4), 0.003, 0.25), [],
        "the robot's sad warble (made): three FM chirps sliding down, then a long whistle falling from 1150 to 430 Hz "
        "with a sigh's vibrato, ring-modulated at 62 Hz", "cue at T.sad (2364): the first chirp at 0.00 s")


def write():
    os.makedirs(FX, exist_ok=True)
    rows = []
    used = set()
    for name, (y, keys, note, at) in OUT.items():
        sf.write(os.path.join(FX, name + ".wav"), y, SR, subtype="PCM_16")
        rms = np.sqrt(np.mean(y ** 2))
        rows.append((name, note, at, len(y) / SR, B.db(np.abs(y).max()), B.db(rms), ", ".join(keys) or "made here"))
        used.update(keys)
    with open(os.path.join(V4, "INDEX.md"), "w") as f:
        f.write("# v4 sound effects\n\nCut and worked by scripts/sfx_build_v4.py from CC0 recordings (SOURCES.md), or made "
                "there where it says so. 48 kHz stereo 16-bit, in fx/.\n\n")
        f.write("| file | what | where | seconds | peak dBFS | RMS dBFS | source |\n|---|---|---|---|---|---|---|\n")
        for r in rows:
            f.write("| fx/%s.wav | %s | %s | %.2f | %.1f | %.1f | %s |\n" % r)
    with open(os.path.join(V4, "SOURCES.md"), "w") as f:
        f.write("# Sources\n\nEvery recording the v4 effects use, all from freesound.org, each checked as CC0 1.0 (public "
                "domain dedication) on its page when fetched (2026-11-16; meta.jsonl in each folder holds the page's licence "
                "links, and this script re-checks them). v4's new ones are in assets/audio/v4/src; the rest are v3's and v2's "
                "(key, key-2, splash and drop are v2's cut files of key_d, key_c, drop_c and drop_a).\n\n")
        f.write("| key | title | author | page | licence | folder |\n|---|---|---|---|---|---|\n")
        real = {"key": "key_d", "key-2": "key_c", "drop": "drop_a", "splash": "drop_c"}  # v2's cut files: their sources
        for k in sorted({real.get(k, k) for k in used}):
            m = META4.get(k) or B.META[k]
            lic = m.get("licence") or m.get("licenses") or []
            assert any("publicdomain/zero/1.0" in u for u in lic), (k, lic)
            f.write("| %s | %s | %s | %s | CC0 1.0 | %s |\n" % (k, m["title"].replace("|", "/"), m["author"], m["page"],
                                                              os.path.relpath(m["dir"], PROJ)))
        f.write("\nMade here (no recording): the beam's pitched core and charge sweep, the glide in beam-race, the "
                "link chime, the droid's warble.\n")
    for r in rows:
        print("%-16s %5.2f s  peak %6.1f  rms %6.1f" % (r[0], r[3], r[4], r[5]))


if __name__ == "__main__":
    build()
    write()
