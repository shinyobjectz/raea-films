#!/bin/bash
# The underground railways of 1917 in the slice, from OpenHistoricalMap's dated U-Bahn stations (CC0) and its 1917
# street centrelines. The lines in service take their paths from map/1917/city/ubahn.geojson (tunnels.ts: each
# stretch the cheapest route over the Straube plan, where its "Untergrundbahn" band and the Hochbahn viaduct cost
# least; path = "plan-traced"), one feature per stretch, tunnels and ramps as underground, viaducts as elevated.
# Without that file they run station to station in straight pieces (path = "station-to-station").
#   out: map/1917/underground.geojson (lines and stations, EPSG:25833)
# usage: underground.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
name=$(jq -r .name "$slice")
cache=$(cd "$here/../../cache/$name" && pwd)
map=$(cd "$here/../../map/1917" && pwd)
read -r X0 Y0 X1 Y1 < <(jq -r '.bbox | @tsv' "$slice")
st=$cache/ohm_subway_stations.json
[[ -s $st ]] || curl -sS -m 90 --fail -o "$st" --data-urlencode \
  'data=[out:json][timeout:60];node["railway"="station"]["station"="subway"](52.47,13.33,52.55,13.45);out;' \
  https://overpass-api.openhistoricalmap.org/api/interpreter

# The traced stretches replace the straight lines when tunnels.ts has made them.
traced_sql=""
if [[ -s $map/city/ubahn.geojson ]]; then
  traced_sql="DELETE FROM lines;
INSERT INTO lines
SELECT line || ': ' || \"from\" || ' - ' || \"to\", CASE kind WHEN 'viaduct' THEN 'elevated' ELSE 'underground' END, 'in service', opened, path, geom
FROM ST_Read('$map/city/ubahn.geojson') WHERE feature = 'stretch';"
fi
duckdb -bail <<SQL
LOAD spatial;
SET geometry_always_xy = true;
CREATE TABLE stations AS
SELECT e.tags.name AS name, e.tags.start_date AS opened, e.tags.end_date AS closed,
       ST_Transform(ST_Point(e.lon, e.lat), 'EPSG:4326', 'EPSG:25833', always_xy := true) AS geom
FROM (SELECT UNNEST(elements) e FROM read_json('$st'))
WHERE coalesce(left(e.tags.start_date, 4), '0000') <= '1917' AND coalesce(left(e.tags.end_date, 4), '9999') > '1917';

-- The lines of 1917 as station sequences (Berlin's U-Bahn history: 1902 Stammstrecke, 1907-08 extension to
-- Spittelmarkt, 1913 to Alexanderplatz and Nordring).
CREATE TABLE seq (line VARCHAR, kind VARCHAR, opened VARCHAR, stops VARCHAR[]);
INSERT INTO seq VALUES
  ('Stammstrecke (Hochbahn)', 'elevated', '1902', ['Gleisdreieck', 'Möckernbrücke', 'Hallesches Tor', 'Prinzenstraße', 'Kottbusser Tor']),
  ('Spittelmarkt and Centrum line', 'underground', '1907-1913',
   ['Gleisdreieck', 'Leipziger Platz', 'Kaiserhof', 'Friedrichstraße', 'Hausvogteiplatz', 'Spittelmarkt', 'Inselbrücke', 'Klosterstraße', 'Alexanderplatz', 'Schönhauser Tor']);
CREATE TABLE lines AS
SELECT q.line, q.kind, 'in service' AS status, q.opened, 'station-to-station' AS path,
       ST_MakeLine(list(s.geom ORDER BY i)) AS geom
FROM (SELECT line, kind, opened, UNNEST(stops) AS stop, generate_subscripts(stops, 1) AS i FROM seq) q
JOIN stations s ON s.name = q.stop
GROUP BY ALL;
$traced_sql

-- The city's North-South line under Friedrichstrasse: begun 2 December 1912, all work stopped in 1917 (five of seven
-- sections under construction, one finished in shell, one not begun; opened 1923). Its path is Friedrichstrasse.
INSERT INTO lines
SELECT 'Nord-Süd-Bahn (works)', 'underground', 'works halted 1917', '1923 (opened)', 'street centreline',
       ST_LineMerge(ST_Union_Agg(ST_MakeLine(list_transform(e.geometry, lambda p: ST_Transform(ST_Point(p.lon, p.lat), 'EPSG:4326', 'EPSG:25833', always_xy := true)))))
FROM (SELECT UNNEST(elements) e FROM read_json('$cache/ohm.json', maximum_object_size = 200000000))
WHERE e.type = 'way' AND e.tags.highway IS NOT NULL AND e.tags.name = 'Friedrichstraße';

CREATE TABLE out AS
SELECT 'line' AS feature, line AS name, kind, status, opened, path, ST_Intersection(geom, ST_MakeEnvelope($X0, $Y0, $X1, $Y1)) AS geom FROM lines
UNION ALL
SELECT 'station', name, 'underground', 'in service', opened, NULL, geom FROM stations
WHERE ST_Intersects(geom, ST_MakeEnvelope($X0, $Y0, $X1, $Y1));
COPY (SELECT * FROM out WHERE NOT ST_IsEmpty(geom)) TO '$map/underground.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
SELECT feature, name, status, round(ST_Length(geom)) AS m FROM out ORDER BY feature, name;
SQL
