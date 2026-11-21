# the house cutaway joined by dissolves, and the gallery grid's pull-out; run with python3.12 -I
import subprocess, sys, os
from PIL import Image
G = __import__('pathlib').Path(__file__).resolve().parent.parent.as_posix() + '/assets/rebuilt/shots5'
what = sys.argv[1]
if what == "house":
    lv = ["-1", "0", "1", "2", "3", "4", "5"]
    ins = sum([["-i", f"out/work/r5house/L{n}.mp4"] for n in lv], [])
    chain, prev = [], "[0:v]"
    for k in range(1, len(lv)):
        out = f"[x{k}]"
        chain.append(f"{prev}[{k}:v]xfade=transition=fade:duration=0.6:offset={1.4 * k:.2f}{out}")
        prev = out
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(chain) + f";{prev}format=yuv420p[v]", "-map", "[v]", "-r", "24", "-c:v", "libx264", "-crf", "14", "-preset", "slow", f"{G}/s5-house-cutaway.mp4"], check=True)
else:
    cells = [Image.open(f"out/work/r5gallery/g{i}.png").convert("RGB").resize((960, 540), Image.LANCZOS) for i in range(12)]
    gap, cols, rows = 28, 4, 3
    W, H = cols * 960 + (cols + 1) * gap, rows * 540 + (rows + 1) * gap
    canvas = Image.new("RGB", (W, H), (20, 18, 16))
    for i, c in enumerate(cells):
        canvas.paste(c, (gap + (i % cols) * (960 + gap), gap + (i // cols) * (540 + gap)))
    os.makedirs("out/work/r5gframes", exist_ok=True)
    n = 192
    ease = lambda x: x * x * (3 - 2 * x)
    # from two rooms wide at the top left to the whole grid
    for f in range(n):
        k = ease(f / (n - 1))
        w = 2000 + (W * 0.9 - 2000) * k; h = w * 9 / 16
        cx = (gap + 1000) + (W / 2 - (gap + 1000)) * k; cy = (gap + 560) + (H / 2 - (gap + 560)) * k
        x0, y0 = max(0, min(W - w, cx - w / 2)), max(0, min(H - h, cy - h / 2))
        canvas.transform((1920, 1080), Image.EXTENT, (x0, y0, x0 + w, y0 + h), Image.BICUBIC).save(f"out/work/r5gframes/{f:04d}.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", "out/work/r5gframes/%04d.png", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", f"{G}/s5-gallery.mp4"], check=True)
print("ok", what)
