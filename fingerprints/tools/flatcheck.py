# Counts clipping in a mix exactly as raea check does: the sound as ffmpeg folds it to mono (-ac 1, which can come out
# louder than either channel when the voice and the bass sit in the middle), then runs of three samples at full scale
# or four samples the same to the bit above 0.05, by second; a second with three runs or more is a finding. So a
# clipping finding can be chased without rendering the picture. Usage: python3 -I tools/flatcheck.py MIX.wav|FILM.mp4
import sys, subprocess, struct, collections
f = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f, "-vn", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True).stdout
n = len(raw) // 4
x = struct.unpack("<%df" % n, raw)
by = collections.Counter()
i = 0
while i < n:
    v = x[i]; j = i + 1
    if abs(v) >= 0.999:
        while j < n and abs(x[j]) >= 0.999 and (x[j] > 0) == (v > 0): j += 1
        if j - i >= 3: by[i // 48000] += 1
    elif abs(v) >= 0.05:
        while j < n and x[j] == v: j += 1
        if j - i >= 4: by[i // 48000] += 1
    i = j
bad = sorted((s, c) for s, c in by.items() if c >= 3)
print(f, "mono peak", round(max(abs(v) for v in x), 3), "| seconds that would be findings:", bad or "none", "| runs in all:", sum(by.values()))
