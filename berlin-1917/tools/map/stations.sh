#!/usr/bin/env bash
# The Hochbahn's own station buildings beside the deck. bands.sh clears the line's band of what the plan reader took
# for buildings there, and hochbahn.ts draws the deck, platforms and a hall over them; but a station also had buildings
# at street level beside the viaduct, and Siemens & Halske's 1902 Festschrift photographs them: Schlesisches Tor's
# station building, Prinzenstrasse's stair house with a covered bridge to its platforms. So, after bands.sh:
#   - today's buildings (ALKIS) of a station's own kind (Bahnhofsgebäude, Gebäude zum U-Bahnhof, Betriebsgebäude für
#     Schienenverkehr), 40 m2 and more, half inside the listed monument of an elevated station that stood by 1917
#     (every phase dated by 1917) and less than BAND_SHARE on the line's band, come in as source "alkis-station" with
#     today's storeys: the deck's own width (DECK m either side of the drawn line, HALL near a station) cut out, and
#     what an existing building already holds; their ground leaves the open layer. Today's footprint stands for 1917's
#     there (ASSUMED, as outside.sh's monument route): Schlesisches Tor's and Warschauer Brücke's still stand.
#   - a building of the plan carrying such a station's monument number off the band (Prinzenstrasse's 7 m stair house,
#     given the station's four storeys by heights.ts) is held to STAIR storeys: the platform's 7.1 m over the street and
#     a roof, as the plate shows it (ASSUMED until measured). So is the base bands.sh keeps under a hall that stood on
#     a built ground floor (its BASES: the piece the station point falls in), up to the platform.
# A run again adds and holds nothing more. The drawn line is map/1917/city/hochbahn.geojson (hochbahn.ts).
#   stations.sh SLICE.json   rewrites map/1917/{buildings,open}.geojson in place
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
source "$here/slicevars.sh"
slice_vars "$1"
DECK=4 HALL=7 HALL_NEAR=50 BAND=8 BAND_SHARE=0.6 MIN_M2=40 PIECE_M2=20 STAIR=2 NEAR=30 BASES="'Nollendorfplatz', 'Bülowstraße'"
gb=$(cd "$here/../.." && pwd)/map/1917/city
[[ -s $gb/hochbahn.geojson && -s $map/buildings.geojson && -s $map/denkmale.geojson ]] || { echo "stations: no drawn line, buildings or monuments here"; exit 0; }
sql=$own/stations.sql
rm -f "${own:?}/stations.add.geojson" "${own:?}/stations.hold.csv" "${own:?}/open.stations.geojson"
# the bases bands.sh keeps; the plan's pieces carry a monument number only where heights.ts gave one
hold_sql="SELECT b.id FROM b, stn s WHERE s.name IN ($BASES) AND ST_Intersects(s.geom, b.geom) AND coalesce(b.source, '') <> 'alkis-station'
  AND coalesce(b.storeys_from, '') <> 'station'"
grep -q '"denkmal"' "$map/buildings.geojson" && hold_sql="$hold_sql UNION SELECT b.id FROM b, line l WHERE b.denkmal::VARCHAR IN (SELECT monument FROM sm)
  AND b.storeys_from = 'denkmal' AND coalesce(b.source, '') <> 'alkis-station'
  AND ST_Area(ST_Intersection(ST_MakeValid(b.geom), ST_Buffer(l.g, $BAND))) < $BAND_SHARE * ST_Area(b.geom)"
{
  echo "LOAD spatial; SET geometry_always_xy = true;"
  echo "CREATE TABLE alkis (uuid VARCHAR, storeys INTEGER, use_today VARCHAR, geom GEOMETRY);"
  "$here/tiles.sh" "$1" | while read -r id _; do
    f=$cache/alkis/$id.json
    if [[ -s $f ]] && grep -q '"uuid"' "$f"; then echo "INSERT INTO alkis SELECT uuid, TRY_CAST(aog AS INTEGER), bezgfk, ST_MakeValid(geom) FROM ST_Read('$f') WHERE bezeich = 'AX_Gebaeude' AND coalesce(bezofl, '') <> 'Unter der Erdoberfläche';"; fi
  done
  cat <<SQL
CREATE TABLE frame AS SELECT ST_MakeEnvelope($X0, $Y0, $X1, $Y1) AS g;
CREATE TABLE line AS SELECT ST_Union_Agg(u.geom) AS g FROM ST_Read('$gb/hochbahn.geojson') u, frame f WHERE ST_DWithin(u.geom, f.g, 60);
CREATE TABLE stn AS SELECT u.name, u.geom FROM ST_Read('$gb/ubahn.geojson') u, line l
  WHERE u.feature = 'station' AND coalesce(nullif(u.opened::VARCHAR, ''), '0000') <= '1917-12' AND ST_DWithin(u.geom, l.g, 20);
CREATE TABLE sm AS SELECT d.id::VARCHAR AS monument, ST_MakeValid(d.geom) AS geom FROM ST_Read('$map/denkmale.geojson') d, line l
  WHERE regexp_matches(lower(coalesce(d.title, '')), '^(hoch- und )?(u-bahnhof|hochbahnhof)')
    AND starts_with(coalesce(d.stood_1917, ''), 'built by 1917')
    AND coalesce(list_max(list_transform(regexp_extract_all(coalesce(d.dated::VARCHAR, ''), '1[0-9]{3}'), x -> x::INTEGER)), 0) <= 1917
    AND ST_DWithin(d.geom, l.g, $NEAR);
CREATE TABLE b AS SELECT * FROM ST_Read('$map/buildings.geojson');
CREATE TABLE deck AS SELECT ST_Union(ST_Buffer(l.g, $DECK), coalesce(ST_Intersection(ST_Buffer(l.g, $HALL), (SELECT ST_Buffer(ST_Union_Agg(geom), $HALL_NEAR) FROM stn)), ST_GeomFromText('POLYGON EMPTY'))) AS g FROM line l;
CREATE TABLE cand AS SELECT DISTINCT ON (a.uuid) a.uuid, a.storeys, a.use_today, s.monument, a.geom FROM alkis a, sm s, line l, frame f
  WHERE a.use_today IN ('Bahnhofsgebäude', 'Gebäude zum U-Bahnhof', 'Betriebsgebäude für Schienenverkehr') AND ST_Area(a.geom) >= $MIN_M2
    AND ST_Within(ST_Centroid(a.geom), f.g) AND ST_Area(ST_Intersection(a.geom, s.geom)) >= 0.5 * ST_Area(a.geom)
    AND ST_Area(ST_Intersection(a.geom, ST_Buffer(l.g, $BAND))) < $BAND_SHARE * ST_Area(a.geom);
CREATE TABLE held AS SELECT ST_Union_Agg(ST_MakeValid(b.geom)) AS g FROM b, cand c WHERE ST_Intersects(b.geom, c.geom);
CREATE TABLE add AS SELECT * FROM (
  SELECT c.uuid, c.storeys, c.use_today, c.monument,
    UNNEST(ST_Dump(ST_Difference(ST_Difference(c.geom, k.g), coalesce(h.g, ST_GeomFromText('POLYGON EMPTY'))))).geom AS geom
  FROM cand c, deck k, held h) WHERE ST_Area(geom) >= $PIECE_M2;
COPY (SELECT uuid, storeys, use_today, monument, printf('%d_%d', round(ST_X(ST_Centroid(geom)) * 10)::BIGINT, round(ST_Y(ST_Centroid(geom)) * 10)::BIGINT) AS key,
    round(ST_Area(geom), 1) AS area_m2, ST_SetCRS(geom, 'EPSG:25833') AS geom FROM add)
  TO '$own/stations.add.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY ($hold_sql) TO '$own/stations.hold.csv' (HEADER false);
CREATE TABLE add_u AS SELECT ST_Union_Agg(geom) AS g FROM add;
COPY (SELECT COLUMNS(c -> c <> 'OGC_FID') FROM (
    SELECT o.* EXCLUDE (geom), UNNEST(ST_Dump(CASE WHEN u.g IS NOT NULL AND ST_Intersects(o.geom, u.g) THEN ST_Difference(ST_MakeValid(o.geom), u.g) ELSE o.geom END)).geom AS geom
    FROM ST_Read('$map/open.geojson') o, add_u u) WHERE NOT ST_IsEmpty(geom))
  TO '$own/open.stations.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
SELECT 'stations: ' || (SELECT count(*) FROM add) || ' station buildings beside the deck (' || (SELECT coalesce(round(sum(ST_Area(geom))), 0) FROM add)
  || ' m2, from ' || (SELECT count(DISTINCT monument) FROM add) || ' monuments) and ' || (SELECT count(*) FROM ($hold_sql)) || ' stair houses and bases held to $STAIR storeys';
SQL
} > "$sql"
duckdb -bail -noheader -list < "$sql"
# the buildings file in its own style (GDAL's dense or bun's sparse): holds applied, the new buildings appended with the
# next ids; a key already there is not added again
bun -e '
  const [f, add, hold, stair] = process.argv.slice(1);
  const fc = await Bun.file(f).json(), ids = new Set((await Bun.file(hold).text()).split("\n").filter(Boolean).map(Number));
  const adds = (await Bun.file(add).exists()) ? (await Bun.file(add).json()).features : [];
  const keys = new Set(fc.features.map((x) => x.properties.key));
  let id = Math.max(0, ...fc.features.map((x) => x.properties.id)), changed = 0;
  for (const x of fc.features) {
    const p = x.properties;
    if (!ids.has(p.id) || p.storeys_from === "station") continue;
    (p.storeys_was = { storeys: p.storeys, storeys_from: p.storeys_from }), (p.storeys = +stair), (p.storeys_from = "station"), changed++;
  }
  for (const a of adds) {
    const q = a.properties;
    if (keys.has(q.key)) continue;
    const storeys = q.storeys >= 1 && q.storeys <= 9 ? q.storeys : +stair;
    fc.features.push({ type: "Feature", properties: { id: ++id, key: q.key, kind: "public", source: "alkis-station", storeys,
      storeys_from: q.storeys >= 1 && q.storeys <= 9 ? "alkis" : "station", area_m2: q.area_m2, use_today: q.use_today, monument: q.monument }, geometry: a.geometry });
    changed++;
  }
  if (!changed) process.exit(0);
  const { features, ...head } = fc;
  await Bun.write(f, JSON.stringify(head).slice(0, -1) + ",\"features\": [\n" + features.map((x) => JSON.stringify(x)).join(",\n") + "\n]\n}\n");
' "$map/buildings.geojson" "$own/stations.add.geojson" "$own/stations.hold.csv" "$STAIR"
[[ $(jq '.features | length' "$own/stations.add.geojson" 2>/dev/null || echo 0) -gt 0 ]] && mv "$own/open.stations.geojson" "$map/open.geojson"
exit 0
