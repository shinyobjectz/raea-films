# The review room's screen and the alien script (components/room.tsx).
#
#   /tmp/ivyenv/bin/python -I scripts/room_screen.py out/swamp-hype-v2.mp4 assets/room components/room-media.ts out/film-v5
#
# The screen plays the film's own footage. v5 (note: "the room screen shows environment footage", not the app's
# panels): the swamp coming alive, from v5's own shots (OUT/film-v5, scripts/render_film_v5.sh): the sunrise (11-sun,
# frames 740-790), the fish leaping (13-water, 822-864) and the leaves breaking with the ravens (15-leaves, 896-912),
# cut together at 1:1, 108 frames from T.roomPlay, the film's own mix at the same frames playing with it
# (assets/audio/v5/fx/film-room-v5.wav, scripts/film_room_v5.py). (v4 played v2 frames 700-807: the robot on the sun
# slider, then the sunrise.) The dusk frame the note is written on is still v2's (NOTE_FRAME).
# Over it, the aliens' review player, in a script drawn here: each word written along a wave, a glyph a swing of it
# with a node where it crosses its middle (a ring, a disc, a bar) and ticks and dots off the node. It is no real-world
# script and no font: every glyph is made below from a seed.
#
#   SCREEN/play-NNN.jpg   the cut, 108 frames, the player's progress running under it
#   SCREEN/standby.jpg    v4, 29-arrive: the screen idle as they come in, their emblem dim on the dark
#   SCREEN/link.jpg       the review link arrived: the card on the idle screen (the room's light reads this)
#   SCREEN/link-card.png  the card alone, the frame's size and clear round it, for the page to bring in and open
#                         (its poster is the dusk hero wide, NOTE_FRAME)
#   SCREEN/paused-a.jpg   before it plays: its first frame and the play mark
#   SCREEN/paused-b.jpg   paused on its last frame (the hands shot lights by it)
#   SCREEN/note-draft.jpg the note being written, pinned on the monitor in the frame
#   SCREEN/note-posted.jpg the note posted
#   SCREEN/type-P-S.jpg   v4, 30b-glyphs: the note being written at 3840 x 2160, press P's words S/5 drawn; type-sent
#   GLYPHS/gNN.png        each glyph alone, white on black (the keyboard's legends)
import math
import os
import random
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, media_ts, shots = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
SCREEN = os.path.join(dst, "screen")
GLYPHS = os.path.join(dst, "glyphs")
os.makedirs(SCREEN, exist_ok=True)
os.makedirs(GLYPHS, exist_ok=True)
W, H = 1920, 1080
# v5's frames [from, to) and the shot each is in (its mp4 in `shots`, its first frame the shot's start)
CUT = [(740, 790, "11-sun", 740), (822, 864, "13-water", 822), (896, 912, "15-leaves", 896)]
NOTE_FRAME = 1439  # v2's dusk: where they stop the film to write on it
FRAMES = [n for a, b, _, _ in CUT for n in range(a, b)]
assert len(FRAMES) == 108, len(FRAMES)

# ---- the script ----
SS = 4  # drawn at 4x and brought down, for clean edges


def glyph_strokes(seed):
    """a glyph as polylines in em units (x right, y down from the word's middle line), and its advance: a stretch of
    the wave the word is written along (a full swing, up or down, so the line runs on unbroken from glyph to glyph),
    a node where it crosses its middle, and ticks and dots off the node"""
    r = random.Random(seed * 7919 + 13)
    w = r.choice([0.5, 0.58, 0.66, 0.74])
    amp = r.choice([0.13, -0.13, 0.09, -0.09])
    lines = [[(w * i / 24, amp * math.sin(2 * math.pi * i / 24)) for i in range(25)]]

    def arc(cx, cy, rad, a0, a1, n=24):
        return [(cx + rad * math.cos(a0 + (a1 - a0) * i / n), cy + rad * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]

    cx, cy = w / 2, 0.0
    node = r.choice(["ring", "disc", "ring2", "bar", "ring", "tear"])
    nr = 0.085
    if node == "ring":
        lines.append(arc(cx, cy, nr, 0, 2 * math.pi, 20))
    elif node == "disc":
        lines.append([("disc", cx, cy, nr * 0.95)])
    elif node == "ring2":
        lines.append(arc(cx, cy, nr * 1.15, 0, 2 * math.pi, 20))
        lines.append([(cx, cy)])
    elif node == "bar":
        lines.append([(cx, cy - 0.17), (cx, cy + 0.17)])
    elif node == "tear":
        up = r.choice([1, -1])
        s0 = math.pi / 2 + 0.5 if up > 0 else -math.pi / 2 + 0.5
        lines.append(arc(cx, cy, nr, s0, s0 + 2 * math.pi - 1.0, 18))
    angles = r.sample([-150, -120, -60, -30, 30, 60, 120, 150], r.choice([1, 2, 2, 3]))
    for ang in angles:
        a = math.radians(ang)
        l0, l1 = nr * 1.25, r.choice([0.24, 0.3, 0.36])
        tick = [(cx + l0 * math.cos(a), cy + l0 * math.sin(a)), (cx + l1 * math.cos(a), cy + l1 * math.sin(a))]
        end = r.choice(["none", "none", "dot", "hook"])
        lines.append(tick)
        if end == "dot":
            lines.append([(cx + (l1 + 0.08) * math.cos(a), cy + (l1 + 0.08) * math.sin(a))])
        elif end == "hook":
            ex, ey = tick[1]
            lines.append(arc(ex + 0.05 * math.cos(a + math.pi / 2), ey + 0.05 * math.sin(a + math.pi / 2), 0.05, a - math.pi / 2, a + math.pi * 0.6, 8))
    if r.random() < 0.4:
        side = r.choice([-1, 1])
        for dx in (-0.07, 0.07):
            lines.append([(cx + dx, side * 0.36)])
    return lines, w


N_GLYPHS = 30
GL = [glyph_strokes(i) for i in range(N_GLYPHS)]


def draw_word(d, glyphs, x, y, em, color, width):
    """glyph indices from (x, y) (the word's middle line at its left), em pixels high; returns the end x"""
    sw = em * width
    for g in glyphs:
        lines, w = GL[g]
        for ln in lines:
            if isinstance(ln[0][0], str):
                _, cx, cy, rad = ln[0]
                d.ellipse([x + (cx - rad) * em, y + (cy - rad) * em, x + (cx + rad) * em, y + (cy + rad) * em], fill=color)
                continue
            pts = [(x + px * em, y + py * em) for px, py in ln]
            if len(pts) == 1:
                cx, cy = pts[0]
                d.ellipse([cx - sw * 0.8, cy - sw * 0.8, cx + sw * 0.8, cy + sw * 0.8], fill=color)
                continue
            d.line(pts, fill=color, width=max(1, round(sw)), joint="curve")
            for cx, cy in (pts[0], pts[-1]):
                d.ellipse([cx - sw / 2, cy - sw / 2, cx + sw / 2, cy + sw / 2], fill=color)
        x += w * em
        if g is not glyphs[-1]:
            # a short run of the line between glyphs
            d.line([(x, y), (x + 0.07 * em, y)], fill=color, width=max(1, round(sw)))
            x += 0.07 * em
    return x


def word_glyphs(word):
    out = []
    for ch in word.lower():
        if ch.isalpha():
            out.append((ord(ch) - 97) % N_GLYPHS)
        elif ch == "'":
            out.append(27)
        elif ch == ".":
            out.append(29)
    return out


def text_layer(size, items, ss=SS):
    """an RGBA layer: items are (kind, args) drawn at ss x"""
    im = Image.new("RGBA", (size[0] * ss, size[1] * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for fn in items:
        fn(d)
    return im.resize(size, Image.LANCZOS)


# glyph legends for the keys
for i in range(N_GLYPHS):
    lines, w = GL[i]
    im = Image.new("L", (128 * SS, 128 * SS), 0)
    d = ImageDraw.Draw(im)
    em = 84 * SS
    draw_word(d, [i], 64 * SS - (w * em) / 2, 64 * SS, em, 255, 0.075)
    im.resize((128, 128), Image.LANCZOS).convert("RGB").save(os.path.join(GLYPHS, f"g{i:02d}.png"))

# a sheet of the script, to look at
sheet = Image.new("L", (1200 * SS, 300 * SS), 0)
d = ImageDraw.Draw(sheet)
for i in range(N_GLYPHS):
    draw_word(d, [i], (40 + (i % 15) * 76) * SS, (80 + (i // 15) * 130) * SS, 60 * SS, 255, 0.075)
sheet.resize((1200, 300), Image.LANCZOS).save(os.path.join(GLYPHS, "sheet.png"))

# ---- the frames ----
V5 = "/tmp/room-v5-frames"


def play_frames():
    """v5's frames of the cut, each exactly (by its index in its shot's file), as PNG in V5"""
    os.makedirs(V5, exist_ok=True)
    for a, b, shot, start in CUT:
        if all(os.path.exists(f"{V5}/{n:04d}.png") for n in range(a, b)):
            continue
        tmp = f"{V5}/.{shot}"
        os.makedirs(tmp, exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(shots, shot + ".mp4"), "-vf", f"select=between(n\\,{a - start}\\,{b - start - 1})", "-fps_mode", "vfr", f"{tmp}/%04d.png"], check=True)
        got = sorted(os.listdir(tmp))
        assert len(got) == b - a, (shot, len(got))
        for k, name in enumerate(got):
            os.replace(os.path.join(tmp, name), f"{V5}/{a + k:04d}.png")
        os.rmdir(tmp)


def play(n):
    return Image.open(f"{V5}/{n:04d}.png").convert("RGB").resize((W, H), Image.LANCZOS)


def frame(n):
    p = f"/tmp/room-v2-frames/{n:04d}.jpg"
    if not os.path.exists(p):
        os.makedirs("/tmp/room-v2-frames", exist_ok=True)
        subprocess.run(["raea", "media", "still", src, "--at", f"{(n + 0.25) / 30:.4f}", "-o", p], check=True, capture_output=True)
    return Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS)


UI = (236, 240, 232, 255)
DIM = (236, 240, 232, 150)


def chrome(img, t, playing, paused_mark=False):
    """the review player over the picture: a fall to dark at the foot, the progress line, a glyph timecode"""
    img = img.convert("RGBA")
    grad = Image.new("L", (1, 256))
    for y in range(256):
        grad.putpixel((0, y), int(150 * max(0, (y - 120) / 136) ** 1.6))
    shade = Image.new("RGBA", (W, 256), (0, 0, 0, 255))
    shade.putalpha(grad.resize((W, 256)))
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.paste(shade, (0, H - 256))
    img = Image.alpha_composite(img, base)

    def ui(d):
        y = (H - 64) * SS
        x0, x1 = 150 * SS, (W - 150) * SS
        d.line([(x0, y), (x1, y)], fill=(236, 240, 232, 70), width=4 * SS)
        d.line([(x0, y), (x0 + (x1 - x0) * t, y)], fill=UI, width=4 * SS)
        cx = x0 + (x1 - x0) * t
        d.ellipse([cx - 9 * SS, y - 9 * SS, cx + 9 * SS, y + 9 * SS], fill=UI)
        # the timecode, in their script: elapsed, and the whole
        draw_word(d, [3 + int(t * 9) % 7, 11, 17], 140 * SS - 0 * SS, y - 30 * SS, 26 * SS, UI, 0.1)
        draw_word(d, [5, 23, 8], x1 - 46 * SS, y - 30 * SS, 26 * SS, DIM, 0.1)
        # their play / pause mark, small at the left of the line
        if playing:
            d.line([(108 * SS, y - 10 * SS), (108 * SS, y + 10 * SS)], fill=UI, width=5 * SS)
            d.line([(120 * SS, y - 10 * SS), (120 * SS, y + 10 * SS)], fill=UI, width=5 * SS)
        else:
            d.polygon([(104 * SS, y - 11 * SS), (126 * SS, y), (104 * SS, y + 11 * SS)], fill=UI)
        if paused_mark:
            # the big mark in the middle before it plays: a ring and their play glyph
            cx, cy, r = W / 2 * SS, H / 2 * SS, 74 * SS
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(236, 240, 232, 220), width=5 * SS)
            d.polygon([(cx - 22 * SS, cy - 34 * SS), (cx + 36 * SS, cy), (cx - 22 * SS, cy + 34 * SS)], fill=(236, 240, 232, 220))

    return Image.alpha_composite(img, text_layer((W, H), [ui])).convert("RGB")


NOTE_LINES = [["i'm", "not", "sure", "this"], ["is", "on", "brand", "for", "us."]]
# v4, 30b-glyphs: the words each of the typist's seven key presses writes (room-voice.ts TYPING, in order)
CHUNKS = [[0], [1], [2], [3], [4, 5], [6], [7, 8]]


def word_width(glyphs, em):
    """how far draw_word runs for these glyphs"""
    return sum(GL[g][1] * em for g in glyphs) + 0.07 * em * (len(glyphs) - 1)


def note(img, posted, z=1, upto=None, writing=(), reveal=1.0, sent=False):
    """the note pinned on the monitor in the dusk frame, as their review app leaves it. v4: z draws it z times the
    size (on an img already that size); `upto` words written (all when None), then `writing` (word indices) `reveal`
    of the way along, the caret at the pen; `sent`, the send pressed: no caret, the box's edge lit"""
    ss = SS if z == 1 else 2
    img = img.convert("RGBA")
    pin = (1015, 600)  # on the monitor in the frame
    bx, by, bw, bh = 1095, 300, 640, 252
    # the box's dark field, softened at its edge
    box = Image.new("RGBA", (W * z, H * z), (0, 0, 0, 0))
    bd = ImageDraw.Draw(box)
    bd.rounded_rectangle([bx * z, by * z, (bx + bw) * z, (by + bh) * z], radius=26 * z, fill=(8, 11, 12, 214))
    img = Image.alpha_composite(img, box)
    words = [(w, li) for li, ln in enumerate(NOTE_LINES) for w in ln]
    upto = len(words) if upto is None else upto
    # each word's place: its line's middle and where it starts (1920 units)
    place = []
    for li, ln in enumerate(NOTE_LINES):
        x = bx + 38
        for wd in ln:
            place.append((x, by + 128 + 78 * li))
            x += word_width(word_glyphs(wd), 46) + 30
    pen = None
    if writing:
        x0 = place[writing[0]][0]
        x1 = place[writing[-1]][0] + word_width(word_glyphs(words[writing[-1]][0]), 46)
        pen = (x0 + (x1 - x0) * reveal, place[writing[0]][1], x0, x1)

    def frame_ui(d):
        s = ss * z
        # the pin: a ring and its dot, and the leader up to the box
        d.ellipse([(pin[0] - 22) * s, (pin[1] - 22) * s, (pin[0] + 22) * s, (pin[1] + 22) * s], outline=UI, width=5 * s)
        d.ellipse([(pin[0] - 7) * s, (pin[1] - 7) * s, (pin[0] + 7) * s, (pin[1] + 7) * s], fill=UI)
        d.line([((pin[0] + 16) * s, (pin[1] - 16) * s), ((bx + 18) * s, (by + bh - 10) * s)], fill=(236, 240, 232, 170), width=3 * s)
        d.rounded_rectangle([bx * s, by * s, (bx + bw) * s, (by + bh) * s], radius=26 * s, outline=(236, 240, 232, 200 if sent else 90), width=(3 if sent else 2) * s)
        # who wrote it: a mark in a disc, and their name, dim
        d.ellipse([(bx + 34) * s, (by + 30) * s, (bx + 74) * s, (by + 70) * s], fill=(120, 150, 138, 255))
        draw_word(d, [12, 4, 20], (bx + 92) * s, (by + 50) * s, 30 * s, DIM, 0.1)
        # the words: "I'm not sure this is on brand for us."
        for i, (wd, li) in enumerate(words):
            if i < upto and i not in writing:
                draw_word(d, word_glyphs(wd), place[i][0] * s, place[i][1] * s, 46 * s, UI, 0.085)
        if posted:
            draw_word(d, [21, 9], (bx + bw - 110) * s, (by + 50) * s, 30 * s, DIM, 0.1)
        elif not sent:
            # the caret: at the pen while writing, else after the last word
            if pen:
                cx, cy = pen[0] + 10, pen[1]
            else:
                last = upto - 1
                cx = place[last][0] + word_width(word_glyphs(words[last][0]), 46) + 16
                cy = place[last][1]
            d.line([(cx * s, (cy - 24) * s), (cx * s, (cy + 24) * s)], fill=UI, width=4 * s)

    def writing_ui(d):
        s = ss * z
        for i in writing:
            draw_word(d, word_glyphs(words[i][0]), place[i][0] * s, place[i][1] * s, 46 * s, UI, 0.085)

    layer = text_layer((W * z, H * z), [frame_ui], ss)
    if writing:
        # the words being written, drawn as far as the pen: a soft edge a few pixels wide
        wl = text_layer((W * z, H * z), [writing_ui], ss)
        xs = np.arange(W * z, dtype=np.float32) / z
        ramp = np.clip((pen[0] - xs) / 6.0, 0, 1)
        a = np.asarray(wl, np.float32)
        a[..., 3] *= ramp[None, :]
        layer = Image.alpha_composite(layer, Image.fromarray(a.round().astype(np.uint8), "RGBA"))
    return Image.alpha_composite(img, layer).convert("RGB")


# ---- v4: the screen before the film, as the aliens come in ----
CARD = (580, 250, 1340, 830)  # the link card on the screen: x0, y0, x1, y1
THUMB = (620, 290, 1300, 673)  # its picture, 16:9; room.tsx opens the card from here to the full screen
BEIGE = (217, 205, 176, 255)  # the robot's own colour: the sender's mark is its cursor


def standby():
    """the screen idle: a soft grey-teal field, brightest in the middle, their emblem and a line of their script"""
    yy, xx = np.mgrid[0:H, 0:W].astype("float32")
    r = ((xx - W / 2) ** 2 / (W * 0.55) ** 2 + (yy - H / 2) ** 2 / (H * 0.6) ** 2) ** 0.5
    # a field of light, as a screen waiting glows: brightest in the middle (the aliens coming in are seen against it)
    g = 28 + 52 * np.clip(1 - r, 0, 1) ** 1.2
    rgb = np.stack([g * 0.88, g * 1.0, g * 1.04], -1).clip(0, 255).astype("uint8")
    img = Image.fromarray(rgb, "RGB").convert("RGBA")

    def ui(d):
        cx, cy = W / 2 * SS, (H / 2 - 40) * SS
        rr = 66 * SS
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(236, 240, 232, 90), width=4 * SS)
        lines, w = GL[14]
        draw_word(d, [14], cx - w * 70 * SS / 2, cy, 70 * SS, (236, 240, 232, 110), 0.085)
        x = (W / 2 - 150) * SS
        for wd in ["awaiting", "review"]:
            x = draw_word(d, word_glyphs(wd), x, (H / 2 + 92) * SS, 26 * SS, (236, 240, 232, 80), 0.1) + 22 * SS

    return Image.alpha_composite(img, text_layer((W, H), [ui]))


def link_card():
    """the review link as their app shows it: the film's poster, its title in their script, the sender's cursor"""
    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    x0, y0, x1, y1 = CARD
    cd.rounded_rectangle([x0, y0, x1, y1], radius=28, fill=(10, 13, 14, 240))
    tx0, ty0, tx1, ty1 = THUMB
    # its poster: the dusk hero wide, the monitor in the living swamp (the frame they will write their note on)
    thumb = frame(NOTE_FRAME).resize((tx1 - tx0, ty1 - ty0), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", thumb.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, thumb.size[0] - 1, thumb.size[1] - 1], radius=14, fill=255)
    card.paste(thumb, (tx0, ty0), m)

    def ui(d):
        s = SS
        d.rounded_rectangle([x0 * s, y0 * s, x1 * s, y1 * s], radius=28 * s, outline=(236, 240, 232, 80), width=2 * s)
        # the title: "swamp, for the mothership"
        x = (tx0 + 4) * s
        for wd in ["swamp", "for", "the", "mothership"]:
            x = draw_word(d, word_glyphs(wd), x, (ty1 + 58) * s, 40 * s, UI, 0.085) + 26 * s
        # who sent it: the robot's cursor, and a word of theirs, dim
        ax, ay = tx0 + 6, ty1 + 104
        arrow = [(0, 0), (0, 30), (8, 23), (14, 36), (19, 34), (13, 21), (24, 21)]
        d.polygon([((ax + px) * s, (ay + py) * s) for px, py in arrow], fill=BEIGE)
        draw_word(d, [12, 4, 20], (ax + 40) * s, (ay + 18) * s, 26 * s, DIM, 0.1)
        # new: a pale dot at the card's corner
        d.ellipse([(x1 - 46) * s, (y0 + 22) * s, (x1 - 26) * s, (y0 + 42) * s], fill=(150, 214, 178, 255))

    return Image.alpha_composite(card, text_layer((W, H), [ui]))


Q = dict(quality=90, subsampling=0)
total = len(FRAMES)
play_frames()
for i, n in enumerate(FRAMES):
    chrome(play(n), i / (total - 1), True).save(os.path.join(SCREEN, f"play-{i:03d}.jpg"), **Q)
chrome(play(FRAMES[0]), 0, False, paused_mark=True).save(os.path.join(SCREEN, "paused-a.jpg"), **Q)
last = chrome(frame(NOTE_FRAME), 0.93, False)
last.save(os.path.join(SCREEN, "paused-b.jpg"), **Q)
note(last, False).save(os.path.join(SCREEN, "note-draft.jpg"), **Q)
note(last, True).save(os.path.join(SCREEN, "note-posted.jpg"), **Q)
# v4, 30b-glyphs: the note written word by word, at twice the size for the close shot on it; each press's words
# drawn on over five frames, then the send
big = last.resize((W * 2, H * 2), Image.LANCZOS)
for i, ch in enumerate(CHUNKS):
    for st in range(1, 6):
        note(big, False, z=2, upto=ch[0], writing=ch, reveal=st / 5).save(os.path.join(SCREEN, f"type-{i}-{st}.jpg"), **Q)
note(big, False, z=2, sent=True).save(os.path.join(SCREEN, "type-sent.jpg"), **Q)
TYPE = [f"type-{i}-{st}" for i in range(len(CHUNKS)) for st in range(1, 6)] + ["type-sent"]
idle = standby()
idle.convert("RGB").save(os.path.join(SCREEN, "standby.jpg"), **Q)
card = link_card()
card.save(os.path.join(SCREEN, "link-card.png"))
Image.alpha_composite(idle, card).convert("RGB").save(os.path.join(SCREEN, "link.jpg"), **Q)

# ---- the module that imports them (bundled textures are ES imports) ----
rel = os.path.relpath(dst, os.path.dirname(media_ts))
with open(media_ts, "w") as f:
    f.write("// Generated by scripts/room_screen.py: the review room's screen frames and the alien script's glyphs.\n")
    for i in range(total):
        f.write(f'import p{i:03d} from "{rel}/screen/play-{i:03d}.jpg";\n')
    for k in ["paused-a", "paused-b", "note-draft", "note-posted", "standby"]:
        f.write(f'import {k.replace("-", "_")} from "{rel}/screen/{k}.jpg";\n')
    f.write(f'import link_card from "{rel}/screen/link-card.png";\n')
    for k in TYPE:
        f.write(f'import {k.replace("-", "_")} from "{rel}/screen/{k}.jpg";\n')
    for i in range(N_GLYPHS):
        f.write(f'import g{i:02d} from "{rel}/glyphs/g{i:02d}.png";\n')
    f.write("\n/** the cut playing, a frame each film frame */\n")
    f.write("export const PLAY: string[] = [" + ", ".join(f"p{i:03d}" for i in range(total)) + "];\n")
    f.write("export const SCREEN = { pausedA: paused_a, pausedB: paused_b, draft: note_draft, posted: note_posted, standby, card: link_card };\n")
    f.write("/** v4, 30b-glyphs: the note written word by word at 3840 x 2160, type-PRESS-STEP (each press's words drawn on\n * over five frames) and type-sent */\n")
    f.write("export const TYPE: Record<string, string> = { " + ", ".join(f'"{k}": {k.replace("-", "_")}' for k in TYPE) + " };\n")
    f.write("/** where the link card's picture sits on the screen (x0, y0, x1, y1 of 1920 x 1080) */\n")
    f.write(f"export const THUMB = [{THUMB[0]}, {THUMB[1]}, {THUMB[2]}, {THUMB[3]}];\n")
    f.write("/** the glyphs, white on black, for the keys' legends */\n")
    f.write("export const GLYPH: string[] = [" + ", ".join(f"g{i:02d}" for i in range(N_GLYPHS)) + "];\n")
print("frames", total, "glyphs", N_GLYPHS)
