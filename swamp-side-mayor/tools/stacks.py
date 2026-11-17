# tools/stacks.py: sprite-stacked props. Each thing is a small voxel form cut into horizontal slices, drawn as pixel
# art and laid side by side in one sheet (assets/stack/NAME.png, N slices of 32 px shown at 8x). The film stacks the
# slices as flat planes a little apart and turns the stack, the way sprite-stacked games fake 3D.
# run: uv run -q --with pillow python tools/stacks.py
import json, math, os
from PIL import Image
S, UP = 32, 8
def mushroom(x, y, z):   # z up, 0..1
    r = math.hypot(x, y)
    if z < 0.5: return (240, 226, 196) if r < 0.16 else None
    capr = 0.9 * math.sqrt(max(0, 1 - ((z - 0.5) / 0.5) ** 2))
    if r < capr:
        a = math.atan2(y, x); spot = math.cos(a * 5 + z * 9) > 0.72 and r > capr * 0.45
        return (255, 250, 240) if spot else ((226, 54, 44) if r > capr - 0.14 else (190, 36, 36))
def lotus(x, y, z):
    r = math.hypot(x, y); a = math.atan2(y, x)
    if z < 0.12: return (58, 150, 60) if r < 0.95 and not (abs(a) < 0.25 and r > 0.3) else None
    pet = 0.25 + 0.7 * (z - 0.12) / 0.88 + 0.16 * math.cos(a * 7 + z * 3)
    if z > 0.3 and r < 0.14: return (255, 210, 70)
    if abs(r - pet * 0.8) < 0.11: return (255, 150, 190) if z < 0.7 else (255, 215, 230)
def stump(x, y, z):
    r = math.hypot(x, y); a = math.atan2(y, x); rr = 0.72 + 0.1 * math.cos(a * 5) + 0.25 * max(0, 0.25 - z)
    if r > rr: return None
    if r > rr - 0.1: return (104, 70, 44)
    return (216, 176, 120) if int(r * 14) % 2 else (190, 146, 96)
def boombox(x, y, z):
    if abs(x) > 0.95 or abs(y) > 0.36: return None
    if z > 0.82: return (40, 40, 48) if abs(x) < 0.5 and abs(y) < 0.08 and z < 0.98 else None
    for cx in (-0.55, 0.55):
        d = math.hypot(x - cx, (z - 0.42) * 1.9)
        if y < -0.2 and d < 0.34: return (255, 209, 102) if d < 0.1 else ((30, 30, 36) if d < 0.28 else (230, 230, 236))
    if y < -0.2 and abs(x) < 0.16 and 0.3 < z < 0.6: return (255, 90, 60)
    return (58, 62, 78) if (abs(y) > 0.26 or abs(x) > 0.86 or z < 0.08 or z > 0.74) else (78, 84, 104)
def disk(x, y, z):   # a floppy
    if abs(x) > 0.8 or abs(y) > 0.8: return None
    if y > 0.25 and abs(x) < 0.45: return (210, 214, 222) if not (0.1 < x < 0.3) else (30, 30, 36)
    if y < -0.1 and abs(x) < 0.6: return (250, 246, 232)
    return (47, 143, 214)
THINGS = {"mushroom": (mushroom, 20), "lotus": (lotus, 14), "stump": (stump, 12), "boombox": (boombox, 18), "disk": (disk, 3)}
os.makedirs("assets/stack", exist_ok=True); out = {}
for name, (fn, n) in THINGS.items():
    sheet = Image.new("RGBA", (S * n, S), (0, 0, 0, 0))
    for k in range(n):
        z = (k + 0.5) / n
        for j in range(S):
            for i in range(S):
                c = fn((i + 0.5) / S * 2 - 1, (j + 0.5) / S * 2 - 1, z)
                if c:
                    edge = any(fn((i + 0.5 + dx) / S * 2 - 1, (j + 0.5 + dy) / S * 2 - 1, z) is None for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                    sheet.putpixel((k * S + i, j), ((27, 43, 74, 255) if edge else c + (255,)))
    sheet.resize((S * n * UP, S * UP), Image.NEAREST).save(f"assets/stack/{name}.png"); out[name] = n
json.dump(out, open("compositions/stacks.json", "w")); print(out)
