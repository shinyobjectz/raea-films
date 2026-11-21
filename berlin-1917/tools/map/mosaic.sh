#!/bin/bash
# Cuts one box out of a slice's raster tiles (cache/<slice>/rasters/<key>/) as a single image at a given scale.
# usage: mosaic.sh KEY X0 Y0 X1 Y1 METRES_PER_PX OUT [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
key=$1 X0=$2 Y0=$3 X1=$4 Y1=$5 mpp=$6 out=$7
slice=${8:-$here/slice.json}
name=$(jq -r .name "$slice")
cache=$here/../../cache/$name
read -r SX0 SY0 _ _ T < <(jq -r '[.bbox[], .tile] | @tsv' "$slice")
ext=$(jq -r --arg k "$key" '.rasters[] | select(.key == $k) | .ext' "$slice")
tmpp=$(jq -r --arg k "$key" '.rasters[] | select(.key == $k) | .mpp' "$slice")
tpx=$(awk -v t="$T" -v m="$tmpp" 'BEGIN{printf "%d", t/m}')
# The tiles that cover the box, as a grid from the north-west corner.
gx0=$(( SX0 + ( (${X0%.*} - SX0) / T ) * T )); gy1=$(( SY0 + ( (${Y1%.*} - SY0 + T - 1) / T ) * T ))
cols=$(( ( ${X1%.*} - gx0 + T - 1 ) / T )); rows=$(( ( gy1 - ${Y0%.*} + T - 1 ) / T ))
files=()
for ((r = 0; r < rows; r++)); do
  for ((c = 0; c < cols; c++)); do
    f=$cache/rasters/$key/$(( (gx0 + c * T) / 100 ))_$(( (gy1 - (r + 1) * T) / 100 )).$ext
    [[ -s $f ]] && files+=("$f") || files+=("xc:white[${tpx}x${tpx}]")
  done
done
cx=$(awk -v a="$X0" -v g="$gx0" -v m="$tmpp" 'BEGIN{printf "%d", (a-g)/m}')
cy=$(awk -v a="$Y1" -v g="$gy1" -v m="$tmpp" 'BEGIN{printf "%d", (g-a)/m}')
cw=$(awk -v a="$X0" -v b="$X1" -v m="$tmpp" 'BEGIN{printf "%d", (b-a)/m}')
ch=$(awk -v a="$Y0" -v b="$Y1" -v m="$tmpp" 'BEGIN{printf "%d", (b-a)/m}')
ow=$(awk -v a="$X0" -v b="$X1" -v m="$mpp" 'BEGIN{printf "%d", (b-a)/m}')
oh=$(awk -v a="$Y0" -v b="$Y1" -v m="$mpp" 'BEGIN{printf "%d", (b-a)/m}')
args=()
for ((r = 0; r < rows; r++)); do
  args+=("(" "${files[@]:$((r * cols)):$cols}" "+append" ")")
done
magick "${args[@]}" -append -crop "${cw}x${ch}+${cx}+${cy}" +repage -resize "${ow}x${oh}!" -quality 90 "$out"
echo "ok $out ${ow}x${oh} from ${cols}x${rows} tiles"
