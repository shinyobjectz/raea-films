#!/usr/bin/env python3
"""Measure assets/audio/score.wav against the film's clock. Prints a report; images go to out/score-check/.

  python -I scripts/score_check.py     (after scripts/score.py and scripts/score.py --tuning)
"""
import os, re, sys, glob, subprocess
import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import score as S

FF = "/opt/homebrew/bin/ffmpeg"
WAV = os.path.join(S.AUDIO, "score.wav")
OUT = os.path.join(S.PROJ, "out", "score-check")
STARS = [165, 534, 740, 822, 896, 1150, 1322]
db = lambda v: 20 * np.log10(max(float(v), 1e-12))


def ff(*args):
    return subprocess.run([FF, "-hide_banner", "-nostats", *args], capture_output=True, text=True).stderr


def main():
    os.makedirs(OUT, exist_ok=True)
    info = sf.info(WAV)
    x, sr = sf.read(WAV, always_2d=True)
    print("FILE  %s  %d Hz  %d ch  %s  %d samples = %.4f s" % (os.path.basename(WAV), sr, x.shape[1], info.subtype, len(x), len(x) / sr))

    # ---- ffmpeg astats
    st = ff("-i", WAV, "-af", "astats", "-f", "null", "-")
    ov = st[st.find("Overall"):]
    for k in ("DC offset", "Min level", "Max level", "Peak level dB", "RMS level dB", "Flat factor", "Peak count", "Number of NaNs"):
        m = re.search(re.escape(k) + r":\s*(\S+)", ov)
        print("ASTATS overall %-16s %s" % (k, m.group(1) if m else "?"))
    tp = np.abs(signal.resample_poly(x, 4, 1, axis=0)).max()
    print("PEAK  sample %.2f dBFS, 4x-oversampled true peak %.2f dBFS" % (db(np.abs(x).max()), db(tp)))
    run, where = 0, 0
    for c in range(x.shape[1]):  # runs of identical consecutive samples well above silence: a clipped flat top
        same = (np.diff(x[:, c]) == 0) & (np.abs(x[1:, c]) > 0.02)
        edges = np.flatnonzero(np.diff(np.concatenate([[0], same.astype(int), [0]]))).reshape(-1, 2)
        if len(edges):
            k = int((edges[:, 1] - edges[:, 0]).argmax())
            if edges[k, 1] - edges[k, 0] + 1 > run:
                run, where = int(edges[k, 1] - edges[k, 0] + 1), int(edges[k, 0])
    print("FLAT  longest run of identical consecutive samples above -34 dBFS: %d (at f%d; a clipped flat top is 3 or more)" % (run, where * 30 // sr))
    print("DC    mean L %.2e  R %.2e (full scale = 1)" % (x[:, 0].mean(), x[:, 1].mean()))

    # ---- images
    ff("-y", "-i", WAV, "-lavfi", "showspectrumpic=s=1590x512:legend=1:scale=log:fscale=log:start=20:stop=20000:drange=100", os.path.join(OUT, "spectrogram.png"))

    # ---- ebur128
    eb = ff("-i", WAV, "-af", "ebur128=peak=true", "-f", "null", "-")
    rows = [(float(a), float(b), float(c)) for a, b, c in re.findall(r"t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|nan)\s+S:\s*(-?[\d.]+|nan)", eb)]
    integ = re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)
    lra = re.findall(r"LRA:\s+(-?[\d.]+) LU", eb)
    print("EBUR128 integrated %s LUFS, loudness range %s LU" % (integ[-1] if integ else "?", lra[-1] if lra else "?"))
    t = np.array([r[0] for r in rows]); M = np.array([r[1] for r in rows]); St = np.array([r[2] for r in rows])
    M = np.where(np.isnan(M), -120, M); St = np.where(np.isnan(St), -120, St)
    print("LOUDNESS over time (ebur128; M = momentary 400 ms, S = short-term 3 s, at the window's end)")
    for f0 in range(0, 1590, 30):
        i = np.argmin(np.abs(t - (f0 + 30) / 30))
        print("  f%4d-%4d  M %6.1f  S %6.1f  %s" % (f0, f0 + 30, M[i], St[i], "#" * int(max(0, (M[i] + 70) / 1.5))))

    def smax(f0, f1):  # short-term windows lying wholly inside [f0, f1]
        k = (t >= f0 / 30 + 3.0) & (t <= f1 / 30)
        return St[k].max() if k.any() else float("nan")

    def mrange(f0, f1):
        k = (t >= f0 / 30 + 0.4) & (t <= f1 / 30)
        return M[k].max(), M[k].mean()

    clim = M[(t >= 1322 / 30) & (t <= 1322 / 30 + 1.0)].max()
    print("CLIMAX momentary max in the second after f1322: %.1f LUFS; short-term max over f1322-1470: %.1f LUFS" % (clim, smax(1322, 1470)))
    em, ea = mrange(940, 1118)
    print("EBB   f940-1118 momentary max %.1f, mean %.1f LUFS; short-term max (windows inside f940-1150) %.1f LUFS" % (em, ea, smax(940, 1150)))
    print("EBB   below the climax by %.1f LU (momentary max vs max), %.1f LU (short-term max vs max)" % (clim - em, smax(1322, 1470) - smax(940, 1150)))

    # ---- per-frame level, silences, peaks at the starred frames
    n = sr // 30
    fr = x[:1590 * n].reshape(1590, n, 2)
    rms = np.sqrt((fr ** 2).mean((1, 2)))
    pk = np.abs(fr).max((1, 2))
    d = np.array([db(v) for v in rms])
    print("SILENCE f0-162: max |sample| %.1e;  f336-530: max |sample| %.1e;  f1561-1589: max |sample| %.1e" % (pk[:163].max(), pk[336:531].max(), pk[1561:].max()))
    print("WAKE  f163-335: peak %.1f dBFS, loudest frame f%d at %.1f dB RMS; last frame above -70 dB RMS: f%d" % (db(pk[163:336].max()), 163 + d[163:336].argmax(), d[163:336].max(), 163 + np.flatnonzero(d[163:336] > -70).max()))
    print("END   last frame above -60 dB RMS: f%d; above -70: f%d" % (np.flatnonzero(d > -60).max(), np.flatnonzero(d > -70).max()))
    print("STARS per-frame RMS (33 ms frames): the loudest frame within 8 frames of each star")
    for s in STARS:
        w = d[s - 8:s + 9]
        print("  f%4d: loudest f%4d (%+d)  %.1f dB;  3 frames before the star %.1f dB, at it %.1f, 6 after %.1f, 12 after %.1f"
              % (s, s - 8 + w.argmax(), w.argmax() - 8, w.max(), d[s - 3], d[s], d[s + 6], d[s + 12]))
    print("LEVEL per-frame RMS, mean over each second (dB):")
    print("  " + " ".join("%5.0f" % db(np.sqrt((rms[i:i + 30] ** 2).mean())) for i in range(0, 1590, 30)))

    # ---- harshness: share of energy in 2-5 kHz, and the spectrum's balance
    f, tt, Z = signal.stft(x.mean(1), sr, nperseg=4096, noverlap=2048)
    Pw = np.abs(Z) ** 2
    band = lambda lo, hi: Pw[(f >= lo) & (f < hi)].sum(0)
    tot = Pw.sum(0)
    loud = tot > tot.max() * 1e-3
    print("BAND  energy share over the whole cue: <200 Hz %.1f%%, 200-2k %.1f%%, 2-5k %.2f%%, 5-10k %.3f%%, >10k %.4f%%"
          % tuple(100 * band(a, b).sum() / tot.sum() for a, b in [(0, 200), (200, 2000), (2000, 5000), (5000, 10000), (10000, 24000)]))
    r25 = 10 * np.log10(band(2000, 5000)[loud] / tot[loud])
    print("BAND  2-5 kHz relative to total, in the loud parts: median %.1f dB, worst %.1f dB at f%d" % (np.median(r25), r25.max(), int(tt[loud][r25.argmax()] * 30)))

    # ---- clicks: broadband spikes above 10 kHz at note starts and ends
    hp = signal.sosfilt(signal.butter(4, 10000, "high", fs=sr, output="sos"), x.mean(1))
    hop = sr // 500
    e = np.abs(hp[:len(hp) // hop * hop]).reshape(-1, hop).max(1)
    midi = S.read_midi(S.MID)
    kinds = {t.name: S.INSTRUMENTS[t.inst]["kind"] for t in S.compose()}
    res = {}
    for name, data in midi.items():
        for (t0, t1, p, v) in data["notes"]:
            for label, at in ((kinds[name] + " start", t0), (kinds[name] + " end", t1), (kinds[name] + " release end", t1 + 0.38)):
                i = int(at * 500)
                if i < 80 or i > len(e) - 80:
                    continue
                spike = e[i - 3:i + 4].max()
                around = np.median(np.concatenate([e[i - 75:i - 5], e[i + 6:i + 76]]))
                res.setdefault(label, []).append((db(spike) - db(around), db(spike), at, name))
    print("CLICKS level above 10 kHz within 6 ms of each note boundary, against the median of the 150 ms around it")
    for label in sorted(res):
        worst = max(res[label])
        print("  %-17s %4d boundaries: worst +%.1f dB (spike %.1f dBFS) at %.2f s f%d, %s" % (label, len(res[label]), worst[0], worst[1], worst[2], int(worst[2] * 30), worst[3]))
    dx = np.abs(np.diff(x, axis=0)).max(1)
    i = int(dx.argmax())
    print("STEP  largest sample-to-sample step %.4f FS at f%d (peak amplitude %.4f)" % (dx[i], i * 30 // sr, np.abs(x).max()))

    # ---- stems
    stems = sorted(glob.glob(os.path.join(S.AUDIO, "score-stems", "*.wav")))
    tot = sum(sf.read(p, always_2d=True)[0] for p in stems)
    print("STEMS %s; max |sum of stems - mix| = %.2e" % (", ".join(os.path.basename(p) for p in stems), np.abs(tot - x).max()))
    for p in stems:
        y = sf.read(p, always_2d=True)[0]
        print("  %-24s peak %6.1f dBFS  rms %6.1f dB" % (os.path.basename(p), db(np.abs(y).max()), db(np.sqrt((y ** 2).mean()))))

    # ---- tuning: one dry A per instrument against 440 Hz and its octaves
    print("TUNING (dry A per instrument; FFT peak of the fundamental, parabolic interpolation)")
    for p in sorted(glob.glob(os.path.join(OUT, "tuning", "*.wav"))):
        y, sr2 = sf.read(p, always_2d=True)
        y = y.mean(1)
        note = int(re.search(r"-(\d+)\.wav$", p).group(1))
        f0 = 440 * 2 ** ((note - 69) / 12)
        a = int(0.2 * sr2) + int(0.25 * sr2)
        seg = y[a:a + int(2.0 * sr2)]
        nfft = 1 << 20
        sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), nfft))
        lo, hi = int(f0 * 0.94 * nfft / sr2), int(f0 * 1.06 * nfft / sr2)
        k = lo + int(sp[lo:hi].argmax())
        al, be, ga = np.log(sp[k - 1]), np.log(sp[k]), np.log(sp[k + 1])
        fpk = (k + 0.5 * (al - ga) / (al - 2 * be + ga)) * sr2 / nfft
        print("  %-22s target %7.2f Hz  measured %7.2f Hz  %+5.1f cents" % (os.path.basename(p), f0, fpk, 1200 * np.log2(fpk / f0)))


if __name__ == "__main__":
    main()
