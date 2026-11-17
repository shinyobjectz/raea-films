#!/usr/bin/env python3
"""tools/keycap.py: the tutorial's keyboard shortcuts, drawn as the giant keyboard's own caps, a style of their own
beside the painted words (the director, 11-16: Archivo Black has no command sign and "CMD" didn't match; "for keyboard
shortcuts just have a separate style").

Each key is one cap, as the machine's keyboard draws it (compositions/machine.tsx, tools/fx.py): an off-white top face
on a skirt in the sticker pass's cool shade, a navy legend in Lilita One, the sticker look's navy line and cream halo
round the outside (compositions/sticker.ts). Pressed, the cap sinks and goes yellow, as the giant keys do when Goose
stands on one. The command sign isn't in Lilita One, so it's drawn here to the face's own measure: the height of its
capitals and the weight of its slash.

A shortcut is its caps side by side (command, then backslash), so the film presses them in turn as a hand would.

  keycap.py OUT_DIR [U]                  the stickers; U = pixels a cap is tall (default 240)
  keycap.py legends LAYOUT.json OUT.png  the tutorial keyboard's legend sheet (components/tut/keyboard.json)

Writes OUT_DIR/cap-NAME-up.png and cap-NAME-down.png for each key in KEYS, all the same height.
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

FONT = "assets/fonts/LilitaOne-Regular.ttf"
NAVY, CREAM = (28, 38, 61), (255, 253, 246)
TOP, TOP_DOWN = "#f6f0de", "#ffd166"     # machine.tsx: a cap, and a cap that's struck
MOD = "#d6ccae"                           # machine.tsx: a modifier's cap (command)
SHADE = "#a9c2e0"                         # sticker.ts: the cel shade, multiplied in linear light
SS = 4                                    # drawn at four times the size, then brought down

# name, legend, width in caps, modifier. A legend of one character is drawn large, a word small (as fx.py's keys).
KEYS = [
    ("cmd", "⌘", 1.0, True),
    ("backslash", "\\", 1.0, False),
    ("z", "Z", 1.0, False),
    ("b", "B", 1.0, False),
    ("slash", "/", 1.0, False),
    ("esc", "esc", 1.25, True),
    ("space", "space", 3.5, False),
]


def hexrgb(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def shaded(c):
    """the colour on the cap's shade side, as the sticker pass shades it"""
    return srgb(lin(hexrgb(c)) * lin(hexrgb(SHADE)))


def rrect(w, h, box, r):
    """a rounded rectangle's coverage, (x0, y0, x1, y1) in pixels, on a w x h canvas"""
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius=r, fill=255)
    return np.asarray(m, np.float32) / 255


def command_sign(size):
    """The command sign drawn as one even stroke with round ends, `size` px tall: a square whose sides run on into a
    three-quarter loop at each corner. Its stroke is Lilita One's slash's weight, its height a little over a capital's,
    so it sits in a cap as the face's own symbols do."""
    t = size / 6.6                        # the stroke; the square's side 2.0 t, each loop's centreline radius 0.9 t
    h, r = 1.0 * t, 0.9 * t               # half the square's side, a loop's radius
    pts = []
    for sy in (-1, 1):                    # the square's sides, run on to meet the loops
        pts += [(x, sy * h) for x in np.linspace(-(h + r), h + r, 400)]
        pts += [(sy * h, y) for y in np.linspace(-(h + r), h + r, 400)]
    for sx in (-1, 1):
        for sy in (-1, 1):                # each loop the long way round, outside the square
            cx, cy = sx * (h + r), sy * (h + r)
            a0 = math.atan2(-sy, 0)       # where it leaves the side y = sy h
            # 270 degrees, the way that passes through the outward diagonal (sx, sy) halfway
            out = math.atan2(sy, sx)
            sweep = next(s * 1.5 * math.pi for s in (1, -1) if math.cos(a0 + s * 0.75 * math.pi - out) > 0.99)
            pts += [(cx + r * math.cos(a0 + sweep * k), cy + r * math.sin(a0 + sweep * k)) for k in np.linspace(0, 1, 600)]
    ext = 2 * (h + 2 * r) + t
    n = int(math.ceil(ext)) + 4
    c = np.ones((n, n), bool)
    for x, y in pts:
        c[int(round(y + n / 2)), int(round(x + n / 2))] = False
    dist = nd.distance_transform_edt(c)
    return np.clip(t / 2 - dist + 0.5, 0, 1).astype(np.float32)


def legend(text, w, h, cx, cy, U):
    """the legend's coverage centred at (cx, cy): one character at Lilita's large size, a word at its small size
    (fx.py's keys: 150 and 92 in a 256 cell)"""
    if text == "⌘":
        g = command_sign(0.44 * U)  # a capital at the large size is 0.41 of the cap; its stroke 0.067, the slash's 0.07
        m = np.zeros((h, w), np.float32)
        gh, gw = g.shape
        y0, x0 = int(round(cy - gh / 2)), int(round(cx - gw / 2))
        m[y0:y0 + gh, x0:x0 + gw] = g
        return m
    size = (150 if len(text) == 1 else 92) / 256 * U
    f = ImageFont.truetype(FONT, int(size))
    im = Image.new("L", (w, h), 0)
    ImageDraw.Draw(im).text((cx, cy), text, font=f, fill=255, anchor="mm")
    return np.asarray(im, np.float32) / 255


def cap(name, text, units, mod, down, U):
    u = U * SS
    line, halo = 0.02 * u, 0.025 * u      # the sticker pass's 3.6 px line and 4.6 px halo, at a cap shown 180 px tall
    pad = int(line + halo + 0.02 * u)
    W, H = int(units * u) + 2 * pad, int(u) + 2 * pad
    x0, y0, x1, y1 = pad, pad, pad + units * u, pad + u
    sink = 0.07 * u if down else 0       # pressed, the cap sits lower and shows less of its skirt
    skirt = rrect(W, H, (x0, y0 + sink, x1, y1), 0.17 * u)
    top_box = (x0 + 0.09 * u, y0 + sink + 0.05 * u, x1 - 0.09 * u, y1 - 0.2 * u + (0.06 * u if down else 0))
    top = rrect(W, H, top_box, 0.13 * u)
    face = TOP_DOWN if down else (MOD if mod else TOP)
    col = np.zeros((H, W, 3), np.float32)
    col[:] = shaded(face)
    col = col * (1 - top[..., None]) + hexrgb(face) * top[..., None]
    lg = legend(text, W, H, (top_box[0] + top_box[2]) / 2, (top_box[1] + top_box[3]) / 2 + 0.01 * u, u)
    navy = np.array(NAVY, np.float32) / 255
    col = col * (1 - lg[..., None]) + navy * lg[..., None]
    # the line just inside the silhouette, the halo just outside it
    inside = nd.distance_transform_edt(skirt > 0.5)
    outside = nd.distance_transform_edt(skirt <= 0.5)
    ln = np.clip(line - inside + 0.5, 0, 1) * (skirt > 0.5)
    col = col * (1 - ln[..., None]) + navy * ln[..., None]
    hl = np.clip(halo - outside + 0.5, 0, 1) * (skirt <= 0.5)
    cream = np.array(CREAM, np.float32) / 255
    a = np.clip(skirt + hl, 0, 1)
    col = np.where(hl[..., None] > 0, cream, col)
    img = np.dstack([col, a]) * 255
    out = Image.fromarray(img.round().clip(0, 255).astype(np.uint8), "RGBA")
    return out.resize((W // SS, H // SS), Image.LANCZOS)


def legends(layout, out):
    """The tutorial keyboard's legends, as tools/fx.py draws the music video's: one a cell of an 8 x 8 sheet of 256 px
    cells, navy Lilita One, a single character large and a word small, a wide key's legend drawn wide and squeezed into
    its square cell so it comes out right on the cap's wide legend plane. The command keys carry the drawn sign."""
    import json
    C = 256
    keys = [k for row in json.load(open(layout))["rows"] for k in row]
    sheet = Image.new("RGBA", (8 * C, 8 * C), (0, 0, 0, 0))
    for i, (_, label, w) in enumerate(keys):
        # the cell drawn at its legend plane's own proportion (machine.tsx: (w x 0.5 - 0.17) by 0.32), so a wide key's
        # legend comes out unstretched when the square cell is laid back on it
        cw = int(round(C * max(1.0, (0.5 * w - 0.17) / 0.32)))
        if label == "⌘":
            g = command_sign(0.44 * C)
            a = np.zeros((C, cw), np.float32)
            gh, gw = g.shape
            y0, x0 = int(round(C / 2 + 6 * 0.41 - gh / 2)), int(round(cw / 2 - gw / 2))
            a[y0:y0 + gh, x0:x0 + gw] = g
            cell = Image.fromarray(np.dstack([np.broadcast_to(np.array(NAVY, np.uint8), (C, cw, 3)), (a * 255).astype(np.uint8)]), "RGBA")
        else:
            cell = Image.new("RGBA", (cw, C), (0, 0, 0, 0))
            if label:
                f = ImageFont.truetype(FONT, 150 if len(label) == 1 else 92)
                ImageDraw.Draw(cell).text((cw / 2, C / 2 + (6 if len(label) == 1 else 4)), label, font=f, fill=(*NAVY, 255), anchor="mm")
        sheet.paste(cell.resize((C, C), Image.LANCZOS), ((i % 8) * C, (i // 8) * C))
    sheet.save(out, optimize=True)
    print(f"{out}: {len(keys)} legends")


if __name__ == "__main__":
    if sys.argv[1] == "legends":
        legends(sys.argv[2], sys.argv[3])
        sys.exit()
    out, U = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 240
    for name, text, units, mod in KEYS:
        for down in (False, True):
            im = cap(name, text, units, mod, down, U)
            im.save(f"{out}/cap-{name}-{'down' if down else 'up'}.png", optimize=True)
        print(f"cap-{name} {im.size[0]}x{im.size[1]}")
