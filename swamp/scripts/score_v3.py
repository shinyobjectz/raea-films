#!/usr/bin/env python3
"""The v3 score: v2's score (scripts/score.py) note for note to the dusk (frame 1500), then the new ending, played by
the same sampled instruments through the same hall. Writes assets/audio/v3/score.mid, score.wav and score-stems/.

  /tmp/ivyenv/bin/python -I scripts/score_v3.py [--midi]

The ending, on the film's clock (components/timeline.ts T):
  1510 sent        the dusk piece has died away (v2's arc reaches 0 at 1518)
  1524 crack       a low A pedal struck under the crack; timpani roll into the beam
  1552 beam        horns and a spiccato drive on A
  1580 rise        strings climb in D Lydian (G#) over E/D, harp up the scale into the white
  1664 white/orbit D major add9 at full width; stars on the piano
  1736 strike      a hit on G over D as the ship lights; settling to A
  1790 port        a climb on A, timpani roll, everything into the white at 1842; cut dead at 1850
  1850-2165        no score: the room has the film's own sound on its screen
  2165 end         the dusk theme on the horn over soft strings; the robot passes; D major at the mark (2262)
  2325             faded out with the picture
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import score as S  # noqa: E402

S.AUDIO = os.path.join(S.PROJ, "assets", "audio", "v3")
S.MID = os.path.join(S.AUDIO, "score.mid")
S.FRAMES = 2325
S.N = S.FRAMES * S.SR // S.FPS

# the clock: v2's anchors to 1500 (so everything before is unchanged), then the ending's events on beats
S.ANCHORS = [a for a in S.ANCHORS if a[0] <= 1500] + [
    (1524, 42), (1552, 43), (1580, 44), (1664, 47), (1736, 50), (1850, 54.5), (2165, 67), (2262, 71), (2325, 73.5),
    (2420, 77.5)]
S._AF = np.array([a[0] for a in S.ANCHORS], float)
S._AB = np.array([a[1] for a in S.ANCHORS], float)

# the sustained strings' and horns' arc: v2's to the dusk, then the ending's
S.ARC = list(S.ARC) + [
    (41.95, 0), (42.0, .50), (42.5, .34), (43.0, .56), (44.0, .60), (45.0, .70), (46.0, .84), (47.0, 1.0),
    (47.8, .80), (49.0, .62), (49.6, .72), (50.0, .96), (50.7, .78), (51.5, .62), (52.25, .58), (53.0, .72),
    (54.0, .92), (54.3, 1.0), (54.48, 1.0), (54.5, 0), (66.95, 0), (67.0, .30), (67.8, .44), (68.6, .58),
    (69.6, .52), (70.4, .64), (71.0, .88), (71.8, .70), (72.8, .48), (73.5, .30), (74.0, 0)]

_compose = S.compose


def compose():
    tracks = _compose()
    v1, v2, va, vas, vap, vc, vcm, vcs, vcp, cb, hn, hp, pf, tp = tracks

    # ---- 1524 the crack: a low A pedal struck under it, a timpani roll into the beam
    pf.n(42, 4, ["A0", "A1", "E2"], 84, tight=True)
    cb.n(42, 5.0, "A1", 80)
    vc.n(42, 2.0, ["A2", "E3"], 76)
    va.n(42.5, 1.5, "A3", 58)
    tp.n(42, 2, "A2", 92, tight=True)
    for i, b in enumerate(np.arange(42.5, 43.0, 1 / 8)):
        tp.n(float(b), 0.5, "A2", int(44 + 8 * i))

    # ---- 1552 the beam stands: horns, a drive on A
    tp.n(43, 2, "A2", 88, tight=True)
    hn.n(43, 3.0, ["A3", "E4"], 76)
    vc.n(44, 2.0, ["A2", "E3"], 74)
    va.n(44, 1.0, ["C#4", "E4"], 66); va.n(45, 1.0, ["D4", "F#4"], 70)
    v2.n(43, 2.0, "A4", 66); v2.n(45, 1.0, "B4", 70)
    vcs.pulse(43, .5, ["A2", "E3"] * 6, 58, 92)
    vas.pulse(44, .5, ["C#4", "E4", "C#4", "E4"], 54, 78)
    hp.roll(43, ["A1", "E2", "A2", "C#3", "E3", "A3"], 70, 86, spread=0.04)

    # ---- 1580-1664 the rise: D Lydian over E/D, climbing into the white
    v1.line(44, [("A4", 1.0, 70), ("B4", .5, 72), ("C#5", .5, 76), ("D5", .25, 78), ("E5", .25, 80), ("F#5", .25, 84),
                 ("G#5", .25, 88), ("A5", .5, 92), ("B5", .5, 96)], overlap=0.04)
    cb.n(46, 1.0, "D2", 84)
    vc.n(46, 1.0, ["D2", "D3"], 84)
    va.n(46, 1.0, ["E4", "G#4", "B4"], 82)
    v2.n(46, 1.0, ["E5", "G#5"], 84)
    hn.n(46, 1.0, ["B3", "E4", "G#4"], 82)
    vcs.pulse(46, .25, ["D3", "A3"] * 4, 94, 112, accent=6)
    vas.pulse(46, .25, ["E4", "B4"] * 4, 86, 108, accent=6)
    for i, b in enumerate(np.arange(46.25, 47.0, 1 / 8)):
        tp.n(float(b), 0.5, "D3", int(50 + 7 * i))
    hp.roll(47 - 1 / 24, ["D3", "E3", "F#3", "G#3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G#4", "A4", "B4", "C#5", "D5",
                          "E5", "F#5", "G#5", "A5", "B5", "C#6", "D6", "E6"], 56, 96, spread=1 / 24, dur=1.5)

    # ---- 1664 the white, 1670 orbit: D major with its ninth, as wide as the scoring stage is
    pf.n(47, 6, ["D1", "D2", "A2"], 94, tight=True); pf.n(47, 5, ["D4", "E4", "F#4", "A4"], 70, tight=True)
    cb.n(47, 3.0, "D2", 98)
    vc.n(47, 3.0, ["D2", "A2", "D3"], 98)
    va.n(47, 3.0, ["F#3", "A3", "E4"], 96)
    v2.n(47, 3.0, ["E5", "F#5"], 96)
    v1.line(47, [("A5", 1.5, 98), ("F#5", .5, 84), ("E5", 1.0, 78)])
    hn.n(47, 3.0, ["D3", "A3", "F#4"], 94)
    tp.n(47, 3, "D3", 108, tight=True)
    hp.roll(47, ["D2", "A2", "D3", "E3", "F#3", "A3", "D4", "E4", "F#4", "A4", "D5"], 94, 110, spread=0.028, dur=4)
    for b, p, v in [(48, "A5", 54), (48.5, "E6", 50), (49, "F#6", 52), (49.5, "D6", 48)]:
        pf.n(b, 2, p, v)
    for i, b in enumerate(np.arange(49.25, 50.0, 1 / 8)):
        tp.n(float(b), 0.5, "D3", int(40 + 8 * i))

    # ---- 1736 the strike: G over D as the ship lights; then A
    pf.n(50, 5, ["G1", "G2", "D3"], 96, tight=True); pf.n(50, 4, ["B3", "D4", "G4"], 74, tight=True)
    cb.n(50, 2.0, "G1", 98); cb.n(52, 0.25, "A1", 72)
    vc.n(50, 2.0, ["G2", "D3"], 96); vc.n(52, 0.25, ["A2", "E3"], 72)
    va.n(50, 2.0, ["B3", "D4", "G4"], 94); va.n(52, 0.25, ["C#4", "E4"], 70)
    v2.n(50, 2.0, ["B4", "D5"], 94); v2.n(52, 0.25, ["C#5", "E5"], 70)
    v1.line(50, [("D6", 1.0, 100), ("B5", .5, 86), ("A5", .5, 80), ("G5", .5, 76), ("F#5", .5, 72), ("E5", .25, 70)])
    hn.n(50, 2.0, ["G3", "B3", "D4"], 94); hn.n(52, 0.25, ["A3", "E4"], 72)
    tp.n(50, 3, "G2", 110, tight=True)
    hp.roll(50, ["G1", "D2", "G2", "B2", "D3", "G3", "B3", "D4", "G4", "B4", "D5", "G5"], 96, 112, spread=0.026, dur=4)

    # ---- 1790-1850 into the port: a climb on A, a roll, everything into the white at 1842; the gate cuts it at 1850
    cb.n(52.25, 2.25, "A1", 84)
    vc.n(52.25, 2.25, ["A2", "E3"], 84)
    va.n(52.25, 2.25, ["C#4", "E4", "A4"], 82)
    v2.n(52.25, 1.0, "A4", 76); v2.n(53.25, 1.25, ["C#5", "E5"], 88)
    v1.line(52.25, [("A4", .25, 76), ("B4", .25, 78), ("C#5", .25, 80), ("D5", .25, 82), ("E5", .25, 84),
                    ("F#5", .25, 88), ("G#5", .25, 90), ("A5", .25, 94), ("B5", .25, 98), ("C#6", .25, 102),
                    ("E6", 1.75, 108)], overlap=0.03)
    hn.n(52.25, 2.25, ["A3", "E4", "A4"], 86)
    vcs.pulse(52.25, .25, ["A2", "E3"] * 9, 76, 116, accent=4)
    vas.pulse(52.25, .25, ["C#4", "E4"] * 9, 70, 110, accent=4)
    for i, b in enumerate(np.arange(53.25, 54.5, 1 / 8)):
        tp.n(float(b), 0.5, "A2", int(46 + 6 * i))
    hp.roll(54.2, ["A2", "B2", "C#3", "D3", "E3", "F#3", "G#3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G#4", "A4", "B4",
                   "C#5", "D5", "E5", "F#5", "G#5", "A5"], 60, 104, spread=1 / 30, dur=1.2)
    pf.n(54.2, 2, ["A1", "A2", "E3", "A3"], 100, tight=True)

    # ---- 2165 the end: the dusk theme on the horn over soft strings; the robot passes; D major at the mark
    cb.n(67, 1.5, "D2", 60); cb.n(68.5, 1.0, "B1", 64); cb.n(69.5, 0.75, "G1", 66); cb.n(70.25, 0.75, "A1", 70)
    cb.n(71, 2.6, "D2", 80)
    vc.n(67, 1.5, ["D2", "A2"], 60); vc.n(68.5, 1.0, ["B2", "F#3"], 64); vc.n(69.5, .75, ["G2", "D3"], 66)
    vc.n(70.25, .75, ["A2", "E3"], 70); vc.n(71, 2.6, ["D2", "A2", "D3"], 82)
    va.n(67, 1.5, ["F#3", "A3"], 58); va.n(68.5, 1.0, ["D4", "F#4"], 62); va.n(69.5, .75, ["B3", "D4"], 64)
    va.n(70.25, .75, ["C#4", "E4"], 68); va.n(71, 2.6, ["F#3", "A3", "D4"], 80)
    v2.n(67, 1.5, "D5", 56); v2.n(68.5, 1.0, "B4", 60); v2.n(69.5, .75, "B4", 62); v2.n(70.25, .75, ["A4", "C#5"], 66)
    v2.n(71, 2.6, ["A4", "D5"], 80)
    v1.line(68, [("F#5", 1.5, 64), ("D5", .75, 62), ("E5", .75, 66)]); v1.n(71, 2.6, "F#5", 80)
    hn.line(67.5, [("A3", 1.0, 60), ("F#4", 1.5, 68), ("G4", .5, 64), ("E4", .5, 62), ("D4", 2.6, 74)])
    hp.pulse(67.0, .25, ["D3", "A3", "D4", "F#4", "A4", "D5"], 54, 64, dur=2)
    hp.pulse(68.5, .25, ["B2", "F#3", "B3", "D4", "F#4"], 56, 62, dur=2)
    hp.pulse(69.5, .25, ["G2", "D3", "G3", "B3"], 56, 60, dur=2)
    hp.roll(71, ["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4", "D5", "F#5", "A5"], 74, 92, spread=0.035, dur=4)
    pf.n(71, 4, ["D1", "D2"], 70, tight=True); pf.n(71, 4, ["A3", "D4", "F#4"], 58, tight=True)
    pf.n(72, 2.5, "A5", 46); pf.n(72.5, 2.5, "D6", 42)
    tp.n(71, 2, "D3", 70, tight=True)
    return tracks


S.compose = compose


def gate():
    """v2's opening silences; the crack and on as scored; cut dead into the room at 1850; back at 2165; out at 2325"""
    g = np.ones(S.N + 4 * S.SR, np.float32)
    f = lambda fr: int(fr * S.SR / S.FPS)
    g[:f(163)] = 0
    g[f(163):f(165)] = S.half_cos(f(165) - f(163))
    g[f(290):f(335)] = S.half_cos(f(335) - f(290), False)
    g[f(335):f(531)] = 0
    g[f(531):f(534)] = S.half_cos(f(534) - f(531))
    g[f(1849.4):f(1850)] = S.half_cos(f(1850) - f(1849.4), False)
    g[f(1850):f(2165)] = 0
    g[f(2296):f(2325)] = S.half_cos(f(2325) - f(2296), False)
    g[f(2325):] = 0
    return g[:, None]


S.gate = gate

NEW_FROM = 41.9  # beats from here on are the ending's


def write_midi(tracks, path):
    """score.write_midi, but the ending's notes take their own random stream, so every note before it keeps exactly the
    timing and velocity v2 gave it"""
    mido = S.mido
    rng_old, rng_new = np.random.default_rng(20261116), np.random.default_rng(20261117)
    mf = mido.MidiFile(type=1, ticks_per_beat=S.PPQ)
    cond = mido.MidiTrack(); mf.tracks.append(cond)
    ev = [(0, mido.MetaMessage("track_name", name="Swamp hype score v3: tempo map", time=0)),
          (0, mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))]
    for (f0, b0), (f1, b1) in zip(S.ANCHORS, S.ANCHORS[1:]):
        ev.append((S.tick(b0), mido.MetaMessage("set_tempo", tempo=int(round((f1 - f0) / S.FPS / (b1 - b0) * 1e6)), time=0)))
    for f, name in [(165, "monitor wakes"), (534, "return: music enters"), (740, "sunrise"), (822, "water clears"),
                    (896, "leaves burst"), (940, "ebb"), (1150, "new version"), (1322, "climax"), (1500, "last note"),
                    (1524, "crack"), (1552, "beam"), (1580, "rise"), (1664, "white: orbit"), (1736, "strike"),
                    (1790, "port"), (1850, "cut: the room"), (2165, "the end"), (2262, "mark")]:
        ev.append((S.tick(float(np.interp(f, S._AF, S._AB))), mido.MetaMessage("marker", text="f%d %s" % (f, name), time=0)))
    S._emit(cond, ev)
    for ch, t in enumerate(tracks):
        ch = ch if ch < 9 else ch + 1
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
                    ev.append((S.tick(b), mido.Message("control_change", channel=ch, control=11, value=v, time=0)))
                    last = v
                b += 1 / 16
        for (b, d, p, v, tight) in sorted(t.notes):
            rng = rng_new if b >= NEW_FROM else rng_old
            jb = 0.0 if tight else float(np.clip(rng.normal(0, t.jitter), -2.5 * t.jitter, 2.5 * t.jitter))
            vel = int(np.clip(v + (0 if tight else rng.integers(-4, 5)), 1, 127))
            on = max(0, S.tick(b + jb)); off = max(on + 10, S.tick(b + d + jb * 0.5))
            ev.append((on, mido.Message("note_on", channel=ch, note=p, velocity=vel, time=0)))
            ev.append((off, mido.Message("note_off", channel=ch, note=p, velocity=0, time=0)))
        S._emit(tr, ev)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mf.save(path)


def render():
    """score.render, with v2's master gain: the gain that brings the part before the ending (identical to v2's score) to
    v2's -3.5 dBFS true peak, so that part comes out as v2's did"""
    sf, signal = S.sf, S.signal
    tracks = {t.name: t for t in compose()}
    midi = S.read_midi(S.MID)
    L = S.N + 4 * S.SR
    ir = S.hall_ir()
    fams, order = {}, []
    for name, data in midi.items():
        t = tracks[name]
        dry = S.place(S.render_track(t.inst, data["notes"], data["cc"], L), t.pan) * 10 ** (t.gain_db / 20)
        fam = fams.setdefault(t.family, [np.zeros((L, 2), np.float32), np.zeros(L, np.float32)])
        if t.family not in order:
            order.append(t.family)
        fam[0] += dry
        fam[1] += dry.mean(1) * t.send
        print("  %-18s %3d notes  peak %.3f" % (name, len(data["notes"]), float(np.abs(dry).max())), flush=True)
    hp = signal.butter(2, 28, "high", fs=S.SR, output="sos")
    w0, q, a = 2 * np.pi * 3200 / S.SR, 0.7, 10 ** (-2.5 / 40)
    al = np.sin(w0) / (2 * q)
    bq = (np.array([1 + al * a, -2 * np.cos(w0), 1 - al * a]) / (1 + al / a), np.array([1, -2 * np.cos(w0) / (1 + al / a), (1 - al / a) / (1 + al / a)]))
    g = gate()
    stems = {}
    for fam in order:
        dry, send = fams[fam]
        wet = np.stack([signal.fftconvolve(send, ir[:, c])[:L] for c in range(2)], 1)
        x = signal.sosfilt(hp, dry + wet, axis=0)
        x = signal.lfilter(bq[0], bq[1], x, axis=0)
        stems[fam] = (x * g)[:S.N].astype(np.float64)
    mix = sum(stems.values())
    cut = int(1500 * S.SR / S.FPS)
    tp_old = float(np.abs(signal.resample_poly(mix[:cut], 4, 1, axis=0)).max())
    tp = float(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
    k = 10 ** (S.PEAK_DBFS / 20) / tp_old
    print("ending's true peak at v2's gain: %.2f dBFS" % (20 * np.log10(tp * k)))
    if tp * k > 10 ** (-1.0 / 20):
        raise SystemExit("the ending would peak above -1 dBFS at v2's gain: lower its notes")
    os.makedirs(os.path.join(S.AUDIO, "score-stems"), exist_ok=True)
    sf.write(os.path.join(S.AUDIO, "score.wav"), mix * k, S.SR, subtype="PCM_24")
    for fam, x in stems.items():
        sf.write(os.path.join(S.AUDIO, "score-stems", "score-%s.wav" % fam), x * k, S.SR, subtype="PCM_24")
    print("score.wav: %d samples (%.3f s), master gain %.2f dB (v2's)" % (S.N, S.N / S.SR, 20 * np.log10(k)))

if __name__ == "__main__":
    os.makedirs(S.AUDIO, exist_ok=True)
    write_midi(compose(), S.MID)
    print("wrote", S.MID)
    if "--midi" not in sys.argv:
        render()
