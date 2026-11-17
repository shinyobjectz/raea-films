#!/usr/bin/env python3
"""The aliens' voices: a language of their own, made the way film languages are, from real recordings. Speech in three
languages, two takes of gibberish and a deep mumble (assets/audio/v3/voice-src, CC0, fetched by scripts/sfx_fetch.py
from scripts/voice_candidates_v3.tsv) is cut into syllables, re-sequenced into words nobody speaks, deepened (which
lowers its throat with its pitch: a bigger body), paced back to speech, doubled a fifth up under it (two voices from
one throat), with throat clicks between words. No two aliens share a source or a pitch.

Writes, 48 kHz stereo 16-bit:
  assets/audio/v3/fx/alien-mutter.wav   the typist reading its note under its breath as it types (cue T.alienFrom-4)
  assets/audio/v3/fx/alien-keys.wav     a key's click at each press, the presses on the mutter's syllables (same cue)
  assets/audio/v3/fx/alien-chatter.wav  the room after the wow: four voices, each panned to its head (cue T.wow+22)
  assets/audio/v3/fx/alien-hmm.wav      one of them, unsure, as the note posts (cue T.notePost+3)
and components/room-voice.ts: each voice's loudness a frame (0..1) from its cue, and the typing's presses, which the
room's animation reads, so what moves is what's heard.

  /tmp/ivyenv/bin/python -I scripts/alien_voice_v3.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
import soundfile as sf
from scipy import signal
import sfx_build_v3 as B  # its helpers (load, speed, verb, pan...): it builds nothing on import

SR, FPS = B.SR, B.FPS
sec, frames = B.sec, B.frames
PROJ = B.PROJ
VSRC = os.path.join(PROJ, "assets", "audio", "v3", "voice-src")
FX = B.FX
TS_OUT = os.path.join(PROJ, "components", "room-voice.ts")

# the film's frames these are cued at (components/timeline.ts T)
T = dict(wow=2072, alienFrom=2146, alienTo=2196, notePost=2218, hands=2140)
CUE = dict(mutter=T["alienFrom"] - 4, chatter=T["wow"] + 22, hmm=T["notePost"] + 3)

META = {}
for l in open(os.path.join(VSRC, "meta.jsonl")):
    m = json.loads(l)
    if m.get("ok"):
        META[m["key"]] = m


def vload(key):
    m = META[key]
    x, sr = sf.read(os.path.join(VSRC, m["file"]), always_2d=True)
    x = B.to48(x, sr).mean(1)
    x = signal.sosfiltfilt(B.sos("highpass", 60), x)
    return x - x.mean()


# ---------------------------------------------------------------- cutting speech into syllables
def envelope(x, win=0.012, hop=0.005):
    w, h = sec(win), sec(hop)
    n = 1 + max(0, (len(x) - w) // h)
    e = np.array([np.sqrt(np.mean(x[i * h:i * h + w] ** 2)) for i in range(n)])
    return signal.savgol_filter(e, 9, 2) if len(e) > 9 else e, h


def syllables(x, lo=0.07, hi=0.36, floor_db=-32):
    """the syllables: the stretches between the envelope's dips, each with one loud nucleus"""
    e, h = envelope(x)
    top = e.max()
    loud = e > top * 10 ** (floor_db / 20)
    peaks, _ = signal.find_peaks(e, height=top * 10 ** (-22 / 20), distance=int(0.09 / 0.005), prominence=top * 0.05)
    out = []
    for i, p in enumerate(peaks):
        a = peaks[i - 1] if i else max(0, p - int(0.2 / 0.005))
        b = peaks[i + 1] if i + 1 < len(peaks) else min(len(e) - 1, p + int(0.2 / 0.005))
        s = a + int(np.argmin(e[a:p + 1])) if p > a else a
        t = p + int(np.argmin(e[p:b + 1])) if b > p else b
        while s < p and not loud[s]:
            s += 1
        while t > p and not loud[t]:
            t -= 1
        d = (t - s) * h / SR
        if lo <= d <= hi:
            out.append(x[s * h:t * h + sec(0.012)].copy())
    return out


def stretch(x, ratio, frame=0.03, search=0.006):
    """WSOLA: `ratio` times as long, the pitch kept (a grain's worth of phasiness, which suits a throat that isn't ours)"""
    N, Ha, S = sec(frame), sec(frame) // 2, sec(search)
    Hs = int(round(Ha * ratio))
    win = np.hanning(N)
    n_out = int(len(x) * ratio) + N
    y, wsum = np.zeros(n_out + 2 * N), np.zeros(n_out + 2 * N)
    xp = np.concatenate([x, np.zeros(N + 2 * S + Ha)])
    pos_in, prev = 0.0, None
    for k in range(n_out // Hs):
        c = int(pos_in)
        if prev is not None and c > S:
            best, bi = -1e9, 0
            seg = xp[c - S:c + S + N]
            for d in range(0, 2 * S, 8):
                v = float(np.dot(seg[d:d + N], prev))
                if v > best:
                    best, bi = v, d
            c = c - S + bi
        g = xp[c:c + N]
        if len(g) < N:
            break
        o = k * Hs
        y[o:o + N] += g * win
        wsum[o:o + N] += win
        prev = xp[c + Ha:c + Ha + N]
        pos_in += Ha
        if pos_in >= len(x):
            break
    return (y / np.maximum(wsum, 1e-3))[: int(len(x) * ratio)]


def deepen(x, rate):
    """`rate` < 1: its pitch and its throat lower together (a bigger body), then paced back to speech"""
    return stretch(B.speed(x[:, None], rate)[:, 0], rate)


def fades(x, a=0.006, b=0.012):
    x = x.copy()
    na, nb = min(len(x) // 3, sec(a)), min(len(x) // 3, sec(b))
    x[:na] *= np.linspace(0, 1, na)
    x[-nb:] *= np.linspace(1, 0, nb)
    return x


# ---------------------------------------------------------------- the voices
class Voice:
    def __init__(self, name, keys, rate, seed, fifth=0.16, clicks=0.5, creature=None):
        self.name, self.rate, self.fifth, self.clicks = name, rate, fifth, clicks
        self.rng = np.random.default_rng(seed)
        pool = []
        for k in keys:
            pool += syllables(vload(k))
        if len(pool) < 12:
            raise SystemExit(f"{name}: only {len(pool)} syllables")
        # loudness-matched, so no word jumps out
        self.pool = [s / max(1e-6, np.sqrt(np.mean(s ** 2))) * 0.1 for s in pool]
        self.creature = creature

    def word(self, n):
        sy = [self.pool[i] for i in self.rng.choice(len(self.pool), n, replace=False)]
        out = np.zeros(0)
        for s in sy:
            s = fades(s)
            xf = min(sec(0.01), len(out), len(s))
            if xf:
                out[-xf:] += s[:xf]
                out = np.concatenate([out, s[xf:]])
            else:
                out = np.concatenate([out, s])
        return out

    def line(self, words, gap=(0.05, 0.16), stress=None):
        """`words`: syllables a word; stress: which word lands heavier (a falling last syllable stretched)"""
        out, onsets = np.zeros(0), []
        for i, n in enumerate(words):
            w = self.word(n)
            if i == len(words) - 1:
                w = np.concatenate([w[: len(w) // 2], stretch(w[len(w) // 2:], 1.35)])
            if stress is not None and i == stress:
                w = w * 1.4
            onsets.append(len(out))
            out = np.concatenate([out, w])
            if i < len(words) - 1:
                g = np.zeros(sec(self.rng.uniform(*gap)))
                if self.rng.random() < self.clicks:
                    c = CLICKS[self.rng.integers(len(CLICKS))]
                    c = c[: len(g)] if len(c) > len(g) else c
                    g[: len(c)] += c * self.rng.uniform(0.5, 0.9)
                out = np.concatenate([out, g])
        return out, onsets

    def speak(self, x):
        """through this one's throat: deepened, a second voice a fifth up under it, a hollow in the throat"""
        y = deepen(x, self.rate)
        up = deepen(x, self.rate * 1.5)
        n = min(len(y), len(up))
        y = y[:n] + self.fifth * up[:n]
        y = 0.75 * y + 0.25 * B.comb(y[:, None], 95.0 / self.rate, 0.35)[:, 0]
        if self.creature is not None:
            # a creature's call under the stressed syllables, an octave down, very low
            e, h = envelope(y)
            ee = np.repeat(e / max(1e-9, e.max()), h)
            n = min(len(y), len(ee), len(self.creature))
            y[:n] += self.creature[:n] * ee[:n] * 0.18
        return y


def clicks_from(x):
    """single throat clicks: short loud transients"""
    e, h = envelope(x, 0.004, 0.002)
    pk, _ = signal.find_peaks(e, height=e.max() * 0.25, distance=int(0.12 / 0.002))
    out = []
    for p in pk[:40]:
        c = x[max(0, p * h - sec(0.008)): p * h + sec(0.07)]
        out.append(fades(c / max(1e-6, np.abs(c).max()) * 0.25, 0.002, 0.03))
    return out


def per_frame(y, from_frame=0):
    """loudness a frame (RMS over the frame), 0..1 against its own loud end"""
    n = int(np.ceil(len(y) / SR * FPS))
    v = np.array([np.sqrt(np.mean(y[int(i * SR / FPS):int((i + 1) * SR / FPS)] ** 2)) if int(i * SR / FPS) < len(y) else 0 for i in range(n)])
    top = np.percentile(v[v > 0], 97) if np.any(v > 0) else 1
    return np.clip(v / max(top, 1e-9), 0, 1)


def stereo(y, p):
    return B.pan(np.repeat(y[:, None], 2, 1), p)


# ---------------------------------------------------------------- build
CLICKS = []


def main():
    global CLICKS
    CLICKS = clicks_from(vload("click_a"))
    ship = B.ir(2.8, metal=0.25, seed=5)
    small = B.ir(0.35, bright=0.35, seed=8)
    seal = vload("seal_a")
    seal = B.speed(seal[:, None], 0.5)[:, 0]
    camel = B.speed(vload("camel_a")[:, None], 0.6)[:, 0]

    voices = {
        "typist": Voice("typist", ["mumble_a", "lang_de"], 0.8, 11, fifth=0.12, clicks=0.35),
        "h0": Voice("h0", ["lang_pt"], 0.78, 21, creature=seal[sec(3):]),
        "h1": Voice("h1", ["lang_fr"], 0.9, 31),
        "h2": Voice("h2", ["gib_a"], 0.86, 41, creature=camel[sec(2):]),
        "h3": Voice("h3", ["gib_b"], 1.02, 51),
    }

    # ---- the typist: its note, under its breath, as it types (nine words, the last on the send)
    ty = voices["typist"]
    raw, ons = ty.line([2, 1, 3, 2, 1, 1, 3, 2, 2], gap=(0.03, 0.09), stress=8)
    y = ty.speak(raw)
    # evened out, as a voice under its breath is: no syllable jumps out
    y = np.tanh(2.2 * y / np.abs(y).max()) / np.tanh(2.2)
    dur = frames(T["alienTo"] + 8 - CUE["mutter"])
    if len(y) > sec(dur):
        y = stretch(y, sec(dur) / len(y))
    y = B.peak_to(y[:, None], -3)[:, 0]
    y = fades(y, 0.03, 0.12)
    mutter = B.verb(stereo(B.lp(y[:, None], 7000)[:, 0], -0.05), small, 0.18, tail=0.3)
    sf.write(os.path.join(FX, "alien-mutter.wav"), np.clip(mutter, -1, 1), SR, subtype="PCM_16")
    m_env = per_frame(y)
    # the presses: on the mutter's syllables (its envelope's rises), at least 3 frames apart, from T.alienFrom
    e = m_env
    rises = [i for i in range(1, len(e) - 1) if e[i] > 0.35 and e[i] - e[i - 1] > 0.12 and e[i] >= e[i + 1] - 0.05]
    press = []
    for i in rises:
        f = CUE["mutter"] + i
        if f < T["alienFrom"] or f > T["alienTo"] - 2:
            continue
        if press and f - press[-1] < 3:
            continue
        press.append(f)
    # fingers in turn across both hands, never the same finger twice running
    order = [(0, 0), (1, 1), (0, 1), (1, 0), (0, 2), (1, 2), (0, 0), (1, 1), (0, 1), (1, 3), (1, 0), (0, 2), (1, 1), (0, 1), (1, 2), (0, 0), (1, 0), (0, 2), (1, 1), (0, 1)]
    typing = [[f, *order[i % len(order)]] for i, f in enumerate(press)]
    send = T["alienTo"] + 3

    # ---- the keys: one click a press, cut from real typing, deepened and glassy, the send's thumb bar heavier
    kx = B.load("type_b").mean(1)
    kc = clicks_from(kx)
    n = sec(frames(send + 12 - CUE["mutter"]))
    keys = np.zeros(n)
    rng = np.random.default_rng(7)
    for f, h, fi in typing + [[send, 0, 3]]:
        c = kc[rng.integers(len(kc))]
        c = B.speed(c[:, None], 0.8 if f != send else 0.62)[:, 0]
        c = 0.6 * c + 0.4 * B.comb(c[:, None], 1730.0, 0.62)[:, 0]
        at = sec(frames(f - CUE["mutter"])) - sec(0.004)
        g = (1.0 if f != send else 1.5) * rng.uniform(0.75, 1.0)
        keys[at:at + len(c)] += c[: max(0, n - at)] * g
    keysx = B.verb(stereo(B.hp(keys[:, None], 160)[:, 0], 0.05), small, 0.22, tail=0.3)
    sf.write(os.path.join(FX, "alien-keys.wav"), np.clip(B.peak_to(keysx, -3), -1, 1), SR, subtype="PCM_16")

    # ---- the room after the wow: overlapping, excited, each head's voice from where it sits
    pans = {"h0": -0.55, "h1": 0.45, "h2": -0.1, "h3": 0.7}
    plan = [("h0", 0.0, [2, 1, 3]), ("h2", 0.42, [1, 2]), ("h1", 0.7, [3, 1, 2]), ("h3", 0.95, [2, 2]), ("h0", 1.35, [1, 2]), ("h2", 1.5, [3])]
    total = sec(frames(T["hands"] + 6 - CUE["chatter"]))
    mix = np.zeros((total, 2))
    head_env = {k: np.zeros(int(np.ceil(total / SR * FPS))) for k in pans}
    for who, at, words in plan:
        v = voices[who]
        raw, _ = v.line(words, gap=(0.03, 0.1))
        y = v.speak(raw) * (1.0 if at < 1.2 else 0.8)
        y = fades(y, 0.01, 0.08)
        i = sec(at)
        y = y[: max(0, total - i)]
        mix[i:i + len(y)] += stereo(y, pans[who])
        pe = per_frame(y)
        f0 = int(round(at * FPS))
        L = min(len(pe), len(head_env[who]) - f0)
        head_env[who][f0:f0 + L] = np.maximum(head_env[who][f0:f0 + L], pe[:L] * (1.0 if at < 1.2 else 0.8))
    mix = B.verb(B.lp(mix, 8000), ship, 0.42, tail=0.0)[:total]
    mix = B.fade(mix, 0.01, 0.35)
    sf.write(os.path.join(FX, "alien-chatter.wav"), np.clip(B.peak_to(mix, -3), -1, 1), SR, subtype="PCM_16")

    # ---- the note posts: one of them, unsure: a low closed "hmm" falling, from the throat singer's growl and the mumble
    fry = vload("fry_a")
    f0 = B.loudest(fry[:, None], 0.8)
    hm = fry[sec(f0):sec(f0 + 1.2)]
    # its pitch falls as it trails off, unconvinced
    n_hm = int(len(hm) / 0.82) - sec(0.05)
    hm = B.varispeed(hm[:, None], [(0, 0.92), (n_hm / SR, 0.72)], n_hm)[:, 0]
    hm = fades(hm, 0.04, 0.35)
    mm = syllables(vload("mumble_a"))[3]
    mm = deepen(mm, 0.7)
    n = max(len(hm), len(mm)) + sec(0.2)
    y = np.zeros(n)
    y[: len(hm)] += hm / max(1e-6, np.abs(hm).max()) * 0.35
    y[sec(0.05): sec(0.05) + len(mm)] += mm / max(1e-6, np.abs(mm).max()) * 0.8
    y = B.lp(y[:, None], 2500)[:, 0] * np.linspace(1, 0.6, n)
    y = fades(y, 0.04, 0.25)
    hmm = B.verb(stereo(y, 0.45), ship, 0.35, tail=0.8)
    sf.write(os.path.join(FX, "alien-hmm.wav"), np.clip(B.peak_to(hmm, -3), -1, 1), SR, subtype="PCM_16")
    hmm_env = per_frame(y)

    # ---- the wow the room already has: its loudness a frame, for the heads (its cue is T.wow-3)
    wow, _ = sf.read(os.path.join(FX, "wow.wav"), always_2d=True)
    wow_env = per_frame(wow.mean(1))

    r = lambda a: "[" + ",".join(f"{v:.3f}".rstrip("0").rstrip(".") if v else "0" for v in a) + "]"
    with open(TS_OUT, "w") as fo:
        fo.write("// Written by scripts/alien_voice_v3.py: what the room's aliens say, as the animation reads it. Each voice's\n"
                 "// loudness a frame (0..1) from its cue frame (the film's frame its sound starts), and the typing's presses\n"
                 "// [frame, hand, finger], which fall on the typist's syllables. Don't edit: run the script.\n")
        fo.write(f"export const WOW = {{ from: {T['wow'] - 3}, env: {r(wow_env)} }};\n")
        fo.write(f"export const CHATTER = {{ from: {CUE['chatter']}, heads: [{', '.join(r(head_env[k]) for k in ['h0', 'h1', 'h2', 'h3'])}] }};\n")
        fo.write(f"export const MUTTER = {{ from: {CUE['mutter']}, env: {r(m_env)} }};\n")
        fo.write(f"export const HMM = {{ from: {CUE['hmm']}, head: 1, env: {r(hmm_env)} }};\n")
        fo.write(f"export const TYPING: [number, number, number][] = {json.dumps(typing)};\n")
        fo.write(f"export const SEND = {send};\n")
    print("presses", len(typing), [t[0] for t in typing])
    print("mutter", len(mutter) / SR, "chatter", len(mix) / SR, "hmm", len(hmm) / SR)

    with open(os.path.join(PROJ, "assets", "audio", "v3", "VOICE-SOURCES.md"), "w") as fo:
        fo.write("# The aliens' voices: sources\n\nFrom freesound.org, each checked as CC0 1.0 on its page by scripts/sfx_fetch.py; "
                 "the public preview fetched 2026-11-16 into voice-src/ (meta.jsonl holds each page's licence links). Cut and "
                 "worked into a language by scripts/alien_voice_v3.py. The key clicks are type_b (SOURCES.md).\n\n"
                 "| key | title | page | licence |\n|---|---|---|---|\n")
        for k, m in sorted(META.items()):
            fo.write(f"| {k} | {m.get('title', '')} | {m.get('url', m.get('page', ''))} | CC0 1.0 |\n")


if __name__ == "__main__":
    main()
