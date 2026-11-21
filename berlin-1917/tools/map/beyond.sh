#!/usr/bin/env bash
# Vacant land the 1910 land-use map draws built up is "beyond": the plan leaves the towns outside Berlin's 1910
# boundary blank (Charlottenburg, Schöneberg, Rixdorf; incorporated 1920), so build.sh, finding open ground far from any
# drawn building, calls their streets and blocks vacant. use1910.ts writes the map's built-up land as 25 m cells
# (cache/<slice>/built1910.csv); here each vacant piece is cut by them: inside, kind "beyond" (a town the plan doesn't
# draw, its buildings unknown here); outside, still vacant (fields, lots not yet built on). The land-use map covers
# nothing north of about 5823800 or east of about 395400, so there vacant stays vacant whatever stood.
#   beyond.sh SLICE.json   rewrites map/1917/open.geojson in place
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
source "$here/slicevars.sh"
slice_vars "$1"
cells=$own/built1910.csv
[[ -s $cells ]] || { echo "beyond: no built1910.csv (use1910.ts not run)" >&2; exit 0; }
tmp=$own/open.beyond.geojson
duckdb -bail <<SQL
LOAD spatial;
-- closed over 20 m, so a town's streets between its built cells are part of it
CREATE TABLE b AS SELECT ST_Buffer(ST_Buffer(ST_Union_Agg(ST_MakeEnvelope(x0, y0, x1, y1)), 20), -20) AS g FROM read_csv('$cells', header = true, columns = {'x0': 'DOUBLE', 'y0': 'DOUBLE', 'x1': 'DOUBLE', 'y1': 'DOUBLE'});
-- vacant and beyond together, so a run again (new cells) starts from what build.sh called vacant
CREATE TABLE o AS SELECT kind, geom FROM ST_Read('$map/open.geojson');
CREATE TABLE cut AS
  SELECT kind, geom FROM o WHERE kind NOT IN ('vacant', 'beyond')
  UNION ALL SELECT 'beyond', UNNEST(ST_Dump(ST_Intersection(o.geom, b.g))).geom FROM o, b
    WHERE o.kind IN ('vacant', 'beyond') AND b.g IS NOT NULL AND ST_Intersects(o.geom, b.g)
  UNION ALL SELECT 'vacant', UNNEST(ST_Dump(CASE WHEN b.g IS NULL THEN o.geom ELSE ST_Difference(o.geom, b.g) END)).geom FROM o, b
    WHERE o.kind IN ('vacant', 'beyond');
CREATE TABLE out AS SELECT kind, geom FROM cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 1;
COPY (SELECT kind, round(ST_Area(geom), 1) AS area_m2, geom FROM out) TO '$tmp' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
SELECT 'beyond: ' || string_agg(kind || ' ' || n || ' pieces ' || km2 || ' km2', ', ') FROM
  (SELECT kind, count(*) AS n, round(sum(ST_Area(geom)) / 1e6, 2) AS km2 FROM out WHERE kind IN ('vacant', 'beyond') GROUP BY 1 ORDER BY 1);
SQL
mv "$tmp" "$map/open.geojson"
