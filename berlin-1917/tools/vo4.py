import json, subprocess, re, difflib, os
G = __import__('pathlib').Path(__file__).resolve().parent.parent.as_posix()
V = f"{G}/out/rebuilt/v4"; OUT = f"{G}/assets/rebuilt/vo4"; os.makedirs(OUT, exist_ok=True)
C = "acompressor=threshold=-28dB:ratio=3:attack=5:release=90:knee=6:makeup=5dB,volume=9dB,alimiter=limit=0.5:attack=3:release=50:level=disabled"
lines = json.load(open(f"{V}/vo/lines.json"))
src = {}
for d, mp in [("vo-test2/out", {"c1p1": "v01", "c1p2b": "v02", "c1p3": "v03", "c1p4": "v04", "c1p5b": "v05"}), ("vo/out", None)]:
    for l in open(f"{V}/{d}/gen.jsonl"):
        r = json.loads(l); k = mp.get(r["step"]) if mp else r["step"]
        if k: src[k] = f"{V}/{d}/" + r["files"][0].split("/")[-1]
WT, DUR, report = {}, {}, []
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
for k in sorted(lines):
    wav = f"{OUT}/{k}.wav"
    # trim leading/trailing silence lightly so the line starts on its first word
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src[k], "-af", f"silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,{C}", "-ar", "48000", "-ac", "2", wav], check=True)
    DUR[k] = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ar", "16000", "-ac", "1", "out/work/w.wav"], check=True)
    subprocess.run(["whisper-cli", "-m", os.path.expanduser("~/.cache/whisper/ggml-small.en.bin"), "-f", "out/work/w.wav", "-ml", "1", "-sow", "-oj", "-of", "out/work/w", "-np"], capture_output=True, check=True)
    hw = [(s["text"].strip(), s["offsets"]["from"] / 1000) for s in json.load(open("out/work/w.json"))["transcription"] if s["text"].strip()]
    text = re.sub(r"\[[^\]]*\]", "", lines[k]); sw = text.split()
    a = [norm(x) for x in sw]; b = [norm(x) for x, _ in hw]
    times = [None] * len(sw)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for d in range(i2 - i1): times[i1 + d] = hw[j1 + d][1]
        elif tag == "replace" and j2 > j1:
            for d in range(i2 - i1): times[i1 + d] = hw[j1 + min(d * (j2 - j1) // max(i2 - i1, 1), j2 - j1 - 1)][1]
    # fill gaps by interpolation, keep monotone
    known = [(i, t) for i, t in enumerate(times) if t is not None]
    for i in range(len(times)):
        if times[i] is None:
            prev = max([p for p in known if p[0] < i], default=(-1, 0.0), key=lambda p: p[0]); nxt = min([p for p in known if p[0] > i], default=(len(times), DUR[k]), key=lambda p: p[0])
            times[i] = prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0])
    for i in range(1, len(times)): times[i] = max(times[i], times[i - 1])
    WT[k] = [[w_, round(t, 2)] for w_, t in zip(sw, times)]
    heard = " ".join(x for x, _ in hw)
    matched = sum(1 for t in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks() for _ in range(t.size))
    report.append((k, round(DUR[k], 2), len(sw), matched, heard))
json.dump(WT, open(f"{OUT}/words.json", "w"), ensure_ascii=False)
json.dump({k: round(v, 3) for k, v in DUR.items()}, open(f"{OUT}/dur.json", "w"))
tot = 0
for k, d, n, m, h in report:
    tot += d; print(k, d, f"{m}/{n}", "" if m / n > 0.8 else "LOW: " + h[:300])
print("total voice", round(tot, 1), "s")
