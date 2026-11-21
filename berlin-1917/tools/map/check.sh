#!/bin/bash
# Checks the 1917 map against known answers and writes out/map/checks.txt:
#   - landmarks.tsv: today's footprint of each landmark that stood in 1917 must be mostly covered by a 1917 public
#     building; the Air Ministry of 1935-36 must match no 1917 building
#   - Vossstrasse's north side must be separate houses (the Neue Reichskanzlei replaced them in 1938-39)
#   - open ground on OpenHistoricalMap's 1917 street centrelines must be street, not courtyard (checkstreets.ts)
#   - counts by source, the Straube reader's holdout scores, and how far the scan sat from today's survey
# usage: check.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
name=$(jq -r .name "$slice")
cache=$(cd "$here/../../cache/$name" && pwd)
map=$(cd "$here/../../map/1917" && pwd)
out=$here/../../out/map/checks.txt
mkdir -p "$(dirname "$out")"
alkis=""
for f in "$cache"/alkis/*.json; do
  alkis+="${alkis:+ UNION ALL }SELECT id, ST_SetCRS(geom, 'EPSG:25833') AS geom FROM ST_Read('$f')"
done
{
echo "# 1917 map checks, slice $name, $(date '+%Y-%m-%d %H:%M')"
duckdb -bail <<SQL
LOAD spatial;
CREATE TABLE b AS SELECT * REPLACE (ST_SetCRS(geom, 'EPSG:25833') AS geom) FROM ST_Read('$map/buildings.geojson');
CREATE TABLE lm AS
SELECT l.name, l.expect, ST_Union_Agg(a.geom) AS geom
FROM read_csv('$here/landmarks.tsv', delim = '\t', comment = '#', header = true) l
JOIN ($alkis) a ON a.id = l.id GROUP BY ALL;
SELECT 'Landmarks (share of today''s footprint)' AS section;
SELECT l.name, l.expect,
       round(coalesce(sum(ST_Area(ST_Intersection(b.geom, l.geom))) FILTER (b.kind = 'public'), 0) / ST_Area(any_value(l.geom)), 2) AS public,
       round(coalesce(sum(ST_Area(ST_Intersection(b.geom, l.geom))), 0) / ST_Area(any_value(l.geom)), 2) AS any_built,
       round(coalesce(max(ST_Area(ST_Intersection(b.geom, l.geom)) / ST_Area(ST_Union(b.geom, l.geom))), 0), 2) AS best_iou,
       any_value(b.source) AS source,
       CASE WHEN l.expect = 'absent' THEN coalesce(max(ST_Area(ST_Intersection(b.geom, l.geom)) / ST_Area(ST_Union(b.geom, l.geom))), 0) < 0.5
            ELSE coalesce(sum(ST_Area(ST_Intersection(b.geom, l.geom))) FILTER (b.kind = 'public'), 0) / ST_Area(any_value(l.geom)) >= 0.5 END AS pass
FROM lm l LEFT JOIN b ON ST_Intersects(b.geom, l.geom)
GROUP BY l.name, l.expect ORDER BY pass, l.name;

-- Vossstrasse (OpenHistoricalMap way 201860475): buildings whose middle lies 5-45 m north of it.
CREATE TABLE voss AS SELECT ST_SetCRS(ST_Transform(ST_MakeLine(list_transform(e.geometry, lambda p: ST_Point(p.lon, p.lat))), 'EPSG:4326', 'EPSG:25833', always_xy := true), 'EPSG:25833') AS g
FROM (SELECT unnest(elements) AS e FROM read_json('$cache/ohm.json', maximum_object_size = 400000000)) WHERE e.id = 201860475;
SELECT 'Vossstrasse north side: separate buildings (the Neue Reichskanzlei of 1939 is one)' AS check_, count(*) AS buildings, count(*) >= 6 AS pass
FROM b, voss WHERE ST_DWithin(ST_Centroid(b.geom), voss.g, 45)
  AND ST_Y(ST_Centroid(b.geom)) > ST_Y(ST_ClosestPoint(voss.g, ST_Centroid(b.geom))) + 5;

SELECT 'Buildings by source' AS section;
SELECT source, kind, count(*) AS buildings, round(sum(ST_Area(geom))) AS m2 FROM b GROUP BY ALL ORDER BY ALL;
SQL
echo
bun "$here/checkstreets.ts" "$slice"
echo
echo "Straube reader, holdout tiles (IoU per class; built = private and public together):"
jq -r '.[-1] | "  step \(.step), mean of the three tiles: " + ([.holdout | [.[]] as $t | ($t[0] | keys_unsorted[]) as $k | "\($k) \(([$t[][$k]] | add / length * 1000 | round / 1000))"] | join(", "))' "$cache/model/log.json" 2>/dev/null || echo "  (not trained yet)"
for axis in dx dy; do
  jq -r --arg a "$axis" '[.[] | .[$a]] | sort | "Straube scan against today'"'"'s survey, \($a) (m): median \(.[length / 2 | floor]), range \(.[0]) to \(.[-1]), \(length) tiles"' "$cache/align_straube_alkis.json"
done
} 2>&1 | grep -vE 'WARNING|axis order|EASTING|authority|To avoid|KML|^$' | tee "$out"
