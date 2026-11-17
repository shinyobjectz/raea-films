#!/usr/bin/env python3
"""The v4 score: a mysterious opening from the first frame that turns, at the Return, into v2's theme (note for note
from there to the dusk, as v2 and v3 had it), then v3's ending re-timed to v4's picture, with the ground's opening
built up under it. The same sampled instruments through the same hall. Writes assets/audio/v4/score.mid, score.wav
and score-stems/.

  /tmp/ivyenv/bin/python -I scripts/score_v4.py [--midi]

On the film's clock (components/timeline.ts T):
  0-165       the dead swamp: D minor with its ninth, very soft; a thin high E on the violins, the harp and a high
              piano picking out single notes, uncertain
  165 wake    v2's soft low D; the harp rolls up as the glass lights; celli pizzicato start to walk
  247-411     the harmony drifts over the D pedal: B-flat (its E held, Lydian), then G minor with E (Dorian)
  411-532     typing: A suspended, then A7 with a flat ninth; the pizzicato in eighths, a timpani roll into the Return
  532 Return  the swell starts with the key and builds through the close on the typed line arriving; at 566, as the
              pulse of light runs out over the swamp, it blooms in D major: a harp glissando, the timpani, the piano
              sparkling down; v2's low D under the slam, its pulse at 572 as before
  572-1500    v2's theme, unchanged
  1518 tremor a timpani roll and the basses' low A creep in under the shaking
  1530 crack  the low A pedal struck; the roll and a chromatic climb build to the blast
  1566 blast  the whole orchestra hits on A
  1586 beam   horns and a spiccato drive on A (v3's)
  1620 rise   strings climb in D Lydian into the white (v3's)
  1704 white  D major add9 at full width as space opens (v3's)
  1776 strike G over D as the ship lights (v3's)
  1830 port   a climb on A into the white; cut dead at 1890
  1890-2325   no score: the arrival and the review room
  2325 end    the dusk theme on the horn; B minor as the robot sighs (2364); strings rise as the camera tilts to the
              stars (2425); D major on the logo (2455), held and faded to the end (2545)
"""
import os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import score as S  # noqa: E402

S.AUDIO = os.path.join(S.PROJ, "assets", "audio", "v4")
S.MID = os.path.join(S.AUDIO, "score.mid")
S.FRAMES = 2545
S.N = S.FRAMES * S.SR // S.FPS

# the clock: v2's anchors to 1500 (so everything from the Return to the dusk is unchanged), then the ending's events
S.ANCHORS = [a for a in S.ANCHORS if a[0] <= 1500] + [
    (1530, 42), (1586, 43), (1620, 44), (1704, 47), (1776, 50), (1890, 54.5), (2325, 67), (2455, 71), (2545, 73.8),
    (2640, 77)]
S._AF = np.array([a[0] for a in S.ANCHORS], float)
S._AB = np.array([a[1] for a in S.ANCHORS], float)
B = lambda frame: float(np.interp(frame, S._AF, S._AB))  # a film frame's beat

# the sustained strings' and horns' arc: the opening's (new), v2's from the Return to the dusk, then the ending's
INTRO_ARC = [(-28.0, 0), (-26.5, .16), (-24.0, .20), (-21.0, .19), (-20.0, .26), (-18.5, .24), (-16.0, .21),
             (-12.0, .22), (-9.0, .21), (-6.0, .26), (-4.0, .33), (-2.6, .44), (-2.15, .48), (-2.0, .42),
             (-1.0, .52), (-0.36, .70), (0.0, .54), (1.0, .36)]
S.ARC = INTRO_ARC + [a for a in S.ARC if 1.0 < a[0] <= 41.0] + [
    (41.45, .05), (41.6, .14), (42.0, .50), (42.1, .44), (42.6, .96), (42.66, 1.0), (42.8, .58), (43.0, .56),
    (44.0, .60), (45.0, .70), (46.0, .84), (47.0, 1.0),
    (47.8, .80), (49.0, .62), (49.6, .72), (50.0, .96), (50.7, .78), (51.5, .62), (52.25, .58), (53.0, .72),
    (54.0, .92), (54.3, 1.0), (54.48, 1.0), (54.5, 0), (66.95, 0), (67.0, .30), (67.8, .44), (68.4, .52),
    (68.6, .50), (69.6, .52), (70.1, .56), (70.6, .74), (71.0, .92), (72.0, .80), (73.0, .66), (74.0, .52),
    (74.6, .40)]

_compose = S.compose
OLD = {}  # each track's notes as v2 wrote them: they keep v2's random stream, so v2's part plays exactly as before


def compose():
    tracks = _compose()
    for t in tracks:
        OLD[t.name] = set(t.notes)
    v1, v2, va, vas, vap, vc, vcm, vcs, vcp, cb, hn, hp, pf, tp = tracks

    # ================================================================ the opening (frames 0-532)
    # ---- 0-165 the dead swamp: D minor with its ninth; a thin high E on the violins over everything to 411
    cb.n(-28, 7.7, "D2", 46); vc.n(-28, 7.7, "D2", 44)
    va.n(-27, 10.85, "A3", 44)
    v2.n(-25, 8.85, "F4", 42)
    v1.n(-24, 15.8, "E5", 40)
    for b, p, v in [(-26, "D3", 50), (-25, "A3", 46), (-24, "F4", 50), (-22.5, "E5", 44)]:
        hp.n(b, 3, p, v)
    for b, p, v in [(-25.5, "A5", 40), (-23.5, "E6", 36), (-22, "D6", 40), (-21, "F5", 36)]:
        pf.n(b, 3, p, v)

    # ---- 165 the wake: (v2's soft low D on the celli and basses) the harp rolls up as the glass lights; the celli
    # start to walk, pizzicato
    hp.roll(-20, ["D2", "A2", "D3", "E3", "A3", "D4"], 46, 58, spread=0.06, dur=4)
    pf.n(-20, 3, ["D4", "A4", "E5"], 34, tight=True)
    walk = [(-19, "D3"), (-18, "A2"), (-17, "F3"), (-16, "D3"), (-15, "Bb2"), (-14, "F3"), (-13, "D3"), (-12, "G2"),
            (-11, "D3"), (-10, "Bb2"), (-9, "D3")]
    for i, (b, p) in enumerate(walk):
        vcp.n(b, 1, p, 46 + (i % 2) * 4)
    for b, p, v in [(-18, "A5", 38), (-16.5, "E6", 34)]:
        pf.n(b, 3, p, v)

    # ---- 247-329 B-flat over the D pedal, the E held: Lydian, unresolved
    cb.n(-16.8, 8.7, "D2", 46)
    vc.n(-16.8, 4.7, "A2", 44); vc.n(-12, 3.9, "G2", 46)
    va.n(-16, 7.9, "Bb3", 44)
    v2.n(-16, 3.9, ["D4", "F4"], 42); v2.n(-12, 3.9, "G4", 44)
    for b, p, v in [(-15, "Bb3", 48), (-14.5, "F4", 46), (-14, "D5", 46)]:
        hp.n(b, 3, p, v)
    for b, p, v in [(-13.5, "F6", 36), (-12.5, "D6", 34)]:
        pf.n(b, 3, p, v)

    # ---- 329-411 G minor with its sixth (the E again): Dorian; a distant horn
    hn.n(-12, 3.0, "A3", 44)
    for b, p, v in [(-11, "G3", 48), (-10.5, "D4", 46), (-10, "Bb4", 46), (-9.5, "E5", 44)]:
        hp.n(b, 3, p, v)
    for b, p, v in [(-10, "G5", 36), (-9, "E6", 34)]:
        pf.n(b, 3, p, v)

    # ---- 411-532 typing: A with a suspended fourth, then A7 with a flat ninth, building to the Return
    cb.n(-8, 5.8, "A1", 50); vc.n(-8, 5.8, ["A2", "E3"], 48)
    va.n(-8, 2.9, "D4", 46); va.n(-5, 2.8, "C#4", 54)
    v2.n(-8, 2.9, "E4", 44); v2.n(-5, 2.8, "G4", 54)
    v1.line(-8.2, [("E5", 2.2, 44), ("F5", 2.0, 50), ("E5", 2.0, 58)], overlap=0.06)
    hn.n(-4, 1.9, ["A3", "E4"], 50)
    for i, b in enumerate(np.arange(-8, -2.5, 0.5)):
        vcp.n(float(b), 0.5, "A2" if i % 2 == 0 else "E3", int(46 + 34 * i / 10))
    for b, p, v in [(-7, "A3", 48), (-6.5, "D4", 46), (-6, "E4", 48), (-5.5, "A4", 48), (-4.5, "C#5", 52), (-3.5, "E5", 54)]:
        hp.n(b, 3, p, v)
    for b, p, v in [(-7.5, "A5", 40), (-6, "F6", 40), (-5, "E6", 42), (-4, "C#6", 46), (-3, "E6", 48)]:
        pf.n(b, 2.5, p, v)
    for i, b in enumerate(np.arange(-3.5, -2.1, 1 / 8)):
        tp.n(float(b), 0.5, "A2", int(30 + 40 * i / 11))

    # ---- 532 the Return: the swell starts with the key, builds through the close on the typed line arriving, and
    # blooms in D major on the pulse of light at 566 (v2's low D under the slam; its pulse at 572 as before)
    bloom = B(566)
    tp.n(-2.05, 2, "D3", 60, tight=True)
    pf.n(-2.05, 3, ["D2", "A2", "D3"], 50, tight=True)
    hp.roll(-1.3, ["D3", "F#3", "A3", "D4", "F#4", "A4"], 40, 60, spread=0.1, dur=2.5)
    v1.line(-2.0, [("F#5", 0.95, 60), ("A5", 2.6, 70)])
    v2.n(-2.0, 1.05, "D5", 58); v2.n(-1.0, 1.9, "F#5", 64)
    va.n(-2.0, 2.6, ["D4", "A4"], 58)
    hn.n(-1.2, 2.2, ["D4", "A4"], 56)
    for i, b in enumerate(np.arange(-1.25, bloom - 0.03, 1 / 16)):
        tp.n(float(b), 0.25, "D3", int(28 + 36 * (b + 1.25) / (bloom + 1.25)))
    # the bloom: a harp glissando landing on it, the timpani's stroke, the piano sparkling down after it
    hp.roll(bloom, ["D3", "E3", "F#3", "G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5", "E5",
                    "F#5", "A5", "D6"], 50, 98, spread=1 / 40, dur=3)
    tp.n(bloom, 2, "D3", 74, tight=True)
    pf.n(bloom, 3, ["D2", "A2", "F#3"], 58, tight=True)
    pf.pulse(bloom + 0.05, 0.22, ["F#6", "D6", "A5", "F#5", "D5", "A4", "F#4"], 66, 40, accent=0, dur=1.6)

    # ================================================================ the ending (v3's, re-timed, the opening rebuilt)
    # ---- 1518 the tremor: a timpani roll and the basses' low A creep in under the shaking
    t0 = B(1518)
    cb.n(t0, 42 - t0 + 0.64, "A1", 70)
    for i, b in enumerate(np.arange(t0, 42.0, 1 / 16)):
        tp.n(float(b), 0.25, "A2", int(28 + 30 * (b - t0) / (42 - t0)))

    # ---- 1530 the crack: the low A pedal struck; the roll and a chromatic climb build to the blast
    blast = B(1566)
    pf.n(42, 4, ["A0", "A1", "E2"], 84, tight=True)
    vc.n(42, blast - 42, ["A2", "E3"], 76)
    va.n(42, blast - 42, "A3", 62)
    v2.n(42.2, blast - 42.2, "E4", 60)
    v1.line(42.0, [("A4", .08, 60), ("Bb4", .08, 64), ("B4", .08, 68), ("C5", .08, 72), ("C#5", .08, 76), ("D5", .08, 80),
                   ("Eb5", .08, 84), ("E5", blast - 42 - 7 * .08, 90)], overlap=0.02)
    for i, b in enumerate(np.arange(42.05, blast - 0.02, 1 / 16)):
        tp.n(float(b), 0.25, "A2", int(46 + 60 * (b - 42) / (blast - 42)))

    # ---- 1566 the blast: the whole orchestra hits on A
    pf.n(blast, 3, ["A0", "A1", "E2", "A2"], 112, tight=True)
    tp.n(blast, 2, "A2", 118, tight=True)
    cb.n(blast, 0.6, "A1", 104); vc.n(blast, 0.6, ["A2", "E3"], 104)
    va.n(blast, 0.5, ["A3", "E4"], 100); v2.n(blast, 0.5, ["C#5", "E5"], 100); v1.n(blast, 0.5, "A5", 104)
    hn.n(blast, 0.6, ["A3", "E4", "A4"], 104)
    hp.roll(blast, ["A1", "E2", "A2", "C#3", "E3", "A3"], 90, 110, spread=0.02, dur=2)

    # ---- 1586 the beam stands: horns, a drive on A (v3's)
    tp.n(43, 2, "A2", 88, tight=True)
    hn.n(43, 3.0, ["A3", "E4"], 76)
    vc.n(44, 2.0, ["A2", "E3"], 74)
    va.n(44, 1.0, ["C#4", "E4"], 66); va.n(45, 1.0, ["D4", "F#4"], 70)
    v2.n(43, 2.0, "A4", 66); v2.n(45, 1.0, "B4", 70)
    vcs.pulse(43, .5, ["A2", "E3"] * 6, 58, 92)
    vas.pulse(44, .5, ["C#4", "E4", "C#4", "E4"], 54, 78)
    hp.roll(43, ["A1", "E2", "A2", "C#3", "E3", "A3"], 70, 86, spread=0.04)

    # ---- 1620-1704 the rise: D Lydian over E/D, climbing into the white (v3's)
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

    # ---- 1704 the white, 1710 orbit: D major with its ninth, as wide as the scoring stage is (v3's)
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

    # ---- 1776 the strike: G over D as the ship lights; then A (v3's)
    pf.n(50, 5, ["G1", "G2", "D3"], 96, tight=True); pf.n(50, 4, ["B3", "D4", "G4"], 74, tight=True)
    cb.n(50, 2.0, "G1", 98); cb.n(52, 0.25, "A1", 72)
    vc.n(50, 2.0, ["G2", "D3"], 96); vc.n(52, 0.25, ["A2", "E3"], 72)
    va.n(50, 2.0, ["B3", "D4", "G4"], 94); va.n(52, 0.25, ["C#4", "E4"], 70)
    v2.n(50, 2.0, ["B4", "D5"], 94); v2.n(52, 0.25, ["C#5", "E5"], 70)
    v1.line(50, [("D6", 1.0, 100), ("B5", .5, 86), ("A5", .5, 80), ("G5", .5, 76), ("F#5", .5, 72), ("E5", .25, 70)])
    hn.n(50, 2.0, ["G3", "B3", "D4"], 94); hn.n(52, 0.25, ["A3", "E4"], 72)
    tp.n(50, 3, "G2", 110, tight=True)
    hp.roll(50, ["G1", "D2", "G2", "B2", "D3", "G3", "B3", "D4", "G4", "B4", "D5", "G5"], 96, 112, spread=0.026, dur=4)

    # ---- 1830-1890 into the port: a climb on A, a roll, everything into the white; the gate cuts it at 1890 (v3's)
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

    # ---- 2325 the end: the dusk theme on the horn over soft strings; B minor as the robot sighs (2364); the strings
    # rise as the camera tilts to the stars (2425); D major on the logo (2455), held to the end
    hold = 3.4
    cb.n(67, 1.5, "D2", 60); cb.n(68.5, 1.0, "B1", 64); cb.n(69.5, 0.75, "G1", 66); cb.n(70.25, 0.75, "A1", 70)
    cb.n(71, hold, "D2", 80)
    vc.n(67, 1.5, ["D2", "A2"], 60); vc.n(68.5, 1.0, ["B2", "F#3"], 64); vc.n(69.5, .75, ["G2", "D3"], 66)
    vc.n(70.25, .75, ["A2", "E3"], 70); vc.n(71, hold, ["D2", "A2", "D3"], 82)
    va.n(67, 1.5, ["F#3", "A3"], 58); va.n(68.5, 1.0, ["D4", "F#4"], 62); va.n(69.5, .75, ["B3", "D4"], 64)
    va.n(70.25, .75, ["C#4", "E4"], 68); va.n(71, hold, ["F#3", "A3", "D4"], 80)
    v2.n(67, 1.5, "D5", 56); v2.n(68.5, 1.0, "B4", 60); v2.n(69.5, .75, "B4", 62); v2.n(70.25, .75, ["A4", "C#5"], 66)
    v2.n(71, hold, ["A4", "D5"], 80)
    v1.line(68, [("F#5", 1.5, 64), ("D5", .75, 62), ("E5", .4, 66)])
    v1.line(70.15, [("A4", .17, 64), ("B4", .17, 68), ("C#5", .17, 72), ("D5", .17, 76), ("E5", .17, 80)], overlap=0.02)
    v1.n(71, hold, ["F#5", "A5"], 80)
    hn.line(67.5, [("A3", 1.0, 60), ("F#4", 1.5, 68), ("G4", .5, 64), ("E4", .5, 62), ("D4", hold, 74)])
    hp.pulse(67.0, .25, ["D3", "A3", "D4", "F#4", "A4", "D5"], 54, 64, dur=2)
    hp.pulse(68.5, .25, ["B2", "F#3", "B3", "D4", "F#4"], 56, 62, dur=2)
    hp.pulse(69.5, .25, ["G2", "D3", "G3", "B3"], 56, 60, dur=2)
    hp.roll(71, ["D2", "A2", "D3", "F#3", "A3", "D4", "F#4", "A4", "D5", "F#5", "A5"], 74, 92, spread=0.035, dur=4)
    pf.n(71, 4, ["D1", "D2"], 70, tight=True); pf.n(71, 4, ["A3", "D4", "F#4"], 58, tight=True)
    pf.n(72, 2.5, "A5", 46); pf.n(72.5, 2.5, "D6", 42); pf.n(73.2, 2.0, "E6", 38)
    tp.n(71, 2, "D3", 70, tight=True)
    return tracks


S.compose = compose


def gate():
    """the score from the first frame; cut dead into the white at 1890; back at 2325; faded out with the picture"""
    g = np.ones(S.N + 4 * S.SR, np.float32)
    f = lambda fr: int(fr * S.SR / S.FPS)
    g[:f(12)] = S.half_cos(f(12))
    g[f(1889.4):f(1890)] = S.half_cos(f(1890) - f(1889.4), False)
    g[f(1890):f(2325)] = 0
    g[f(2505):f(2545)] = S.half_cos(f(2545) - f(2505), False)
    g[f(2545):] = 0
    return g[:, None]


S.gate = gate

NEW_FROM = 41.4  # beats from here on are the ending's


def write_midi(tracks, path):
    """score.write_midi with three random streams: v2's notes keep v2's (so they play exactly as before), the opening
    takes its own, the ending its own"""
    mido = S.mido
    rng_old, rng_new, rng_open = (np.random.default_rng(s) for s in (20261116, 20261117, 20261118))
    mf = mido.MidiFile(type=1, ticks_per_beat=S.PPQ)
    cond = mido.MidiTrack(); mf.tracks.append(cond)
    ev = [(0, mido.MetaMessage("track_name", name="Swamp hype score v4: tempo map", time=0)),
          (0, mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))]
    for (f0, b0), (f1, b1) in zip(S.ANCHORS, S.ANCHORS[1:]):
        ev.append((S.tick(b0), mido.MetaMessage("set_tempo", tempo=int(round((f1 - f0) / S.FPS / (b1 - b0) * 1e6)), time=0)))
    for f, name in [(0, "the dead swamp"), (165, "monitor wakes"), (532, "return: the swell"), (566, "bloom: the pulse of light"), (572, "v2 pulse"),
                    (740, "sunrise"), (822, "water clears"), (896, "leaves burst"), (940, "ebb"), (1150, "new version"),
                    (1322, "climax"), (1500, "last note"), (1518, "tremor"), (1530, "crack"), (1566, "blast"),
                    (1586, "beam"), (1620, "rise"), (1704, "white: orbit"), (1776, "strike"), (1830, "port"),
                    (1890, "cut: the arrival"), (2325, "the end"), (2364, "the robot sighs"), (2425, "tilt to the stars"),
                    (2455, "the logo")]:
        ev.append((S.tick(B(f)), mido.MetaMessage("marker", text="f%d %s" % (f, name), time=0)))
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
        for note in sorted(t.notes):
            b, d, p, v, tight = note
            rng = rng_new if b >= NEW_FROM else rng_old if note in OLD[t.name] else rng_open
            jb = 0.0 if tight else float(np.clip(rng.normal(0, t.jitter), -2.5 * t.jitter, 2.5 * t.jitter))
            vel = int(np.clip(v + (0 if tight else rng.integers(-4, 5)), 1, 127))
            on = max(0, S.tick(b + jb)); off = max(on + 10, S.tick(b + d + jb * 0.5))
            ev.append((on, mido.Message("note_on", channel=ch, note=p, velocity=vel, time=0)))
            ev.append((off, mido.Message("note_off", channel=ch, note=p, velocity=0, time=0)))
        S._emit(tr, ev)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mf.save(path)


def render():
    """score.render, with v2's master gain: the gain that brings the theme (frames 572-1500, as v2's score) to v2's
    -3.5 dBFS true peak, so that part comes out as v2's did"""
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
    a_, b_ = int(572 * S.SR / S.FPS), int(1500 * S.SR / S.FPS)
    tp_theme = float(np.abs(signal.resample_poly(mix[a_:b_], 4, 1, axis=0)).max())
    tp = float(np.abs(signal.resample_poly(mix, 4, 1, axis=0)).max())
    k = 10 ** (S.PEAK_DBFS / 20) / tp_theme
    print("whole score's true peak at v2's gain: %.2f dBFS" % (20 * np.log10(tp * k)))
    if tp * k > 10 ** (-1.0 / 20):
        raise SystemExit("the score would peak above -1 dBFS at v2's gain: lower its notes")
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
