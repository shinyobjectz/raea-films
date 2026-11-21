#!/bin/bash
# The flat surfaces the 3D graybox drapes on the ground, cut per 500 m tile (graybox.ts builds the meshes from them):
#   sidewalk   street within 3.5 m of a block edge, 1.5 m in lanes too narrow for that (an assumed width until it is
#              measured on the 1928 photos)
#   courtyard  the courtyards of build.sh
#   green, rail, water (water unioned per tile, so quays are drawn only where water meets land)
#   bridge     street inside the river corridor (water closed over gaps up to 40 m), less the water itself
#   out: cache/<slice>/graybox/surfaces.geojson (tile, layer, geometry; EPSG:25833)
# usage: graybox.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
source "$here/slicevars.sh"
slice_vars "$slice"
mkdir -p "$own/graybox"
"$here/tiles.sh" "$slice" > "$own/graybox/tiles.txt"
out=$own/graybox/surfaces.geojson
rm -f "$out"
duckdb -bail <<SQL
LOAD spatial;
SET geometry_always_xy = true;
CREATE TABLE t AS SELECT id, ST_MakeEnvelope(x0, y0, x1, y1) AS env
FROM read_csv('$own/graybox/tiles.txt', delim = ' ', header = false,
              columns = {'id': 'VARCHAR', 'x0': 'INTEGER', 'y0': 'INTEGER', 'x1': 'INTEGER', 'y1': 'INTEGER'});
CREATE TABLE street AS SELECT ST_Union_Agg(geom) AS g FROM ST_Read('$map/open.geojson') WHERE kind = 'street';
CREATE TABLE water AS SELECT ST_Union_Agg(geom) AS g FROM ST_Read('$map/water.geojson');
CREATE TABLE corridor AS SELECT ST_Buffer(ST_Buffer(g, 20), -20) AS g FROM water;

-- Each tile's street with 12 m to spare, so the erosion's false edge at the cut falls outside the tile.
CREATE TABLE st AS SELECT t.id, t.env, ST_Intersection(s.g, ST_Buffer(t.env, 12, 1)) AS g FROM t, street s;
CREATE TABLE carriage AS
SELECT id, ST_Union(ST_Buffer(g, -3.5, 2), ST_Difference(ST_Buffer(g, -1.5, 2), ST_Buffer(ST_Buffer(g, -3.5, 2), 2.5, 2))) AS g FROM st;

CREATE TABLE surfaces (tile VARCHAR, layer VARCHAR, geom GEOMETRY);
INSERT INTO surfaces SELECT st.id, 'sidewalk', ST_Intersection(ST_SimplifyPreserveTopology(ST_Difference(st.g, c.g), 0.25), st.env) FROM st JOIN carriage c USING (id);
-- The carriageway itself, only for its edge: the kerb.
INSERT INTO surfaces SELECT c.id, 'carriage', ST_Intersection(ST_SimplifyPreserveTopology(c.g, 0.25), st.env) FROM st JOIN carriage c USING (id);
INSERT INTO surfaces SELECT t.id, 'bridge', ST_Intersection(ST_Intersection(s.g, ST_Difference(k.g, w.g)), t.env) FROM t, street s, corridor k, water w;
INSERT INTO surfaces SELECT t.id, 'water', ST_Intersection(w.g, t.env) FROM t, water w;
INSERT INTO surfaces SELECT t.id, 'courtyard', ST_Intersection(o.geom, t.env) FROM t, ST_Read('$map/open.geojson') o
  WHERE o.kind = 'courtyard' AND ST_Intersects(o.geom, t.env);
INSERT INTO surfaces SELECT t.id, 'green', ST_Intersection(o.geom, t.env) FROM t, ST_Read('$map/green.geojson') o WHERE ST_Intersects(o.geom, t.env);
INSERT INTO surfaces SELECT t.id, 'rail', ST_Intersection(o.geom, t.env) FROM t, ST_Read('$map/rail.geojson') o WHERE ST_Intersects(o.geom, t.env);

CREATE TABLE parts AS
SELECT tile, layer, d.geom FROM (SELECT tile, layer, UNNEST(ST_Dump(ST_MakeValid(geom))) AS d FROM surfaces WHERE geom IS NOT NULL)
WHERE ST_GeometryType(d.geom) = 'POLYGON' AND ST_Area(d.geom) >= 1;
COPY parts TO '$out' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
SELECT layer, count(*) AS pieces, round(sum(ST_Area(geom))) AS m2 FROM parts GROUP BY 1 ORDER BY 1;
SQL
