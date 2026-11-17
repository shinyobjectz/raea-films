#!/bin/zsh
# One still from the middle (or a given fraction) of each shot, small, and a contact sheet of them: out/real/mid/.
cd "$(dirname "$0")/.."
frac=${1:-0.5}
ids=(${=2:-$(grep -o 'id: "[0-9][0-9]-[a-z-]*"' components/take.ts | cut -d'"' -f2)})
for id in $ids; do
  n=$(grep "id: \"$id\"" components/take.ts | sed -E 's/.*from: ([0-9]+), to: ([0-9A-Z]+).*/\1 \2/')
  from=${n% *}; to=${n#* }; [ "$to" = "END" ] && to=1500
  fr=$(( (to - from) * frac )); fr=${fr%.*}
  raea render compositions/hype.tsx --composition p$id --frame $fr -o out/real/mid/$id.png 2>&1 | grep -i "REFUSED\|panic\|error:" | cut -c1-300
done
/opt/homebrew/bin/magick montage out/real/mid/*.png -tile 3x -geometry 800x450+3+3 -background "#111" out/real/mid-sheet.png 2>/dev/null
echo sheet
