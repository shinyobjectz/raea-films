#!/bin/bash
# tools/ink.sh: the drawn layer's sprites, painted in one colour with a dry brush (tools/paint.py; the reference's
# "DUCK" lettering, the director 11-16). Each word and mark is painted three times with a little different paint (a boil
# when they're cycled), as PNGs with alpha in assets/ink, and listed with their sizes in compositions/ink.json.
# No outline, no second colour. The marker and its navy and cream sticker read abrasive and childish (11-16), and
# the goose's "ga~" asides were never readable, so neither is drawn any more.
cd "$(dirname "$0")/.." || exit 1
mkdir -p assets/ink; find assets/ink -name '*.png' -delete
Y="#f7c45e"
PAINT=(uv run -q --with numpy --with scipy --with pillow -- python -I tools/paint.py)
word() { "${PAINT[@]}" word "$1" "$2" "$3" "${4:-$Y}" || exit 1; }
# stroke NAME WxH WIDTH DRAW...: the shape drawn plain, then painted like the words
stroke() { local n=$1 size=$2 w=$3; shift 3; local args=(); for d in "$@"; do args+=(-draw "stroke-linecap round stroke-linejoin round $d"); done
  magick -size "$size" xc:none -stroke white -strokewidth "$w" -fill none "${args[@]}" assets/ink/tmp.png || exit 1
  "${PAINT[@]}" mask "$n" assets/ink/tmp.png "$Y" $((w * 4)) || exit 1; rm -f assets/ink/tmp.png; }

# Sparse on purpose: the title, the hook's punchlines as they're sung, the key it hits and the splash it makes, and
# marks that hit the beats. Nothing narrates what's on screen.
word title1 "SWAMP-SIDE" 300; word title2 "MAYOR" 460; word made "MADE IN" 120; word v015 "0.1.5" 260
word quack "QUACK" 360; word quackw "QUACK" 300; word mudfeet "MUD FEET?" 320; word pop "POP!" 400
word duck "DUCK?" 480; word soup "SOUP." 420; word enter "ENTER" 460; word sploosh "SPLOOSH" 360; word schlop "SCHLOP" 400
# inside the machine: what each view of the app is, said plainly, two lines each
word app-type "TYPE ONE\nLINE." 230; word app-build "IT BUILDS\nTHE SWAMP" 210; word app-feed "RIGHT TO\nYOUR FEED" 210
word app-watch "WATCH IT\nIN RAEA" 220; word app-note "SAY WHAT\nTO FIX" 230; word app-post "POST IT\nEVERYWHERE" 200
stroke under 900x140 24 "bezier 30,60 300,20 600,110 870,50"
stroke burst 900x900 30 "line 450,60 450,230" "line 450,840 450,670" "line 60,450 230,450" "line 840,450 670,450" "line 174,174 294,294" "line 726,726 606,606" "line 726,174 606,294" "line 174,726 294,606"
stroke spark 260x260 18 "line 130,20 130,240" "line 20,130 240,130" "line 60,60 200,200" "line 200,60 60,200"
python3 - <<'PY'
import subprocess, json, glob, os
out = {}
for p in sorted(glob.glob("assets/ink/*-0.png")):
    n = os.path.basename(p)[:-6]; w, h = subprocess.run(["magick", "identify", "-format", "%w %h", p], capture_output=True, text=True).stdout.split()
    out[n] = [int(w), int(h)]
json.dump(out, open("compositions/ink.json", "w")); print(len(out), "sprites")
PY
