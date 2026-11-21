#!/usr/bin/env bash
# The Hochbahn's band cleared of what the plan reader took for buildings there. The 1910 plan draws the elevated line and
# its stations over the streets, and the reader reads some of that as building: pieces of the viaduct (small "public"
# pieces along the Landwehrkanal, at Möckernbrücke) and whole station halls (Prinzenstrasse's, 60 by 16 m in the middle
# of Gitschiner Strasse, given four storeys from the station's own monument entry). hochbahn.ts draws the viaduct and its
# stations, so these are dropped:
#   a building lying BAND_SHARE or more within BAND m of the line hochbahn.ts draws (map/1917/city/hochbahn.geojson:
#   moved to the street's middle, its raised runs only), or before it has run, of the city U-Bahn layer's viaduct and
#   ramp stretches as traced (map/1917/city/ubahn.geojson; of a ramp stretch, only the RAMP m at its viaduct end: the
#   rest is tunnel, and Wittenbergplatz's entrance hall stands over it);
#   a building within HALL_NEAR m of a station open in winter 1917-18 and lying HALL_SHARE or more within HALL_BAND m of
#   the line (the trace can run metres off the plan's hall, and a hall in the street is a wall to streetmiddle.ts).
# A station's own buildings beside the deck stay: stations.sh, after this, brings in today's (source "alkis-station",
# never dropped here) and holds the plan's stair houses to their height. So does the base of a station whose hall
# stood on a built ground floor (BASES, from the Festschrift's 1902 photographs: Nollendorfplatz's station is closed
# from the street to its dome, Bülowstrasse's hall stands on an enclosed base in the street's middle): the piece its
# station point falls in. A drop is one way: a pass of viaduct.sh on a line moved further than the next one leaves its
# drops, so after a change to streetmiddle.ts the line's sheets are rebuilt fresh.
# Their footprints join the open ground as street (source "band": they lie in the streets the line runs over), and the
# shops placed on them (shops.geojson) go with them. A run again finds nothing more.
#   bands.sh SLICE.json   rewrites map/1917/{buildings,open,shops}.geojson in place
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
source "$here/slicevars.sh"
slice_vars "$1"
BAND=8 BAND_SHARE=0.6 HALL_NEAR=15 HALL_BAND=20 HALL_SHARE=0.5 RAMP=200 BASES="'Nollendorfplatz', 'Bülowstraße'"
ub=$(cd "$here/../.." && pwd)/map/1917/city/ubahn.geojson
# the line as hochbahn.ts draws it (moved to the street's middle, its raised runs only), once it has run
drawn=$(cd "$here/../.." && pwd)/map/1917/city/hochbahn.geojson
[[ -s $ub && -s $map/buildings.geojson ]] || { echo "bands: no U-Bahn layer or no buildings, nothing to clear"; exit 0; }
[[ $(jq '.features | length' "$map/buildings.geojson") -gt 0 ]] || { echo "bands: no buildings"; exit 0; }
sql=$own/bands.sql
if [[ -s $drawn ]]; then
  line_sql="CREATE TABLE line AS SELECT ST_Union_Agg(u.geom) AS g FROM ST_Read('$drawn') u, frame f WHERE ST_Intersects(u.geom, ST_Buffer(f.g, $HALL_BAND));"
else
  # a ramp stretch runs station to station, the ramp itself its last RAMP m at the viaduct end (hochbahn.ts's RAMP)
  line_sql="CREATE TABLE line AS SELECT ST_Union_Agg(CASE WHEN u.kind = 'viaduct' THEN u.geom
    WHEN u.to_level = 'viaduct' THEN ST_LineSubstring(u.geom, greatest(0, 1 - $RAMP / ST_Length(u.geom)), 1)
    ELSE ST_LineSubstring(u.geom, 0, least(1, $RAMP / ST_Length(u.geom))) END) AS g FROM ST_Read('$ub') u, frame f
  WHERE u.feature = 'stretch' AND u.kind IN ('viaduct', 'ramp') AND ST_Intersects(u.geom, ST_Buffer(f.g, $HALL_BAND));"
fi
rm -f "${own:?}/shops.bands.geojson" "${own:?}/buildings.bands.geojson"
# a buildings file written by GDAL (outside.sh) is written back by GDAL, every column on every feature as it was; one
# written by bun (the slice's, sparse: a feature leaves out what it lacks) is filtered by bun, so its readers see the
# same keys
if [[ $(head -c 2 "$map/buildings.geojson") == "{\"" ]]; then
  b_sql="SELECT 0 AS n"
else
  b_sql="COPY (SELECT COLUMNS(c -> c <> 'OGC_FID') FROM b WHERE id NOT IN (SELECT id FROM gone)) TO '$own/buildings.bands.geojson'
  WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833')"
fi
shops_sql="SELECT 0 AS n"
if [[ -s $map/shops.geojson ]] && [[ $(jq '.features | length' "$map/shops.geojson") -gt 0 ]]; then
  shops_sql="COPY (SELECT COLUMNS(c -> c <> 'OGC_FID') FROM ST_Read('$map/shops.geojson') WHERE building_key NOT IN (SELECT key FROM gone WHERE key IS NOT NULL))
  TO '$own/shops.bands.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833')"
fi
cat > "$sql" <<SQL
LOAD spatial; SET geometry_always_xy = true;
CREATE TABLE frame AS SELECT ST_MakeEnvelope($X0, $Y0, $X1, $Y1) AS g;
$line_sql
CREATE TABLE stn AS SELECT u.name, geom FROM ST_Read('$ub') u, frame f
  WHERE u.feature = 'station' AND coalesce(nullif(u.opened::VARCHAR, ''), '0000') <= '1917-12'
  AND coalesce(nullif(u.closed::VARCHAR, ''), '9999') > '1918' AND ST_Intersects(u.geom, ST_Buffer(f.g, $HALL_NEAR));
CREATE TABLE b AS SELECT * FROM ST_Read('$map/buildings.geojson');
CREATE TABLE gone AS SELECT b.id, b.key, ST_MakeValid(b.geom) AS geom,
  CASE WHEN ST_Area(ST_Intersection(ST_MakeValid(b.geom), ST_Buffer(l.g, $BAND))) >= $BAND_SHARE * ST_Area(b.geom) THEN 'band' ELSE 'hall' END AS why
FROM b, line l WHERE l.g IS NOT NULL AND coalesce(b.source, '') <> 'alkis-station'
  AND NOT EXISTS (SELECT 1 FROM stn s WHERE s.name IN ($BASES) AND ST_Intersects(s.geom, b.geom)) AND (
  ST_Area(ST_Intersection(ST_MakeValid(b.geom), ST_Buffer(l.g, $BAND))) >= $BAND_SHARE * ST_Area(b.geom)
  OR (EXISTS (SELECT 1 FROM stn s WHERE ST_DWithin(s.geom, b.geom, $HALL_NEAR))
      AND ST_Area(ST_Intersection(ST_MakeValid(b.geom), ST_Buffer(l.g, $HALL_BAND))) >= $HALL_SHARE * ST_Area(b.geom)));
$b_sql;
COPY (SELECT id FROM gone) TO '$own/bands.gone.csv' (HEADER false);
COPY (SELECT COLUMNS(c -> c <> 'OGC_FID') FROM (
    SELECT * FROM ST_Read('$map/open.geojson')
    UNION ALL BY NAME SELECT 'street' AS kind, 'band' AS source, round(ST_Area(geom), 1) AS area_m2, geom FROM gone))
  TO '$own/open.bands.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
$shops_sql;
SELECT 'bands: ' || (SELECT count(*) FROM gone WHERE why = 'band') || ' pieces of the viaduct and '
  || (SELECT count(*) FROM gone WHERE why = 'hall') || ' station halls dropped ('
  || (SELECT coalesce(round(sum(ST_Area(geom))), 0) FROM gone) || ' m2, now street)' AS bands;
SQL
duckdb -bail -noheader -list < "$sql"
if [[ -s $own/buildings.bands.geojson ]]; then
  mv "$own/buildings.bands.geojson" "$map/buildings.geojson"
else
  bun -e '
    const [f, g] = process.argv.slice(1), gone = new Set((await Bun.file(g).text()).split("\n").filter(Boolean).map(Number));
    const fc = await Bun.file(f).json(), keep = fc.features.filter((x) => !gone.has(x.properties.id));
    if (keep.length === fc.features.length) process.exit(0);
    const { features, ...head } = fc;
    await Bun.write(f, JSON.stringify(head).slice(0, -1) + ",\"features\": [\n" + keep.map((x) => JSON.stringify(x)).join(",\n") + "\n]\n}\n");
  ' "$map/buildings.geojson" "$own/bands.gone.csv"
fi
mv "$own/open.bands.geojson" "$map/open.geojson"
[[ -s $own/shops.bands.geojson ]] && mv "$own/shops.bands.geojson" "$map/shops.geojson"
exit 0
