#!/usr/bin/env python3
"""The v5 score: v4's score with a harder Return and a driving theme. The opening (0-532) and the ending (1518 on) are
v4's note for note; the same sampled instruments through the same hall. Writes assets/audio/v5/score.mid, score.wav
and score-stems/.

  /tmp/ivyenv/bin/python -I scripts/score_v5.py [--midi]

What changed from v4 (the director's notes on v4 at 0:19, "the rings don't help ... maybe just have the music ramp up faster
here", and 0:22, "the music is so slow and quiet, I need to hear it way more"):
  532 Return  the swell climbs from the key, not from the close: the strings' arc goes from about half to full in the
              34 frames to the bloom (v4's peaked at 0.7 there), a timpani roll grows from the key to the bloom (v4's
              started a beat later and stayed soft), the celli and violas spiccato climb a D major scale under it and
              the first violins run up an octave into the bloom
  566 bloom   it lands as a tutti D major: low piano octaves, the timpani's stroke, the horns, every string section,
              and v4's harp glissando and piano sparkle, louder. The picture's rings are gone, so this is the moment
  572-940     no fall back to v2's quiet start (its celli pulse at velocity 34-52 under a held low D). From the bloom
              a sixteenth-note ostinato drives under the theme through the tasks and the controls: celli and violas
              spiccato accented 3+3+2, a low cello pizzicato and the timpani on the accents, a low piano octave every
              two beats. The horns state the theme's head over it (2-8) before the violins take it at the sunrise
              (740, v2's). The strings' arc stays high (0.8-1.0, v2's ran 0.3-0.5 to 700), so the held chords sound
              in their loud layers. It thins at the water (822: the violas alone) and climbs again into the leaves
              (896), then winds down into v2's ebb at 940 as before
  1890        the cut into the white is a 0.12 s half-cosine fade, not v4's 20 ms one (raea check heard it stop dead)

Every note v4 had outside 532-940 is kept with the same random stream, so those parts play exactly as v4's did, and the
master gain is v4's (matched on 1050-1500, which no change reaches), so the sections compare directly with v4's file.
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import score_v4 as V4  # noqa: E402  (patches score: v4's clock, the ending's arc, its compose)
S = V4.S
B = V4.B

V4_WAV = os.path.join(S.PROJ, "assets", "audio", "v4", "score.wav")
S.AUDIO = os.path.join(S.PROJ, "assets", "audio", "v5")
S.MID = os.path.join(S.AUDIO, "score.mid")

BLOOM = B(566)  # -0.316

# the strings' and horns' arc: v4's to the Return, then high from the key through the controls, v2's from the ebb
arc4 = list(S.ARC)
S.ARC = [a for a in arc4 if a[0] < -2.15] + [
    (-2.15, .48), (-2.05, .52), (-1.4, .70), (-0.8, .88), (BLOOM - 0.06, 1.0), (BLOOM + 0.2, 1.0), (0.0, .88),
    (1.0, .82), (2.0, .80), (4.0, .84), (6.0, .88), (7.5, .96), (8.0, 1.0), (8.6, .94), (9.5, .88), (11.6, .84),
    (12.0, .74), (12.2, .70), (14.0, .80), (15.5, .94), (16.0, 1.0), (16.5, .96), (17.3, .90)] + [
    a for a in arc4 if a[0] >= 18.0]

V4NOTES = {}  # each track's notes as v4 wrote them, in v4's order, so their random draws are v4's
REMOVED = {}  # v4's notes that v5 drops (they still take their draw, so every note after them plays as in v4)
ADDED = {}    # v5's new notes: their own random stream
EMITTED = {}  # per track, every note write_midi drew: [on tick, off tick, pitch, velocity, "v4" | "dropped" | "v5"]


def ost(track, b0, b1, cells, v0, v1, acc=(0, 3, 6), accent=14, step=0.25):
    """A sixteenth-note ostinato from b0 to b1: `cells` per two beats (8 sixteenths), accented 3+3+2, a velocity ramp"""
    n = int(round((b1 - b0) / step))
    for i in range(n):
        v = v0 + (v1 - v0) * i / max(1, n - 1) + (accent if (i % 8) in acc else 0)
        track.n(b0 + i * step, step * 0.9, cells[i % len(cells)], int(min(124, v)))


def on_accents(track, b0, b1, pitches, v0, v1, acc=(0, 3, 6), step=0.25, tight=False, dur=0.5):
    """one note (or chord) on each accent of the 3+3+2 grouping from b0 to b1"""
    n = int(round((b1 - b0) / step))
    for i in range(n):
        if (i % 8) in acc:
            v = v0 + (v1 - v0) * i / max(1, n - 1) - (0 if i % 8 == 0 else 8)
            track.n(b0 + i * step, dur, pitches, int(v), tight=tight)


def compose():
    tracks = V4.compose()  # v4's notes (and V4.OLD: v2's)
    for t in tracks:
        V4NOTES[t.name] = list(t.notes)
    v1, v2, va, vas, vap, vc, vcm, vcs, vcp, cb, hn, hp, pf, tp = tracks

    # ---- drop: v4's Return swell and bloom (its notes from the key to the theme's first beat that v2 didn't have) and
    # v2's spiccato pulses from 572 to the ebb; the ostinato below takes their place
    for t in tracks:
        old = V4.OLD[t.name]
        drop = {nt for nt in t.notes
                if (-2.1 <= nt[0] < 1.0 and nt not in old) or (t.name in ("Violas spiccato", "Celli spiccato") and 0 <= nt[0] < 18)}
        REMOVED[t.name] = drop
        t.notes = [nt for nt in t.notes if nt not in drop]

    # ================================================================ 532 the Return: the swell from the key
    pf.n(-2.05, 0.35, ["D1", "D2", "A2"], 86, tight=True)
    tp.n(-2.05, 1, "D3", 94, tight=True)
    for b in np.arange(-1.95, BLOOM - 0.03, 1 / 16):
        x = (b + 1.95) / (BLOOM + 1.95)
        tp.n(float(b), 0.25, "D3", int(48 + 66 * x ** 1.4))
    # the celli and violas spiccato climb a D major scale; the first violins run up an octave into the bloom
    k = 8
    st = (BLOOM - (-2.0)) / k
    for i, (pc, pa) in enumerate(zip(["D3", "E3", "F#3", "G3", "A3", "B3", "C#4", "D4"],
                                     ["F#3", "G3", "A3", "B3", "C#4", "D4", "E4", "F#4"])):
        vcs.n(-2.0 + i * st, st, pc, int(74 + 40 * i / (k - 1)))
        vas.n(-2.0 + i * st, st, pa, int(68 + 40 * i / (k - 1)))
    # the held notes swell from the key through the bloom (the arc), and the bloom adds to them
    hold = 1.98 - (-2.0)
    v2.n(-2.0, hold, "A4", 74)
    va.n(-2.0, hold, "D4", 72)
    hn.n(-2.0, hold, ["D4", "A4"], 84)
    run = ["D5", "E5", "F#5", "G5", "A5", "B5", "C#6"]
    rs = 0.11
    v1.n(-2.0, BLOOM + 2.0 - len(run) * rs, "F#5", 70)
    v1.line(BLOOM - len(run) * rs, [(p, rs, int(74 + 28 * i / (len(run) - 1))) for i, p in enumerate(run)] +
            [("D6", 1.7, 104)], overlap=0.02)

    # ---- 566 the bloom: tutti D major (v2's low D on the celli and basses carries through it)
    pf.n(BLOOM, 0.3, ["D1", "D2", "A2", "D3"], 112, tight=True)
    tp.n(BLOOM, 2, "D3", 120, tight=True)
    vc.n(BLOOM, 2.3, ["A2", "D3"], 100)
    va.n(BLOOM, 2.3, ["A3", "F#4"], 100)
    v2.n(BLOOM, 2.3, ["D5", "F#5"], 100)
    hn.n(BLOOM, 2.3, ["D3", "F#3"], 100)
    hp.roll(BLOOM, ["D3", "E3", "F#3", "G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5", "E5",
                    "F#5", "A5", "D6"], 62, 112, spread=1 / 40, dur=3)
    pf.pulse(BLOOM + 0.05, 0.22, ["F#6", "D6", "A5", "F#5", "D5", "A4", "F#4"], 82, 52, accent=0, dur=1.6)

    # ================================================================ 572-940 the drive under the theme
    CELLI = {"D": ["D3", "D3", "A3", "D3", "D3", "A3", "D4", "A3"], "G": ["G2", "G2", "D3", "G2", "G2", "D3", "G3", "D3"],
             "A": ["A2", "A2", "E3", "A2", "A2", "E3", "A3", "E3"]}
    VIOLAS = {"D": ["F#4", "D4", "A3", "D4", "F#4", "D4", "A4", "D4"], "G": ["G4", "D4", "B3", "D4", "G4", "D4", "B4", "D4"],
              "A": ["E4", "C#4", "A3", "C#4", "E4", "C#4", "A4", "C#4"]}
    LOW = {"D": "D2", "G": "G2", "A": "A2"}
    TIMP = {"D": ("D3", "A2"), "G": ("G2", "D3"), "A": ("A2", "E3")}
    PIANO = {"D": ["D1", "D2"], "G": ["G1", "G2"], "A": ["A1", "A2"]}
    # (from, to, chord, celli v0-v1, violas v0-v1, pizzicato and timpani, piano stabs)
    plan = [(0, 4, "D", (70, 80), (64, 76), True, True),
            (4, 6, "G", (80, 86), (76, 82), True, True),
            (6, 8, "A", (86, 94), (82, 90), True, True),
            (8, 12, "D", (88, 84), (84, 80), True, True),        # 740 the sunrise: v2's bloom over it
            (12, 14, "G", None, (66, 72), False, False),          # 822 the water: lighter, the violas alone
            (14, 16, "A", (76, 100), (74, 96), True, True),       # climbing into the leaves
            (16, 18, "D", (98, 62), (90, 56), True, False)]       # 896 the leaves, winding down into the ebb
    V2_TIMP = {8.0, 16.0}  # v2's own timpani strokes (the sunrise, the leaves)
    for b0, b1, ch, cv, av, low, keys in plan:
        if cv:
            ost(vcs, b0, b1, CELLI[ch], *cv)
        ost(vas, b0, b1, VIOLAS[ch], *av)
        if low:
            on_accents(vcp, b0, b1, LOW[ch], (cv or av)[0] + 4, (cv or av)[1] + 4)
            for b in np.arange(b0, b1, 2.0):
                b = float(b)
                rolled = b1 in (8, 16) and b + 2.0 >= b1  # the last beat before the sunrise and the leaves is a roll
                for at, p, v in [(b, TIMP[ch][0], 92), (b + 0.75, TIMP[ch][1], 74), (b + 1.5, TIMP[ch][0], 80)]:
                    if (at == b and b in V2_TIMP) or (rolled and at >= b1 - 1.0):
                        continue
                    tp.n(at, 1, p, v, tight=True)
        if keys:
            for b in np.arange(b0, b1, 2.0):
                pf.n(float(b), 0.45, PIANO[ch], 84, tight=True)
    # timpani rolls into the sunrise (740) and the leaves (896)
    for b in np.arange(7.0, 8.0 - 0.03, 1 / 16):
        tp.n(float(b), 0.25, "A2", int(62 + 44 * (b - 7.0)))
    for b in np.arange(15.0, 16.0 - 0.03, 1 / 16):
        tp.n(float(b), 0.25, "A2", int(58 + 44 * (b - 15.0)))

    # the horns state the theme's head over the drive (the violins take the theme itself at the sunrise, v2's)
    hn.line(2.0, [("A3", .75, 86), ("D4", .25, 84), ("F#4", 1.0, 90), ("G4", 1.0, 92), ("F#4", .5, 86), ("D4", .5, 84),
                  ("E4", 1.5, 90), ("C#4", .45, 86)])
    # the violins fill the harmony over it (v2's violas, second violins and the first violins' E at 6.5 stay)
    v2.n(2.0, 2.0, ["F#4", "D5"], 80); v2.n(4.0, 2.0, ["G4", "D5"], 82); v2.n(6.0, 2.0, "C#5", 84)
    v1.n(4.0, 2.0, "B5", 82); v1.n(6.0, 2.0, "A5", 86)

    for t in tracks:
        before = {}
        for nt in V4NOTES[t.name]:
            before[nt] = before.get(nt, 0) + 1
        added = []
        for nt in t.notes:
            if before.get(nt, 0) > 0:
                before[nt] -= 1
            else:
                added.append(nt)
        ADDED[t.name] = added
    return tracks


S.compose = compose


def gate():
    """v4's gate (the score from the first frame, none from 1890 to 2325, faded out with the picture), with the cut into
    the white at 1890 a 0.12 s half-cosine fade"""
    g = np.ones(S.N + 4 * S.SR, np.float32)
    f = lambda fr: int(fr * S.SR / S.FPS)
    g[:f(12)] = S.half_cos(f(12))
    cut = int(0.12 * S.SR)
    g[f(1890) - cut:f(1890)] = S.half_cos(cut, False)
    g[f(1890):f(2325)] = 0
    g[f(2505):f(2545)] = S.half_cos(f(2545) - f(2505), False)
    g[f(2545):] = 0
    return g[:, None]


S.gate = gate


def write_midi(tracks, path):
    """v4's write_midi: v4's notes take v4's three random streams in v4's order (the dropped ones too, unplayed), so
    every kept note plays exactly as in v4; v5's new notes take a fourth stream"""
    mido = S.mido
    rng_old, rng_new, rng_open, rng_v5 = (np.random.default_rng(s) for s in (20261116, 20261117, 20261118, 20261119))
    mf = mido.MidiFile(type=1, ticks_per_beat=S.PPQ)
    cond = mido.MidiTrack(); mf.tracks.append(cond)
    ev = [(0, mido.MetaMessage("track_name", name="Swamp hype score v5: tempo map", time=0)),
          (0, mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))]
    for (f0, b0), (f1, b1) in zip(S.ANCHORS, S.ANCHORS[1:]):
        ev.append((S.tick(b0), mido.MetaMessage("set_tempo", tempo=int(round((f1 - f0) / S.FPS / (b1 - b0) * 1e6)), time=0)))
    for f, name in [(0, "the dead swamp"), (165, "monitor wakes"), (532, "return: the swell"), (566, "bloom: tutti D"),
                    (572, "the drive"), (740, "sunrise"), (822, "water clears"), (896, "leaves burst"), (940, "ebb"),
                    (1150, "new version"), (1322, "climax"), (1500, "last note"), (1518, "tremor"), (1530, "crack"),
                    (1566, "blast"), (1586, "beam"), (1620, "rise"), (1704, "white: orbit"), (1776, "strike"),
                    (1830, "port"), (1890, "cut: the arrival"), (2325, "the end"), (2364, "the robot sighs"),
                    (2425, "tilt to the stars"), (2455, "the logo")]:
        ev.append((S.tick(B(f)), mido.MetaMessage("marker", text="f%d %s" % (f, name), time=0)))
    S._emit(cond, ev)

    def emit(ev, ch, note, rng, jitter, play=True, origin="v4"):
        b, d, p, v, tight = note
        jb = 0.0 if tight else float(np.clip(rng.normal(0, jitter), -2.5 * jitter, 2.5 * jitter))
        vel = int(np.clip(v + (0 if tight else rng.integers(-4, 5)), 1, 127))
        on = max(0, S.tick(b + jb)); off = max(on + 10, S.tick(b + d + jb * 0.5))
        EMITTED[ch_name].append([on, off, p, vel, origin if play else "dropped"])
        if play:
            ev.append((on, mido.Message("note_on", channel=ch, note=p, velocity=vel, time=0)))
            ev.append((off, mido.Message("note_off", channel=ch, note=p, velocity=0, time=0)))

    for ch, t in enumerate(tracks):
        ch = ch if ch < 9 else ch + 1
        tr = mido.MidiTrack(); mf.tracks.append(tr)
        ev = [(0, mido.MetaMessage("track_name", name=t.name, time=0)),
              (0, mido.Message("program_change", channel=ch, program=t.program, time=0))]
        ch_name = t.name
        EMITTED[t.name] = []
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
        for note in sorted(V4NOTES[t.name]):
            rng = rng_new if note[0] >= V4.NEW_FROM else rng_old if note in V4.OLD[t.name] else rng_open
            emit(ev, ch, note, rng, t.jitter, play=note not in REMOVED[t.name])
        for note in sorted(ADDED[t.name]):
            emit(ev, ch, note, rng_v5, t.jitter, origin="v5")
        S._emit(tr, ev)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mf.save(path)


def split(name, notes):
    """The sampler cycles each instrument's recorded takes note by note, so a note's take depends on how many came
    before it. -> (v4's notes in v4's order, with each dropped one a silent stand-in far past the end so it still takes
    its turn; v5's new notes), so every kept note sounds on the take it had in v4."""
    em = EMITTED[name]
    played = sorted((i for i, e in enumerate(em) if e[4] != "dropped"), key=lambda i: (em[i][0], em[i][2], em[i][3]))
    by_on = sorted(notes, key=lambda n: (n[0], n[2], n[3]))
    assert len(played) == len(by_on), (name, len(played), len(by_on))
    sec = {}
    for i, n in zip(played, by_on):
        assert (em[i][2], em[i][3]) == (n[2], n[3]), name
        sec[i] = n
    v4_order = sorted((i for i, e in enumerate(em) if e[4] != "v5"), key=lambda i: tuple(em[i][:4]))
    v4_part = [sec[i] if em[i][4] == "v4" else (1e5, 1e5 + 1.0, em[i][2], em[i][3]) for i in v4_order]
    v5_part = sorted(sec[i] for i, e in enumerate(em) if e[4] == "v5")
    return v4_part, v5_part


def true_peak(x):
    return float(np.abs(S.signal.resample_poly(x, 4, 1, axis=0)).max())


def render():
    """score.render, with v4's master gain: the gain that gives frames 1050-1500 (v2's notes, which no v5 change
    reaches) the true peak they have in v4's score.wav"""
    sf, signal = S.sf, S.signal
    tracks = {t.name: t for t in compose()}
    midi = S.read_midi(S.MID)
    L = S.N + 4 * S.SR
    ir = S.hall_ir()
    fams, order = {}, []
    for name, data in midi.items():
        t = tracks[name]
        v4_part, v5_part = split(name, data["notes"])
        dry = sum(S.render_track(t.inst, part, data["cc"], L) for part in (v4_part, v5_part) if part)
        dry = S.place(dry, t.pan) * 10 ** (t.gain_db / 20)
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
    fr = lambda f: int(f * S.SR / S.FPS)
    v4, _ = sf.read(V4_WAV, dtype="float64", always_2d=True)
    k = true_peak(v4[fr(1050):fr(1500)]) / true_peak(mix[fr(1050):fr(1500)])
    tp = true_peak(mix) * k
    print("master gain %.2f dB (v4's, matched on 1050-1500); whole score's true peak %.2f dBFS" % (20 * np.log10(k), 20 * np.log10(tp)))
    for f0, f1 in [(532, 566), (566, 600), (600, 940), (940, 1518), (1518, 1890), (2325, 2545)]:
        print("  true peak %4d-%4d: %.2f dBFS" % (f0, f1, 20 * np.log10(true_peak(mix[fr(f0):fr(f1)]) * k)))
    if tp > 10 ** (-1.0 / 20):
        raise SystemExit("the score would peak above -1 dBFS at v4's gain: lower its notes")
    os.makedirs(os.path.join(S.AUDIO, "score-stems"), exist_ok=True)
    sf.write(os.path.join(S.AUDIO, "score.wav"), mix * k, S.SR, subtype="PCM_24")
    for fam, x in stems.items():
        sf.write(os.path.join(S.AUDIO, "score-stems", "score-%s.wav" % fam), x * k, S.SR, subtype="PCM_24")
    print("score.wav: %d samples (%.3f s)" % (S.N, S.N / S.SR))


if __name__ == "__main__":
    os.makedirs(S.AUDIO, exist_ok=True)
    write_midi(compose(), S.MID)
    print("wrote", S.MID)
    if "--midi" not in sys.argv:
        render()
