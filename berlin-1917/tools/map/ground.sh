#!/bin/bash
# The slice's ground as a 2 m grid from DGM1 (1 m, today's bare earth), written as a 16-bit greyscale PNG of
# centimetres above NHN, north up, with a JSON header beside it. Streams each 2 km zip; nothing is unpacked to disk.
#   out: map/1917/ground_2m.png, map/1917/ground_2m.json; cache/<slice>/ground_2m.u16 (raw, for contours.ts)
# usage: ground.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
source "$here/slicevars.sh"
slice_vars "$slice"
cell=2
W=$(((X1 - X0) / cell)) H=$(((Y1 - Y0) / cell))
db=$own/ground.duckdb
rm -f "${db:?}"
duckdb "$db" -c "CREATE TABLE cells (cx INTEGER, cy INTEGER, z DOUBLE, n INTEGER);"
for zip in "$cache"/dgm1/DGM1_*.zip; do
  # Only the 2 km tiles that reach the slice.
  zx=$(basename "$zip" .zip | cut -d_ -f2) zy=$(basename "$zip" .zip | cut -d_ -f3)
  (( zx * 1000 + 2000 > X0 && zx * 1000 < X1 && zy * 1000 + 2000 > Y0 && zy * 1000 < Y1 )) || continue
  xyz=$(unzip -Z1 "$zip" | grep -i '\.xyz$' | head -1)
  unzip -p "$zip" "$xyz" | duckdb "$db" -c "
    INSERT INTO cells
    SELECT floor((x - $X0) / $cell)::INTEGER, floor(($Y1 - y) / $cell)::INTEGER, sum(z), count(*)
    FROM read_csv('/dev/stdin', delim = ' ', header = false, columns = {'x': 'DOUBLE', 'y': 'DOUBLE', 'z': 'DOUBLE'})
    WHERE x >= $X0 AND x < $X1 AND y > $Y0 AND y <= $Y1
    GROUP BY ALL;"
  echo "read $(basename "$zip")"
done
# Every cell in row order, centimetres; a cell no tile covered gets 0 and is counted.
duckdb "$db" -noheader -csv -c "
  WITH g AS (SELECT cx, cy, sum(z) / sum(n) AS z FROM cells GROUP BY cx, cy),
       grid AS (SELECT x AS cx, y AS cy FROM range(0, $W) a(x) CROSS JOIN range(0, $H) b(y))
  SELECT coalesce(round(g.z * 100), 0)::INTEGER FROM grid LEFT JOIN g USING (cx, cy) ORDER BY grid.cy, grid.cx;" \
  > "$own/ground_2m.csv"
bun "$here/u16.ts" "$own/ground_2m.csv" "$own/ground_2m.u16"
magick -size "${W}x${H}" -depth 16 -endian LSB "gray:$own/ground_2m.u16" -define png:bit-depth=16 "$map/ground_2m.png"
read -r zmin zmax holes < <(duckdb "$db" -noheader -list -separator ' ' -c "
  WITH g AS (SELECT sum(z) / sum(n) AS z FROM cells GROUP BY cx, cy)
  SELECT round(min(z), 2), round(max(z), 2), $W * $H - count(*) FROM g;")
jq -n --argjson x0 "$X0" --argjson y1 "$Y1" --argjson w "$W" --argjson h "$H" --argjson c "$cell" \
  --argjson zmin "$zmin" --argjson zmax "$zmax" --argjson holes "$holes" \
  '{crs: "EPSG:25833", origin_top_left: [$x0, $y1], cell_m: $c, width: $w, height: $h,
    value: "centimetres above NHN (DHHN2016), 0 = no data", source: "DGM1 Berlin (dl-de/zero-2.0), today'"'"'s bare earth",
    z_min_m: $zmin, z_max_m: $zmax, cells_without_data: $holes}' > "$map/ground_2m.json"
rm -f "${db:?}" "${own:?}/ground_2m.csv"
cat "$map/ground_2m.json"
