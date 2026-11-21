#!/bin/bash
# Turns the Straube reader's class rasters (cache/<slice>/pred/<tile>.png) into polygons in EPSG:25833, one class at a
# time, merged across tile seams. The scan sits about half a metre off today's survey; the slice's median offset
# (align_straube_alkis.json) is taken off, then offsetfield.ts moves each vertex by what is left where a tile is surely
# further off (2 m on the east edge), smoothly from tile centre to tile centre so the seams stay whole.
#   out: cache/<slice>/traced.parquet (class, geom)
# usage: trace.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
source "$here/slicevars.sh"
slice_vars "$slice"
work=$own/trace
mkdir -p "$work"
mpp=0.25
# A sheet with no survey of its own takes the offset measured on another slice (.align).
align=$(jq -r ".align // empty" "$slice")
align=${align:+$here/$align}
align=${align:-$own/align_straube_alkis.json}
dx=$(jq '[.[] | .dx] | sort | .[length / 2 | floor]' "$align")
dy=$(jq '[.[] | .dy] | sort | .[length / 2 | floor]' "$align")
echo "scan offset taken off: $dx m east, $dy m north"
# class id -> name, as straube.py numbers them
classes=(none open building public water green rail)

"$here/tiles.sh" "$slice" | while read -r id x0 y0 _ _; do
  [[ -s $cache/pred/$id.png ]] || continue
  # The reader marks whole blocks as built; on the plan, houses are parted only by thin dark lines. The plan's line
  # network (BottomHat, as align.ts and regions.ts find it), without pieces under 400 px (house numbers, lettering),
  # is cut out of private buildings so each house traces on its own (410 pieces for 416 houses on a truth tile).
  # Public buildings are not cut: they rarely share party walls, and the plan cross-hatches many of them, which the
  # cut would shred into slivers. They are closed by 2 px instead, which fills the hatching. Both are opened by 1 px
  # first, which drops slivers under about half a metre (park paths the reader calls building).
  lines=$work/${id}_lines.png
  [[ -s $lines ]] || magick "$cache/rasters/straube/$id.png" -colorspace gray -morphology BottomHat Disk:3 -threshold 7.8% \
    -define connected-components:area-threshold=400 -define connected-components:mean-color=true -connected-components 8 "$lines"
  for c in 2 3 4 5 6; do
    out=$work/${id}_${classes[$c]}.json
    [[ -s $out ]] && continue
    # Pixels of class c become black; no curve fitting, so corners stay square. Specks are dropped: under 6 m2
    # (100 px) for buildings, which also fills holes left by lettering; 4 m2 for parks, 25 m2 for railway land, 1 m2 for water.
    if ((c == 2)); then
      magick "$cache/pred/$id.png" -fill black +opaque "gray($c)" -fill white -opaque "gray($c)" -morphology Open Disk:1 -negate \
        "$lines" -compose Lighten -composite pbm:- |
        potrace -b geojson -a 0 -t 100 -o "$out.part" - && mv "$out.part" "$out"
    elif ((c == 3)); then
      magick "$cache/pred/$id.png" -fill black +opaque "gray($c)" -fill white -opaque "gray($c)" -morphology Open Disk:1 \
        -morphology Close Disk:2 -negate pbm:- |
        potrace -b geojson -a 0 -t 100 -o "$out.part" - && mv "$out.part" "$out"
    else
      t=16; ((c == 5)) && t=64; ((c == 6)) && t=400
      magick "$cache/pred/$id.png" -fill white +opaque "gray($c)" -fill black -opaque "gray($c)" pbm:- |
        potrace -b geojson -a 0 -t "$t" -o "$out.part" - && mv "$out.part" "$out"
    fi
    printf '%s %s %s %s\n' "$id" "${classes[$c]}" "$x0" "$y0" >> "$work/index.txt"
  done
  # The roadway, from the plan's own tint (roadway.ts): build.sh splits open ground into street and courtyard by it.
  out=$work/${id}_roadway.json
  if [[ ! -s $out ]]; then
    bun "$here/roadway.ts" "$cache/rasters/straube/$id.png" | potrace -b geojson -a 0 -t 256 -o "$out.part" - && mv "$out.part" "$out"
    printf '%s %s %s %s\n' "$id" roadway "$x0" "$y0" >> "$work/index.txt"
  fi
  echo "traced $id"
done
sort -u "$work/index.txt" -o "$work/index.txt"

# Pixel coordinates (origin bottom-left) to metres, offset removed, then one union per class across all tiles.
{
  echo "LOAD spatial; CREATE TABLE parts (class VARCHAR, geom GEOMETRY);"
  while read -r id cls x0 y0; do
    f=$work/${id}_${cls}.json
    [[ $(jq '.features | length' "$f") -gt 0 ]] || continue
    echo "INSERT INTO parts SELECT '$cls', ST_SetCRS(ST_Affine(geom, $mpp, 0, 0, $mpp, $x0 - ($dx), $y0 - ($dy)), 'EPSG:25833') FROM ST_Read('$f');"
  done < "$work/index.txt"
  echo "SET geometry_always_xy = true;"
  echo "COPY (SELECT class, ST_SimplifyPreserveTopology(UNNEST(ST_Dump(ST_Union_Agg(ST_MakeValid(geom)))).geom, 0.2) AS geom
               FROM parts GROUP BY class) TO '$work/traced.median.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON');"
} > "$work/assemble.sql"
duckdb < "$work/assemble.sql"
bun "$here/offsetfield.ts" "$slice" "$work/traced.median.geojson" "$work/traced.field.geojson"
duckdb -c "LOAD spatial;
  COPY (SELECT class, ST_SetCRS(ST_MakeValid(geom), 'EPSG:25833') AS geom FROM ST_Read('$work/traced.field.geojson')) TO '$own/traced.parquet' (FORMAT parquet);
  SELECT class, count(*) AS polygons, round(sum(ST_Area(geom))) AS m2 FROM '$own/traced.parquet' GROUP BY 1 ORDER BY 3 DESC;"
