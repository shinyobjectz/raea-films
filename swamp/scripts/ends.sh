#!/bin/zsh
# The start and end of every shot (fractions 0.1 and 0.9), as two contact sheets: out/real/ends/.
cd "$(dirname "$0")/.."
mkdir -p out/real/ends
ids=($(grep -o 'id: "[0-9][0-9]-[a-z-]*"' components/take.ts | cut -d'"' -f2))
for id in $ids; do
  n=$(grep "id: \"$id\"" components/take.ts | sed -E 's/.*from: ([0-9]+), to: ([0-9A-Z]+).*/\1 \2/')
  from=${n% *}; to=${n#* }; [ "$to" = "END" ] && to=1500
  for frac in 0.1 0.9; do
    fr=$(( (to - from) * frac )); fr=${fr%.*}
    raea render compositions/hype.tsx --composition p$id --frame $fr -o out/real/ends/$id-$frac.png 2>&1 | grep -i "REFUSED\|panic\|error:" | cut -c1-300
    echo "$id $frac"
  done
done
/opt/homebrew/bin/magick montage out/real/ends/0*.png -tile 4x -geometry 640x360+2+2 -background "#111" out/real/ends-a.jpg 2>/dev/null
/opt/homebrew/bin/magick montage out/real/ends/1*.png -tile 4x -geometry 640x360+2+2 -background "#111" out/real/ends-b.jpg 2>/dev/null
echo sheets
