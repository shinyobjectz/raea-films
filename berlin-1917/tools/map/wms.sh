#!/bin/bash
# One WMS GetMap from Berlin's Geoportal in EPSG:25833.
# usage: wms.sh SERVICE LAYER MINX MINY MAXX MAXY METRES_PER_PIXEL OUT.(png|jpg)
set -euo pipefail
svc=$1 layer=$2 x0=$3 y0=$4 x1=$5 y1=$6 mpp=$7 out=$8
w=$(awk -v a="$x0" -v b="$x1" -v m="$mpp" 'BEGIN{printf "%d", (b-a)/m}')
h=$(awk -v a="$y0" -v b="$y1" -v m="$mpp" 'BEGIN{printf "%d", (b-a)/m}')
case "$out" in *.jpg) fmt=image/jpeg ;; *) fmt=image/png ;; esac
url="https://gdi.berlin.de/services/wms/${svc}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:25833&BBOX=${x0},${y0},${x1},${y1}&WIDTH=${w}&HEIGHT=${h}&FORMAT=${fmt}"
curl -sS -m 120 --fail -o "$out" "$url"
kind=$(file -b "$out")
case "$kind" in
  *XML*|*text*) echo "FAIL $out: $(head -c 300 "$out")"; exit 1 ;;
  *) echo "ok $out ${w}x${h} $(wc -c < "$out" | tr -d ' ') bytes" ;;
esac
