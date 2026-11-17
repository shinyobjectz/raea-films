#!/usr/bin/env python3
"""The hype film's score: composed here, written as a standard MIDI file, then played by sampled instruments.

  python -I scripts/score.py            compose -> assets/audio/score.mid -> render assets/audio/score.wav + stems
  python -I scripts/score.py --midi     only write the MIDI
  python -I scripts/score.py --tuning   render one dry A per instrument to out/score-check/tuning/ (for the FFT check)

Needs numpy, scipy, soundfile, mido (the venv at /tmp/ivyenv has them) and the samples that
scripts/fetch_instruments.py puts in assets/instruments/. The render reads the MIDI file back, so
score.mid is what is heard: notes, velocities, CC11 expression curves and the tempo map.

The sampler is direct: it reads the WAV/FLAC samples, picks the nearest recorded root, corrects each
sample's measured tuning, resamples to pitch, crossfades velocity layers by expression on the string
sections, alternates round robins on spiccato/pizzicato, and sends every track to a hall reverb.
"""
import os, re, sys, glob, math
from fractions import Fraction
import numpy as np
import soundfile as sf
import mido
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, ".."))
INST = os.path.join(PROJ, "assets", "instruments")
AUDIO = os.path.join(PROJ, "assets", "audio")
MID = os.path.join(AUDIO, "score.mid")
SR = 48000
FPS = 30
FRAMES = 1590
N = FRAMES * SR // FPS
PPQ = 480
PEAK_DBFS = -3.5

# ---------------------------------------------------------------- the clock
# (frame, beat). Beat 0 is frame 572, where the agent starts working. Starred frames sit on beats.
ANCHORS = [(0, -28), (165, -20), (534, -2), (572, 0), (740, 8), (822, 12), (896, 16), (940, 18),
           (1150, 26), (1238, 30), (1261, 31), (1283, 32), (1303.5, 33), (1322, 34), (1475, 40),
           (1500, 41), (1590, 44)]
B0 = ANCHORS[0][1]
_AF = np.array([a[0] for a in ANCHORS], float)
_AB = np.array([a[1] for a in ANCHORS], float)


def beat_sec(b):
    return float(np.interp(b, _AB, _AF)) / FPS


NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def P(name):
    m = re.match(r"^([A-G])(#|b)?(-?\d)$", name)
    return 12 * (int(m.group(3)) + 1) + NOTE[m.group(1)] + {"#": 1, "b": -1, None: 0}[m.group(2)]


# ---------------------------------------------------------------- composition
class Track:
    def __init__(self, name, inst, program, family, gain_db=0.0, pan=0.0, send=0.3, escale=1.0, jitter=0.012):
        self.name, self.inst, self.program, self.family = name, inst, program, family
        self.gain_db, self.pan, self.send, self.escale, self.jitter = gain_db, pan, send, escale, jitter
        self.notes = []   # (beat, dur_beats, pitch, vel, tight)
        self.expr = None  # [(beat, 0..1)]

    def n(self, beat, dur, pitch, vel=80, tight=False):
        for p in (pitch if isinstance(pitch, (list, tuple)) else [pitch]):
            self.notes.append((beat, dur, P(p) if isinstance(p, str) else p, vel, tight))

    def line(self, beat, seq, overlap=0.07):
        """A legato line: (pitch, dur, vel) one after another, each held a little into the next."""
        for i, (p, d, v) in enumerate(seq):
            self.n(beat, d + (overlap if i < len(seq) - 1 else 0), p, v)
            beat += d

    def pulse(self, beat, step, pitches, v0, v1, accent=8, dur=None):
        k = len(pitches)
        for i, p in enumerate(pitches):
            v = v0 + (v1 - v0) * i / max(1, k - 1)
            on_beat = abs((beat + i * step) - round(beat + i * step)) < 1e-6
            self.n(beat + i * step, dur or step * 0.9, p, int(v + (accent if on_beat else 0)))

    def roll(self, end_beat, pitches, v0, v1, spread=0.035, dur=3.0):
        """Rolled chord or glissando whose last note lands on end_beat."""
        k = len(pitches)
        for i, p in enumerate(pitches):
            self.n(end_beat - (k - 1 - i) * spread, dur, p, int(v0 + (v1 - v0) * i / max(1, k - 1)), tight=(i == k - 1))


# The shared dynamic arc of the sustained strings and horns (0..1; heard gain is its square).
ARC = [(-20.3, 0), (-19.2, .30), (-18.2, .26), (-17.0, 0), (-2.0, 0), (-1.0, .20), (0, .30), (4, .38), (6, .50),
       (7.5, .80), (8, .92), (8.6, .78), (9.5, .62), (12, .40), (12.2, .34), (14, .40), (15.5, .80), (16, 1.0),
       (16.5, .90), (17.3, .88), (18, .50), (18.6, .22), (21, .26), (24.5, .20), (25.5, .38), (26, .60), (26.7, .50),
       (28, .55), (29, .62), (30, .68), (32, .80), (33.5, .95), (34, 1.0), (34.6, .84), (36, .62), (38, .50),
       (40, .32), (41, .15), (41.7, 0)]


def compose():
    T = {}

    def add(key, *a, **k):
        T[key] = Track(*a, **k)
        return T[key]

    v1 = add("v1", "Violins I", "violins", 48, "strings", gain_db=-4.5, pan=-0.45, send=0.36, escale=0.9)
    v2 = add("v2", "Violins II", "violins", 48, "strings", gain_db=-3.0, pan=-0.2, send=0.36)
    va = add("va", "Violas", "violas", 48, "strings", gain_db=-1.5, pan=0.15, send=0.34)
    vas = add("vas", "Violas spiccato", "violas_spic", 48, "strings", gain_db=-9.0, pan=0.15, send=0.30)
    vap = add("vap", "Violas pizzicato", "violas_pizz", 45, "strings", gain_db=-8.0, pan=0.15, send=0.32)
    vc = add("vc", "Celli", "celli", 48, "strings", gain_db=-1.0, pan=0.35, send=0.32)
    vcm = add("vcm", "Celli melody", "celli", 48, "strings", gain_db=1.5, pan=0.2, send=0.34)
    vcs = add("vcs", "Celli spiccato", "celli_spic", 48, "strings", gain_db=-7.0, pan=0.35, send=0.30)
    vcp = add("vcp", "Celli pizzicato", "celli_pizz", 45, "strings", gain_db=-6.0, pan=0.35, send=0.32)
    cb = add("cb", "Contrabass", "bass", 43, "strings", gain_db=-1.5, pan=0.45, send=0.26)
    hn = add("hn", "Horns", "horn", 60, "brass", gain_db=-5.0, pan=-0.25, send=0.48, escale=0.95)
    hp = add("hp", "Harp", "harp", 46, "harp", gain_db=-7.0, pan=-0.5, send=0.34, jitter=0.006)
    pf = add("pf", "Piano", "piano", 0, "piano", gain_db=-6.0, pan=0.08, send=0.34)
    tp = add("tp", "Timpani", "timp", 47, "percussion", gain_db=-11.0, pan=0.1, send=0.42, jitter=0.004)

    for t in (v1, v2, va, vc, cb, hn):
        t.expr = list(ARC)
    # the cello melody of the dusk section has its own, steadier arc
    vcm.expr = [(34.5, 0), (35, .55), (36, .72), (37.4, .76), (38, .68), (39, .64), (40, .56), (41, .34), (41.8, 0)]

    # ---- 165: the monitor wakes. One soft low D, then nothing.
    vc.n(-20, 3.0, "D2", 50)
    cb.n(-20, 3.0, "D2", 50)

    # ---- 534: Return. A low D comes in under the slam; 572: the pulse starts.
    cb.n(-2, 6.0, "D2", 55); cb.n(4, 2.0, "G1", 58); cb.n(6, 2.0, "A1", 64)
    vc.n(-2, 6.0, "D2", 55); vc.n(4, 2.0, "G2", 60); vc.n(6, 2.0, "A2", 66)
    vcs.pulse(0, .5, ["D3", "A3", "D3", "A3", "D3", "A3", "D3", "B3"], 34, 52)
    vcs.pulse(4, .5, ["G2", "D3", "G2", "D3", "A2", "E3", "A2", "E3"], 54, 92)
    vas.pulse(4, .5, ["B3", "D4", "B3", "D4", "C#4", "E4", "C#4", "E4"], 42, 84)
    va.n(2, 2.0, "A3", 50); va.n(4, 2.0, "D4", 56); va.n(6, 2.0, "E4", 64)
    v2.n(6, 2.0, "A4", 62)
    v1.n(6.5, 1.5, "E5", 62)
    hn.n(6, 2.0, "A3", 60)
    hp.n(0, 3, "D2", 48); hp.n(4, 3, "G2", 52)

    # ---- 740: the sun rises. D major blooms.
    cb.n(8, 4.0, "D2", 72)
    vc.n(8, 4.0, ["D3", "A3"], 72)
    va.n(8, 4.0, ["D4", "F#4"], 72)
    v2.n(8, 4.0, ["A4", "D5"], 72)
    v1.line(8, [("F#5", 2.0, 74), ("E5", 1.0, 66), ("D5", 1.0, 60)])
    hn.n(8, 3.6, ["A3", "D4"], 70)
    hp.roll(8, ["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4", "D5"], 72, 92)
    pf.n(8, 4, ["D2", "D3"], 62, tight=True)
    tp.n(8, 2, "D3", 60, tight=True)
    vcs.pulse(8, .5, ["D3", "A3"] * 4, 76, 48)
    vas.pulse(8, .5, ["A3", "D4"] * 4, 66, 42)

    # ---- 822: the water clears. Lighter: harp and high piano over the pulse.
    vcp.n(12, 1, "G2", 74, tight=True); vcp.n(13, 1, "D3", 62)
    va.n(12, 2.0, "B3", 52); va.line(14, [("D4", 1.0, 60), ("C#4", 1.0, 70)])
    v2.n(12, 2.0, "D5", 50); v2.n(14, 2.0, "A4", 66)
    v1.line(14, [("E5", 1.0, 62), ("E5", .5, 70), ("F#5", .25, 76), ("G5", .25, 82)])
    vc.n(14, 2.0, ["A2", "E3"], 66)
    cb.n(14, 2.0, "A1", 66)
    hn.n(14, 2.0, ["A3", "E4"], 66)
    vas.pulse(12, .5, ["B3", "D4", "B3", "D4"], 46, 44); vas.pulse(14, .5, ["C#4", "E4", "C#4", "E4"], 52, 86)
    vcs.pulse(14, .5, ["A2", "E3", "A2", "E3"], 56, 94)
    hp.n(12, 2, "G3", 78, tight=True)
    hp.pulse(12.25, .25, ["D4", "A4", "B4", "D5", "B4", "A4", "D4"], 62, 58, dur=2)
    hp.pulse(14, .25, ["A3", "E4", "A4", "D5"], 60, 66, dur=2)
    hp.roll(16 - 1 / 17, ["D3", "E3", "F#3", "G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5",
                          "E5", "F#5"], 50, 84, spread=1 / 17, dur=1.5)
    pf.n(12, 3, "G3", 50, tight=True); pf.n(12, 2, "B5", 58, tight=True)
    for b, p, v in [(12.5, "D6", 52), (13, "A5", 54), (13.5, "B5", 50), (14, "E6", 54), (14.5, "D6", 52),
                    (15, "C#6", 54), (15.5, "E6", 58)]:
        pf.n(b, 2, p, v)

    # ---- 896: leaves burst out. The section's high point.
    cb.n(16, 2.4, "D2", 84)
    vc.n(16, 2.4, ["D3", "A3"], 84)
    va.n(16, 2.2, ["F#4", "A4"], 84)
    v2.n(16, 2.4, ["D5", "F#5"], 84)
    v1.line(16, [("A5", 1.0, 86), ("B5", .5, 82), ("A5", 1.0, 76)])
    hn.n(16, 2.3, ["F#3", "A3", "D4"], 82)
    hp.roll(16, ["D2", "A2", "F#3", "D4", "A4", "D5", "F#5"], 88, 100, spread=0.03)
    pf.n(16, 4, ["D2", "D3", "A3"], 76, tight=True); pf.n(16, 3, ["D4", "A4"], 62, tight=True)
    tp.n(16, 2, "D3", 84, tight=True)
    vcs.pulse(16, .5, ["D3", "A3", "D3", "A3"], 92, 58)
    vas.pulse(16, .5, ["A3", "D4", "A3", "D4"], 80, 50)

    # ---- 940-1150: ebb. Piano alone with a held viola and a few pizzicati; a small question.
    va.n(18, 6.6, "F#4", 46)
    va.n(24.5, 1.5, "E4", 52)
    for b, p, v in [(18, "B2", 60), (20, "B2", 50), (20.5, "F#3", 44), (22, "G2", 58), (23, "D3", 48),
                    (24.78, "A2", 56), (25.11, "E3", 50)]:
        vcp.n(b, 1, p, v)
    vap.n(21.5, 1, "F#4", 40); vap.n(25.11, 1, "A3", 44)
    for b, d, p, v in [(18.5, 2.5, "F#4", 46), (19.02, 2.5, "A4", 50), (19.5, 3.0, "B4", 56), (20.78, 2.5, "D5", 50),
                       (21.3, 2.5, "C#5", 44), (22.5, 2.5, "E4", 44), (23.03, 2.5, "G4", 48), (23.5, 2.5, "B4", 52),
                       (24.12, 3.0, "F#5", 56)]:
        pf.n(b, d, p, v)
    vc.n(24.5, 1.5, "A2", 52)
    v2.n(24.5, 1.5, "A4", 50)
    v1.n(25, 1.0, "E5", 50)

    # ---- 1150: the new version arrives; 1170-1240 mist and sun shafts: a warm, wide rise.
    hp.roll(26, ["G2", "D3", "G3", "B3", "D4", "G4", "B4", "D5"], 62, 78)
    pf.n(26, 4, ["G2", "D3"], 56, tight=True); pf.n(27, 3, "B5", 44); pf.n(28.5, 3, "F#5", 44)
    cb.n(26, 2.0, "G1", 66); cb.n(28, 1.0, "B1", 66); cb.n(29, 1.0, "A1", 68); cb.n(30, 2.0, "A1", 72); cb.n(32, 2.0, "A1", 84)
    vc.n(26, 2.0, ["G2", "D3"], 66); vc.n(28, 1.0, ["B2", "F#3"], 66); vc.n(29, 1.0, ["A2", "F#3"], 68)
    vc.n(30, 2.0, ["A2", "E3"], 72); vc.n(32, 2.0, ["A2", "E3"], 84)
    va.n(26, 3.0, ["B3", "D4"], 64); va.n(29, 3.0, ["A3", "D4"], 70); va.n(32, 2.0, ["C#4", "G4"], 82)
    v2.n(26, 2.0, "G4", 64); v2.n(28, 2.0, "F#4", 66); v2.n(30, 2.0, ["E4", "A4"], 72); v2.n(32, 2.0, ["A4", "E5"], 84)
    v1.line(26, [("B4", 1.0, 64), ("D5", 2.0, 66), ("F#5", 1.0, 72), ("E5", 1.0, 72)])
    hn.n(26, 2.0, "D4", 60); hn.n(28, 2.0, ["B3", "D4"], 64); hn.n(30, 2.0, ["A3", "E4"], 70); hn.n(32, 2.0, ["A3", "E4"], 84)

    # ---- 1260-1322: the timeline is scrubbed, day runs to dusk: crescendo and accelerando into the hit.
    v1.line(31, [("A4", .5, 72), ("B4", .5, 74), ("C#5", .25, 78), ("D5", .25, 80), ("E5", .25, 82), ("F#5", .25, 84),
                 ("G5", .25, 88), ("A5", .25, 92), ("B5", .25, 96), ("C#6", .25, 100)], overlap=0.03)
    vcs.pulse(30, .5, ["A2", "E3", "A2", "E3"], 58, 76)
    vcs.pulse(32, .25, ["A2", "E3"] * 4, 78, 112, accent=6)
    vas.pulse(30, .5, ["A3", "D4", "A3", "D4"], 52, 70)
    vas.pulse(32, .25, ["C#4", "E4"] * 4, 72, 106, accent=6)
    for b, v in [(32, 40), (32.5, 48), (33, 58), (33.25, 64), (33.5, 72), (33.75, 80)]:
        tp.n(b, 1, "A2", v)
    hp.roll(34 - 1 / 22, ["A2", "B2", "C#3", "D3", "E3", "F#3", "G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G4", "A4",
                          "B4", "C#5", "D5", "E5", "F#5", "G5", "A5"], 52, 92, spread=1 / 22, dur=1.5)

    # ---- 1322: the climax hit, then dusk: a broad D major and a slow cello melody over it.
    cb.n(34, 6.6, "D2", 96)
    vc.n(34, 6.8, ["D2", "A2", "D3"], 96)
    va.n(34, 4.0, ["A3", "F#4"], 96); va.n(38, 2.0, ["B3", "G4"], 70); va.n(40, 1.6, ["A3", "F#4"], 60)
    v2.n(34, 7.6, "D5", 96); v2.line(34, [("F#5", 4.0, 96), ("G5", 2.0, 70), ("F#5", 1.6, 60)])
    v1.line(34, [("D6", 1.5, 98), ("A5", 2.5, 80), ("B5", 2.0, 68), ("A5", 1.6, 58)])
    hn.n(34, 4.0, ["D3", "A3", "D4"], 92)
    hp.roll(34, ["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4", "D5", "F#5"], 92, 108, spread=0.028, dur=4)
    pf.n(34, 6, ["D1", "D2", "D3"], 88, tight=True); pf.n(34, 5, ["A3", "D4", "F#4"], 70, tight=True)
    tp.n(34, 3, "D3", 104, tight=True)
    vcm.line(35, [("A3", 1.0, 70), ("F#4", 1.5, 76), ("E4", .5, 70), ("D4", 1.0, 72), ("E4", 1.0, 68), ("D4", 1.8, 64)])
    for b, p, v in [(36.5, "A5", 46), (37.25, "D6", 40), (38.5, "B5", 42), (39.5, "F#5", 40)]:
        hp.n(b, 2, p, v)

    # ---- 1500: one last soft piano note; everything is gone by 1560.
    pf.n(41, 3, "F#5", 50, tight=True)
    return list(T.values())


# ---------------------------------------------------------------- MIDI out and back in
def tick(b):
    return int(round((b - B0) * PPQ))


def write_midi(tracks, path):
    rng = np.random.default_rng(20261116)
    mf = mido.MidiFile(type=1, ticks_per_beat=PPQ)
    cond = mido.MidiTrack(); mf.tracks.append(cond)
    ev = [(0, mido.MetaMessage("track_name", name="Swamp hype score: tempo map", time=0)),
          (0, mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))]
    for (f0, b0), (f1, b1) in zip(ANCHORS, ANCHORS[1:]):
        ev.append((tick(b0), mido.MetaMessage("set_tempo", tempo=int(round((f1 - f0) / FPS / (b1 - b0) * 1e6)), time=0)))
    for f, name in [(165, "monitor wakes"), (534, "return: music enters"), (740, "sunrise"), (822, "water clears"),
                    (896, "leaves burst"), (940, "ebb"), (1150, "new version"), (1322, "climax"), (1500, "last note")]:
        ev.append((tick(float(np.interp(f, _AF, _AB))), mido.MetaMessage("marker", text="f%d %s" % (f, name), time=0)))
    _emit(cond, ev)
    for ch, t in enumerate(tracks):
        ch = ch if ch < 9 else ch + 1  # skip the GM drum channel
        tr = mido.MidiTrack(); mf.tracks.append(tr)
        ev = [(0, mido.MetaMessage("track_name", name=t.name, time=0)),
              (0, mido.Message("program_change", channel=ch, program=t.program, time=0))]
        if t.expr:
            last = None
            b = t.expr[0][0]
            xs, ys = zip(*t.expr)
            while b <= t.expr[-1][0] + 1e-9:
                v = int(round(127 * min(1.0, t.escale * float(np.interp(b, xs, ys)))))
                if v != last:
                    ev.append((tick(b), mido.Message("control_change", channel=ch, control=11, value=v, time=0)))
                    last = v
                b += 1 / 16
        for (b, d, p, v, tight) in sorted(t.notes):
            jb = 0.0 if tight else float(np.clip(rng.normal(0, t.jitter), -2.5 * t.jitter, 2.5 * t.jitter))
            vel = int(np.clip(v + (0 if tight else rng.integers(-4, 5)), 1, 127))
            on = max(0, tick(b + jb)); off = max(on + 10, tick(b + d + jb * 0.5))
            ev.append((on, mido.Message("note_on", channel=ch, note=p, velocity=vel, time=0)))
            ev.append((off, mido.Message("note_off", channel=ch, note=p, velocity=0, time=0)))
        _emit(tr, ev)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mf.save(path)


def _emit(track, ev):
    order = {"note_off": 0, "control_change": 1, "note_on": 2}
    ev.sort(key=lambda e: (e[0], order.get(e[1].type, -1)))
    t = 0
    for at, msg in ev:
        track.append(msg.copy(time=at - t)); t = at
    track.append(mido.MetaMessage("end_of_track", time=0))


def read_midi(path):
    """-> {track name: {"notes": [(t_on, t_off, pitch, vel)], "cc": (times, values 0..1) or None}} in seconds."""
    mf = mido.MidiFile(path)
    tempi, t = [], 0
    for m in mf.tracks[0]:
        t += m.time
        if m.type == "set_tempo":
            tempi.append((t, m.tempo))
    tempi.sort()
    tk = np.array([x[0] for x in tempi], float); us = np.array([x[1] for x in tempi], float)
    base = np.concatenate([[0], np.cumsum(np.diff(tk) * us[:-1] / mf.ticks_per_beat / 1e6)])

    def sec(ticks):
        i = max(0, int(np.searchsorted(tk, ticks, side="right")) - 1)
        return float(base[i] + (ticks - tk[i]) * us[i] / mf.ticks_per_beat / 1e6)

    out = {}
    for tr in mf.tracks[1:]:
        name, t, on, notes, cc = None, 0, {}, [], []
        for m in tr:
            t += m.time
            if m.type == "track_name":
                name = m.name
            elif m.type == "note_on" and m.velocity > 0:
                on.setdefault(m.note, []).append((t, m.velocity))
            elif m.type in ("note_off", "note_on") and on.get(m.note):
                t0, v = on[m.note].pop(0)
                notes.append((sec(t0), sec(t), m.note, v))
            elif m.type == "control_change" and m.control == 11:
                cc.append((sec(t), m.value / 127.0))
        out[name] = {"notes": sorted(notes), "cc": (np.array([c[0] for c in cc]), np.array([c[1] for c in cc])) if cc else None}
    return out


# ---------------------------------------------------------------- the sampler
V = os.path.join(INST, "vsco2-ce")
# kind: sus (held, looped if needed, expression-driven), shot (rings out), key (rings until released)
# octave: what to add to the octave in the file name to get the real pitch (VSCO-2 names most an octave low)
INSTRUMENTS = {
    "violins": dict(dir=V + "/Strings/Violin Section/susVib", kind="sus", octave=1, soft=1, loud=2, xfade=True, lp=7500, lead=0.06),
    "violas": dict(dir=V + "/Strings/Viola Section/susvib", kind="sus", octave=1, soft=1, loud=2, xfade=True, lp=7500, lead=0.06),
    "celli": dict(dir=V + "/Strings/Cello Section/susvib", kind="sus", octave=1, soft=1, loud=3, xfade=True, lp=7000, lead=0.06),
    "bass": dict(dir=V + "/Strings/Solo Contrabass/SusVib", kind="sus", octave=1, soft=1, loud=3, xfade=False, lp=5000, lead=0.06),
    "horn": dict(dir=V + "/Brass/F Horn/sus", kind="sus", octave=1, soft=1, loud=2, xfade=False, lp=5000, lead=0.05),
    "violas_spic": dict(dir=V + "/Strings/Viola Section/spic", kind="shot", octave=1, soft=1, loud=2, lp=7000),
    "celli_spic": dict(dir=V + "/Strings/Cello Section/spic", kind="shot", octave=1, soft=1, loud=2, lp=6500),
    "violas_pizz": dict(dir=V + "/Strings/Viola Section/pizz", kind="shot", octave=1, soft=1, loud=2, lp=7000),
    "celli_pizz": dict(dir=V + "/Strings/Cello Section/pizzT", kind="shot", octave=1, soft=1, loud=2, lp=6500),
    "harp": dict(dir=V + "/Strings/Harp", kind="shot", octave=0, lp=9000),
    "piano": dict(dir=INST + "/salamander/Samples", kind="key", octave=0, lp=9000, tuned=True),
    "timp": dict(dir=V + "/Percussion/Timpani", kind="shot", lp=1800, tuned=True),
}
# The timpani files carry no pitch in their names: these are the drums' measured principal tones (Hz -> MIDI).
TIMP_ROOT = {1: 69 + 12 * math.log2(89.7 / 440), 2: 69 + 12 * math.log2(121.9 / 440), 3: 69 + 12 * math.log2(142.5 / 440)}


def scan(inst):
    """-> {layer: {root_midi: [paths by round robin]}}"""
    d = INSTRUMENTS[inst]
    out = {}
    for p in sorted(glob.glob(d["dir"] + "/*")):
        f = os.path.basename(p)
        if inst == "timp":
            m = re.match(r"Timpani(\d)_Hit_v(\d)_rr(\d)", f)
            if not m or int(m.group(1)) not in TIMP_ROOT or int(m.group(2)) != 3:
                continue
            out.setdefault(1, {}).setdefault(TIMP_ROOT[int(m.group(1))], []).append(p)
        elif inst == "piano":
            m = re.match(r"([A-G]#?)(\d)v(\d+)\.flac$", f)
            if m:
                out.setdefault(int(m.group(3)), {}).setdefault(P(m.group(1) + m.group(2)), []).append(p)
        elif inst == "harp":
            m = re.match(r"KSHarp_([A-G]#?)(\d)_", f)
            if m:
                out.setdefault(1, {}).setdefault(P(m.group(1) + m.group(2)), []).append(p)
        else:
            m = re.search(r"_([A-G]#?)(\d)_v(\d)", f)
            if m:
                out.setdefault(int(m.group(3)), {}).setdefault(P(m.group(1) + m.group(2)) + 12 * d["octave"], []).append(p)
    if not out:
        raise SystemExit("no samples for %s in %s: run scripts/fetch_instruments.py" % (inst, d["dir"]))
    return out


_cache = {}


def measure_cents(mono, sr, midi, start, seconds, harmonics):
    """How far the sample is from the pitch its name says, in cents (harmonic sum on a fine grid)."""
    seg = mono[start:start + int(seconds * sr)]
    if len(seg) < sr // 5:
        return 0.0
    nfft = 1 << 19
    S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), nfft))
    f0 = 440.0 * 2 ** ((midi - 69) / 12)
    cents = np.arange(-60, 61)
    score = np.zeros(len(cents))
    for h in range(1, harmonics + 1):
        f = f0 * h * 2 ** (cents / 1200.0)
        if f.max() > sr / 2 - 100:
            break
        score += np.interp(f * nfft / sr, np.arange(len(S)), S)
    i = int(score.argmax())
    if i in (0, len(cents) - 1) or score[i] < 3 * np.median(score):
        return 0.0
    a, b, c = score[i - 1], score[i], score[i + 1]
    return float(cents[i] + 0.5 * (a - c) / (a - 2 * b + c))


def load(path, inst, root):
    key = path
    if key in _cache:
        return _cache[key]
    d = INSTRUMENTS[inst]
    x, sr = sf.read(path, dtype="float32", always_2d=True, frames=int(16 * sf.info(path).samplerate))
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    mono = x.mean(1)
    env = np.abs(mono)
    pk = float(env.max())
    k = int(sr * 0.004)
    sm = np.convolve(env, np.ones(k) / k, mode="same")
    onset = max(0, int(np.argmax(sm > 0.04 * sm.max())) - int(0.004 * sr))
    if d["kind"] == "sus":
        a, b = onset + int(0.5 * sr), min(len(mono), onset + int(3.0 * sr))
        cents = 0.0 if d.get("tuned") else measure_cents(mono, sr, root, onset + int(0.4 * sr), 2.5, 8)
    else:
        a, b = onset, min(len(mono), onset + int(0.3 * sr))
        cents = 0.0 if d.get("tuned") else measure_cents(mono, sr, root, onset + int(0.04 * sr), 1.0, 4)
    rms = float(np.sqrt(np.mean(mono[a:b] ** 2))) or pk or 1.0
    f = int(0.002 * sr)
    x = x[onset:].copy()
    x[:f] *= np.linspace(0, 1, f, dtype=np.float32)[:, None]
    _cache[key] = dict(x=x, sr=sr, gain=0.1 / rms, cents=cents)
    return _cache[key]


def nearest(table, pitch):
    return min(table, key=lambda r: (abs(r - pitch), r))


def loop_extend(x, need, sr):
    """Hold a sustained sample longer than it was recorded by crossfading its steady middle onto itself."""
    a, b = int(1.0 * sr), len(x) - int(1.3 * sr)
    if b - a < int(1.6 * sr):
        a, b = int(0.4 * sr), len(x) - int(0.6 * sr)
    xf = int(0.6 * sr)
    out = x[:b]
    w = np.linspace(0, np.pi / 2, xf, dtype=np.float32)[:, None]
    while len(out) < need:
        chunk = x[a:b]
        out = np.concatenate([out[:-xf], out[-xf:] * np.cos(w) + chunk[:xf] * np.sin(w), chunk[xf:]])
    return out


def pitch(x, sr, semis, n_out, offset=0):
    """Resample a sample so it sounds `semis` semitones away from its root, at 48 kHz."""
    r = sr / SR * 2 ** (semis / 12.0)  # source samples per output sample
    need = int(n_out * r) + 256
    seg = x[offset:]
    if len(seg) < need:
        seg = np.concatenate([seg, np.zeros((need - len(seg), 2), np.float32)])
    fr = Fraction(1 / r).limit_denominator(640)
    y = signal.resample_poly(seg[:need], fr.numerator, fr.denominator, axis=0).astype(np.float32)
    if len(y) < n_out:
        y = np.concatenate([y, np.zeros((n_out - len(y), 2), np.float32)])
    return y[:n_out]


def half_cos(n, rising=True):
    w = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, max(2, n), dtype=np.float32))
    return w if rising else w[::-1]


def render_track(inst, notes, cc, length, dry=False):
    d = INSTRUMENTS[inst]
    table = scan(inst)
    layers = sorted(table)
    buf = np.zeros((length, 2), np.float32)
    rr = 0
    for i, (t0, t1, p, vel) in enumerate(notes):
        dur = t1 - t0
        if d["kind"] == "sus":
            soft = d["soft"] if d["soft"] in table else layers[0]
            legato = any(j != i and abs(o[1] - t0) < 0.14 and o[2] != p and o[0] < t0 for j, o in enumerate(notes))
            fast = dur < 0.32
            att = 0.09 if legato else (0.03 if fast else 0.05)
            skip = 0.10 if legato else (0.04 if fast else 0.0)
            rel = 0.12 if fast else 0.38
            start = t0 - (0.0 if legato else d["lead"])
            n_out = int((dur + rel + (0.0 if legato else d["lead"])) * SR)
            tt = start + np.arange(n_out) / SR
            e = np.interp(tt, cc[0], cc[1]).astype(np.float32) if cc is not None else np.full(n_out, vel / 127.0, np.float32)
            y = np.zeros((n_out, 2), np.float32)
            mix = np.clip((e - 0.30) / 0.45, 0, 1)
            mix = mix * mix * (3 - 2 * mix)
            for lay, w in ((soft, np.sqrt(1 - mix)), (d["loud"], np.sqrt(mix))):
                if not d["xfade"]:  # a solo instrument: one layer for the whole note, chosen by its velocity
                    if (lay == soft) != (vel < 80):
                        continue
                    w = np.ones(n_out, np.float32)
                elif w.max() < 1e-3:
                    continue
                tab = table.get(lay) or table[soft]
                root = nearest(tab, p)
                if lay != soft and abs(root - p) > abs(nearest(table[soft], p) - p) + 2:
                    tab, root = table[soft], nearest(table[soft], p)  # no loud take near this note
                s = load(tab[root][0], inst, root)
                semis = p - root - s["cents"] / 100.0
                r = s["sr"] / SR * 2 ** (semis / 12.0)
                off = int(skip * s["sr"])
                need = int(n_out * r) + 512 + off
                x = s["x"]
                if need > len(x) - int(0.5 * s["sr"]):
                    x = loop_extend(x, need, s["sr"])
                y += pitch(x, s["sr"], semis, n_out, off) * (s["gain"] * w)[:, None]
            env = np.ones(n_out, np.float32)
            a, r_ = int(att * SR), int(rel * SR)
            env[:a] = half_cos(a); env[-r_:] = half_cos(r_, False)
            y *= (env * e * e * (0.6 + 0.4 * vel / 127.0))[:, None]
        else:
            lay = layers[0]
            if inst == "piano":
                lay = layers[min(len(layers) - 1, int(np.searchsorted([52, 72, 92], vel)))]
            elif len(layers) > 1:
                lay = d["soft"] if vel < 72 else d["loud"]
            tab = table[lay]
            root = nearest(tab, p)
            takes = tab[root]
            s = load(takes[rr % len(takes)], inst, root); rr += 1
            semis = p - root - s["cents"] / 100.0
            r = s["sr"] / SR * 2 ** (semis / 12.0)
            natural = len(s["x"]) / s["sr"] / (r * SR / s["sr"])
            hold = min(natural, 7.0) if d["kind"] == "shot" else min(natural, dur + 0.35)
            n_out = int(hold * SR)
            y = pitch(s["x"], s["sr"], semis, n_out) * s["gain"]
            rel = int(min(0.35, hold / 2) * SR)
            y[-rel:] *= half_cos(rel, False)[:, None]
            y *= (vel / 100.0) ** 1.6
            start = t0
        i0 = int(round(start * SR))
        if i0 < 0:
            y, i0 = y[-i0:], 0
        y = y[:max(0, length - i0)]
        buf[i0:i0 + len(y)] += y
    _cache.clear()
    if not dry and d.get("lp"):
        sos = signal.butter(2, d["lp"], "low", fs=SR, output="sos")
        buf = signal.sosfilt(sos, buf, axis=0).astype(np.float32)
    return buf


def place(buf, pan, width=0.75):
    m, s = (buf[:, 0] + buf[:, 1]) / 2, (buf[:, 0] - buf[:, 1]) / 2 * width
    return np.stack([(m + s) * min(1.0, 1 - pan), (m - s) * min(1.0, 1 + pan)], 1)


# ---------------------------------------------------------------- the hall
def hall_ir(seconds=3.2, seed=7):
    """A scoring-stage impulse response: sparse early reflections, then a diffuse tail whose highs die first."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    bands = [(None, 250, 2.5, 0.9), (250, 2000, 2.1, 1.0), (2000, 5000, 1.5, 0.6), (5000, None, 0.9, 0.3)]
    for ch in range(2):
        noise = rng.standard_normal(n)
        for lo, hi, rt, g in bands:
            if lo is None:
                sos = signal.butter(2, hi, "low", fs=SR, output="sos")
            elif hi is None:
                sos = signal.butter(2, lo, "high", fs=SR, output="sos")
            else:
                sos = signal.butter(2, [lo, hi], "band", fs=SR, output="sos")
            ir[:, ch] += g * signal.sosfilt(sos, noise) * 10 ** (-3 * t / rt)
        build = int(0.05 * SR)  # the tail fades in after the early reflections
        ir[:build, ch] *= np.linspace(0, 1, build) ** 2
        for _ in range(9):
            at = int(rng.uniform(0.012, 0.085) * SR)
            ir[at, ch] += rng.choice([-1, 1]) * rng.uniform(4, 9) * (1 - at / (0.11 * SR))
    pre = int(0.022 * SR)
    ir = np.concatenate([np.zeros((pre, 2)), ir])
    ir[-int(0.2 * SR):] *= np.linspace(1, 0, int(0.2 * SR))[:, None]
    return (ir / np.sqrt((ir ** 2).sum(0).mean())).astype(np.float32)


def gate():
    """The picture's silences, made exact: nothing before the wake note, nothing between it and Return, gone by 1560."""
    g = np.ones(N + 4 * SR, np.float32)
    f = lambda fr: int(fr * SR / FPS)
    g[:f(163)] = 0
    g[f(163):f(165)] = half_cos(f(165) - f(163))
    g[f(290):f(335)] = half_cos(f(335) - f(290), False)
    g[f(335):f(531)] = 0
    g[f(531):f(534)] = half_cos(f(534) - f(531))
    g[f(1522):f(1560)] = half_cos(f(1560) - f(1522), False)
    g[f(1560):] = 0
    return g[:, None]


def render():
    tracks = {t.name: t for t in compose()}
    midi = read_midi(MID)
    L = N + 4 * SR
    ir = hall_ir()
    fams, order = {}, []
    for name, data in midi.items():
        t = tracks[name]
        dry = place(render_track(t.inst, data["notes"], data["cc"], L), t.pan) * 10 ** (t.gain_db / 20)
        fam = fams.setdefault(t.family, [np.zeros((L, 2), np.float32), np.zeros(L, np.float32)])
        if t.family not in order:
            order.append(t.family)
        fam[0] += dry
        fam[1] += dry.mean(1) * t.send
        print("  %-18s %3d notes  peak %.3f" % (name, len(data["notes"]), float(np.abs(dry).max())), flush=True)
    hp = signal.butter(2, 28, "high", fs=SR, output="sos")
    # a broad, shallow dip where sampled strings and brass turn hard
    w0, q, a = 2 * np.pi * 3200 / SR, 0.7, 10 ** (-2.5 / 40)
    al = np.sin(w0) / (2 * q)
    bq = (np.array([1 + al * a, -2 * np.cos(w0), 1 - al * a]) / (1 + al / a), np.array([1, -2 * np.cos(w0) / (1 + al / a), (1 - al / a) / (1 + al / a)]))
    g = gate()
    stems = {}
    for fam in order:
        dry, send = fams[fam]
        wet = np.stack([signal.fftconvolve(send, ir[:, c])[:L] for c in range(2)], 1)
        x = signal.sosfilt(hp, dry + wet, axis=0)
        x = signal.lfilter(bq[0], bq[1], x, axis=0)
        stems[fam] = (x * g)[:N].astype(np.float64)
    mix = sum(stems.values())
    tp = float(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
    k = 10 ** (PEAK_DBFS / 20) / tp
    os.makedirs(os.path.join(AUDIO, "score-stems"), exist_ok=True)
    sf.write(os.path.join(AUDIO, "score.wav"), mix * k, SR, subtype="PCM_24")
    for fam, x in stems.items():
        sf.write(os.path.join(AUDIO, "score-stems", "score-%s.wav" % fam), x * k, SR, subtype="PCM_24")
    print("score.wav: %d samples (%.3f s), true peak %.2f dBFS, master gain %.2f dB" % (N, N / SR, 20 * np.log10(tp * k), 20 * np.log10(k)))


def tuning():
    """One dry A per instrument, no reverb, for the FFT check against 440 Hz and its octaves."""
    out = os.path.join(PROJ, "out", "score-check", "tuning")
    os.makedirs(out, exist_ok=True)
    for inst, p in [("violins", 69), ("violas", 69), ("celli", 57), ("bass", 45), ("horn", 57), ("harp", 69),
                    ("piano", 69), ("celli_pizz", 57), ("violas_spic", 69), ("celli_spic", 57), ("violas_pizz", 69)]:
        cc = (np.array([0.0, 10.0]), np.array([0.8, 0.8]))
        y = render_track(inst, [(0.2, 3.2, p, 90)], cc, 5 * SR, dry=True)
        sf.write(os.path.join(out, "%s-%d.wav" % (inst, p)), y, SR, subtype="PCM_24")
    print("wrote", out)


if __name__ == "__main__":
    if "--tuning" in sys.argv:
        tuning()
    else:
        write_midi(compose(), MID)
        print("wrote", MID)
        if "--midi" not in sys.argv:
            render()
