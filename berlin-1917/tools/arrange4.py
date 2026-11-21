# Berlin long cut v4's score from the Count You Too stems (the director 11-21: lyrics in the intro, instrumentals for effect).
# Film time from assets/rebuilt/vo4/timeline.json:
#   cold open  0-50.48        the song with its words, to its own stop
#   chapters   50.48-END      the instrumental, a different mix of the stems under each chapter, looped from downbeat
#                             to downbeat, 2 s crossfades at the chapter changes:
#                             photo: keys, strings and synth, soft; map/house: the bed (drums, percussion, guitar back);
#                             book/rooms: the bed, lighter; under: the song's low section, no drums; winter: soft again
#   ending     END-END+22.68  the low section; the vocals return at song 131.4 ("When the morning bell rings through")
#   coda       then 17.38     the last chorus; vocals back after the open-source line
import subprocess, sys, json, numpy as np
G = __import__('pathlib').Path(__file__).resolve().parent.parent.as_posix(); D = f"{G}/assets/rebuilt/stems"
TL = json.load(open(f"{G}/assets/rebuilt/vo4/timeline.json")); OUT = sys.argv[1]
SR = 48000
names = ["0 Lead Vocals", "1 Backing Vocals", "2 Drums", "3 Bass", "4 Guitar", "5 Keyboard", "6 Percussion", "7 Strings", "8 Synth"]
def load(n):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{D}/wav/{n}.wav", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
S = {n: load(n) for n in names}; N = min(len(v) for v in S.values())
for n in names: S[n] = S[n][:N]
i = lambda s: int(round(s * SR))
vox = S["0 Lead Vocals"] + S["1 Backing Vocals"]
def inst(g): return sum(S[n] * g.get(n, 1.0) for n in names[2:])
BED = {"2 Drums": 0.5, "6 Percussion": 0.45, "4 Guitar": 0.7}
MIX = {
    "photo": ({"2 Drums": 0, "6 Percussion": 0, "4 Guitar": 0.3, "3 Bass": 0.5, "8 Synth": 0.7}, 50.48, 117.98),
    "bed": (BED, 46.71, 117.98),
    "light": ({"2 Drums": 0.3, "6 Percussion": 0.25, "4 Guitar": 0.55}, 46.71, 117.98),
    "under": ({"2 Drums": 0, "6 Percussion": 0, "4 Guitar": 0.4, "5 Keyboard": 0.7}, 117.98, 140.66),
    "winter": ({"2 Drums": 0, "6 Percussion": 0.15, "4 Guitar": 0.35, "3 Bass": 0.7}, 46.71, 117.98),
}
def looped(key, length, start_at=None):
    g, a, b = MIX[key]; src = inst(g)[i(a):i(b)]
    first = src[i(start_at - a):] if start_at else src
    out = [first]; n = len(first); xf = i(0.04); w = np.linspace(0, 1, xf)[:, None]
    while n < i(length):
        prev = out[-1]; out[-1] = prev[:-xf]; out.append(np.concatenate([prev[-xf:] * (1 - w) + src[:xf] * w, src[xf:]])); n = sum(len(x) for x in out)
    return np.concatenate(out)[:i(length)]
sc = {s["id"]: s for s in TL["scenes"]}
END = TL["end_start"]; SHOW = TL["show"]
plan = [("photo", SHOW, sc["map"]["start"], 50.48), ("bed", sc["map"]["start"], sc["book"]["start"], None),
        ("light", sc["book"]["start"], sc["under"]["start"], None), ("under", sc["under"]["start"], sc["winter"]["start"], None),
        ("winter", sc["winter"]["start"], END, None)]
total = TL["total"]; film = np.zeros((i(total) + SR, 2), dtype=np.float32)
A = inst({})[:i(50.48)] + vox[:i(50.48)]; film[:len(A)] += A
XF = 2.0
def env(n, a, d, up):
    t = np.clip((np.arange(n) / SR - a) / d, 0, 1); e = t * t * (3 - 2 * t); return (e if up else 1 - e)[:, None]
for k, (key, a, b, st) in enumerate(plan):
    pad_in = 0 if k == 0 else XF / 2; pad_out = XF / 2
    seg = looped(key, (b - a) + pad_in + pad_out, st)
    n = len(seg)
    if k > 0: seg = seg * env(n, 0, XF, True)
    seg = seg * env(n, n / SR - XF, XF, False)
    s0 = i(a - pad_in); film[s0:s0 + n] += seg
# the ending: the low section, vocals in at song 131.4; the coda: the last chorus, vocals back at song 147.5
d_inst = inst(BED)[i(117.98):i(140.66)]; d_vox = vox[i(117.98):i(140.66)]
Dsec = d_inst + d_vox * env(len(d_vox), 131.4 - 117.98, 0.4, True)
Dsec[:i(XF / 2)] *= env(i(XF / 2), 0, XF / 2, True)
film[i(END):i(END) + len(Dsec)] += Dsec
e_inst = inst({})[i(140.66):N]; e_vox = vox[i(140.66):N]
E = e_inst + e_vox * env(len(e_vox), 147.5 - 140.66, 0.6, True)
s0 = i(END + 140.66 - 117.98); film[s0:s0 + len(E)] += E[:len(film) - s0]
film = film[:i(total)]
film[-i(1.5):] *= env(i(1.5), 0, 1.5, False)
peak = np.abs(film).max(); film = film / peak * 0.89 if peak > 0.89 else film
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "pcm_s24le", OUT], input=film.astype(np.float32).tobytes(), check=True)
print(json.dumps({"len": round(len(film) / SR, 2), "end": END, "vox_in": round(END + 131.4 - 117.98, 2), "count_again": round(END + 135.2 - 117.98, 2), "you_too": round(END + 138.4 - 117.98, 2), "coda": round(END + 22.68, 2)}))
