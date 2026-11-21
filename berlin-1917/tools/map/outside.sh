#!/usr/bin/env bash
# The towns and outskirts the plan leaves blank (open ground "vacant" or "beyond": build.sh, beyond.sh), built as they
# stood in 1917 from two Umweltatlas maps (Geoportal Berlin, dl-de/zero-2.0; cache/berlin/umweltatlas, fetched 11-17)
# and today's survey (ALKIS):
#   a block of the city-structure map (Stadtstruktur 2024: its blocks, ISU5) stood in 1917 when its type is one of the
#   Gründerzeit block types (1, 2, 3, each "1870er - 1918"), or when the building-age map (Gebäudealter der Wohngebäude
#   2016) counts at least half its houses built by 1917: those before 1911 and 0.7 of those of 1911-1920 (ASSUMED:
#   building boomed to 1914 and all but stopped in the war);
#   and only a block lying at least half on blank ground, so nothing the plan draws is replaced;
#   its buildings are today's (ALKIS AX_Gebaeude above ground, middle in the block, 15 m2 and more, no garages or car
#   parks): ASSUMED to stand where 1917's did, and post-war infill in such a block comes in with them. They join
#   buildings.geojson as source "alkis-outside" with today's storeys; public for schools, churches, hospitals, offices
#   of state, stations and the like (ALKIS's function), else private;
#   the blank ground inside such a block is courtyard, blank ground within 30 m of one is street (the blocks are bounded
#   by their streets); the rest keeps its kind. Pieces made here carry source "outside", so a run again starts over.
# Blank ground is also everything off the plan: the slice's undrawn tiles (cache drawn-tiles.txt, build.sh) and the plan's
# insets (plan-insets.tsv), so a block cut by the plan's edge is filled whole and the towns beyond the 1910 boundary come
# in. There, the Stadtstruktur's water blocks (type 100) are water (source "umweltatlas-today": today's rivers and
# canals, ASSUMED as in 1917), and what no block or street takes is open ground ("vacant", source "undrawn"): ASSUMED
# fields, since parks, rail and works beyond the plan are not drawn.
# The building-age map covers housing only, so a factory, a barracks or a gasworks beyond the plan stays blank unless its
# block is of a Gründerzeit type, or a listed monument stands there: on blank ground, today's footprint also stands
# for 1917's where half or more of it lies inside a listed monument (denkmale.geojson, denkmale.ts) that stood by 1917,
# every phase its entry dates 1917 or before and its outline MON_MAX m2 at most (a railway's or a park's whole ground
# would bring in what was built on it later; build.sh's list of monuments that are not buildings is left out too: a
# bridge, a station, a statue). Those carry the monument's id. Sourced, whatever the building's use. The monuments of
# 1910-1917 the plan lacks come in on any ground in build.sh (alkis-newer); this route is for blank ground only.
#   outside.sh SLICE.json   rewrites map/1917/{buildings,open,water}.geojson in place
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
source "$here/slicevars.sh"
slice_vars "$1"
ua=$(cd "$here/../.." && pwd)/cache/berlin/umweltatlas
for f in "$ua/stadtstruktur.json" "$ua/gebaeudealter.json"; do
  [[ -s $f ]] || { echo "outside: no $f" >&2; exit 0; }
done
# a sheet whose plan draws nothing (build.sh stops at an empty trace) starts from empty layers, so the towns beyond the
# plan still come in and the later steps have their files
mkdir -p "$map"
for layer in buildings open water green rail; do
  [[ -s $map/$layer.geojson ]] || printf '{"type":"FeatureCollection","name":"%s","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::25833"}},"features":[]}\n' "$layer" > "$map/$layer.geojson"
done
if [[ $(jq '.features | length' "$map/open.geojson") -gt 0 ]]; then
  open0_sql="CREATE TABLE open0 AS SELECT * FROM ST_Read('$map/open.geojson');"
else
  open0_sql="CREATE TABLE open0 (kind VARCHAR, source VARCHAR, geom GEOMETRY);"
fi
sql=$own/outside.sql
# the undrawn tiles, as envelopes (a tile build.sh never listed counts as undrawn)
undrawn_rows=$("$here/tiles.sh" "$1" | while read -r id x0 y0 x1 y1; do
  if ! grep -qx "$id 1" "$cache/drawn-tiles.txt" 2>/dev/null; then echo "INSERT INTO env VALUES (ST_MakeEnvelope($x0, $y0, $x1, $y1));"; fi
done)
if [[ $(jq '.features | length' "$map/water.geojson" 2>/dev/null || echo 0) -gt 0 ]]; then
  old_w_sql="CREATE TABLE old_w AS SELECT source, geom FROM ST_Read('$map/water.geojson') WHERE coalesce(source, '') <> 'umweltatlas-today';"
else
  old_w_sql="CREATE TABLE old_w (source VARCHAR, geom GEOMETRY);"
fi
# a sheet whose plan draws no building has a buildings.geojson with no columns to read
if [[ $(jq '.features | length' "$map/buildings.geojson") -gt 0 ]]; then
  old_b_sql="CREATE TABLE old_b AS SELECT * FROM ST_Read('$map/buildings.geojson') WHERE coalesce(source, '') <> 'alkis-outside';"
  prev_b_sql="CREATE TABLE prev_b AS SELECT geom FROM ST_Read('$map/buildings.geojson') WHERE source = 'alkis-outside';"
else
  old_b_sql="CREATE TABLE old_b (id INTEGER, key VARCHAR, kind VARCHAR, source VARCHAR, storeys INTEGER, storeys_from VARCHAR, area_m2 DOUBLE, geom GEOMETRY);"
  prev_b_sql="CREATE TABLE prev_b (geom GEOMETRY);"
fi
MON_MAX=60000
if [[ -s $map/denkmale.geojson ]] && [[ $(jq '.features | length' "$map/denkmale.geojson") -gt 0 ]]; then
  dm_sql="CREATE TABLE dm AS SELECT id::VARCHAR AS monument, ST_MakeValid(geom) AS geom FROM ST_Read('$map/denkmale.geojson')
WHERE starts_with(coalesce(stood_1917, ''), 'built by 1917') AND ST_Area(geom) <= $MON_MAX
  AND NOT regexp_matches(lower(coalesce(title, '')), 'brücke|bahnhof|u-bhf|tunnel|standbild|denkmal|brunnen|grenzanlage|büste|allegorie|kanal|hafen|statue|skulptur|plastik|gedenk')
  AND coalesce(list_max(list_transform(regexp_extract_all(coalesce(dated::VARCHAR, ''), '1[0-9]{3}'), x -> x::INTEGER)), 0) <= 1917;"
else
  dm_sql="CREATE TABLE dm (monument VARCHAR, geom GEOMETRY);"
fi
{
  echo "LOAD spatial; SET geometry_always_xy = true;"
  echo "CREATE TABLE alkis (uuid VARCHAR, storeys INTEGER, use_today VARCHAR, geom GEOMETRY);"
  "$here/tiles.sh" "$1" | while read -r id _; do
    f=$cache/alkis/$id.json
    if [[ -s $f ]] && grep -q '"uuid"' "$f"; then echo "INSERT INTO alkis SELECT uuid, TRY_CAST(aog AS INTEGER), bezgfk, ST_MakeValid(geom) FROM ST_Read('$f') WHERE bezeich = 'AX_Gebaeude' AND coalesce(bezofl, '') <> 'Unter der Erdoberfläche';"; fi
  done
  cat <<SQL
CREATE TABLE frame AS SELECT ST_MakeEnvelope($X0, $Y0, $X1, $Y1) AS g;
CREATE TABLE age AS SELECT schluessel,
  coalesce(TRY_CAST(x_bis_1900 AS DOUBLE), 0) + coalesce(TRY_CAST(x1901_1910 AS DOUBLE), 0) + 0.7 * coalesce(TRY_CAST(x1911_1920 AS DOUBLE), 0) AS pre,
  coalesce(TRY_CAST(x_bis_1900 AS DOUBLE), 0) + coalesce(TRY_CAST(x1901_1910 AS DOUBLE), 0) + coalesce(TRY_CAST(x1911_1920 AS DOUBLE), 0) + coalesce(TRY_CAST(x1921_1930 AS DOUBLE), 0) + coalesce(TRY_CAST(x1931_1940 AS DOUBLE), 0)
  + coalesce(TRY_CAST(x1941_1950 AS DOUBLE), 0) + coalesce(TRY_CAST(x1951_1960 AS DOUBLE), 0) + coalesce(TRY_CAST(x1961_1970 AS DOUBLE), 0) + coalesce(TRY_CAST(x1971_1980 AS DOUBLE), 0) + coalesce(TRY_CAST(x1981_1990 AS DOUBLE), 0)
  + coalesce(TRY_CAST(x1991_2000 AS DOUBLE), 0) + coalesce(TRY_CAST(x2001_2010 AS DOUBLE), 0) + coalesce(TRY_CAST(x2011_2015 AS DOUBLE), 0) AS n
FROM ST_Read('$ua/gebaeudealter.json');
$open0_sql
-- off the plan: the undrawn tiles and the insets, in the slice; today's water there, and the land
CREATE TABLE env (e GEOMETRY);
$undrawn_rows
INSERT INTO env SELECT ST_MakeEnvelope(x0, y0, x1, y1) FROM read_csv('$here/plan-insets.tsv', delim='\t', header=true, comment='#');
CREATE TABLE undrawn AS SELECT ST_Intersection((SELECT ST_Union_Agg(e) FROM env), f.g) AS g FROM frame f;
CREATE TABLE wat AS SELECT ST_Intersection(ST_Union_Agg(ST_MakeValid(s.geom)), any_value(u.g)) AS g
FROM ST_Read('$ua/stadtstruktur.json') s, undrawn u WHERE s.typ = '100' AND u.g IS NOT NULL AND ST_Intersects(s.geom, u.g);
CREATE TABLE land AS SELECT CASE WHEN w.g IS NULL THEN u.g ELSE ST_Difference(u.g, w.g) END AS g FROM undrawn u, wat w;
$old_w_sql
SQL
  # an older open.geojson has no source column: add it, NULL (the plan's own pieces)
  if [[ $open0_sql == *ST_Read* ]] && ! duckdb -noheader -list -c "LOAD spatial; SELECT count(*) FROM (DESCRIBE SELECT * FROM ST_Read('$map/open.geojson')) WHERE column_name = 'source'" | grep -qx 1; then
    echo "ALTER TABLE open0 ADD COLUMN source VARCHAR;"
  fi
  cat <<SQL
-- blank ground: the plan's vacant and beyond; an earlier run's pieces and the footprints of its buildings (as vacant:
-- their first kind is not kept), less what is off the plan; and the land off the plan
$prev_b_sql
CREATE TABLE blank AS SELECT kind AS was, geom FROM open0 WHERE kind IN ('vacant', 'beyond') AND source IS NULL;
INSERT INTO blank SELECT 'vacant', CASE WHEN u.g IS NULL THEN o.geom ELSE ST_Difference(o.geom, u.g) END FROM open0 o, undrawn u WHERE o.source = 'outside';
INSERT INTO blank SELECT 'vacant', CASE WHEN u.g IS NULL THEN p.geom ELSE ST_Difference(p.geom, u.g) END FROM prev_b p, undrawn u;
INSERT INTO blank SELECT 'undrawn', g FROM land WHERE g IS NOT NULL AND NOT ST_IsEmpty(g);
-- (bands.sh's street, source "band", stays: the buildings it replaced are gone for good)
DELETE FROM open0 WHERE (source IS NOT NULL AND source <> 'band') OR kind IN ('vacant', 'beyond');
CREATE TABLE blank_u AS SELECT ST_Union_Agg(geom) AS g FROM blank;
CREATE TABLE blk AS SELECT s.schluessel, s.typ, ST_MakeValid(s.geom) AS geom, a.pre, a.n
FROM ST_Read('$ua/stadtstruktur.json') s LEFT JOIN age a USING (schluessel), frame f WHERE ST_Intersects(s.geom, f.g);
CREATE TABLE b1917 AS SELECT b.schluessel, b.typ, b.pre, b.n, b.geom FROM blk b, blank_u k
WHERE k.g IS NOT NULL AND (b.typ IN ('1', '2', '3') OR (b.n > 0 AND b.pre / b.n >= 0.5))
  AND ST_Area(ST_Intersection(b.geom, k.g)) >= 0.5 * ST_Area(b.geom);
-- one row always (NULL when no block qualifies), so the cross joins below keep the blank ground
CREATE TABLE blk_u AS SELECT ST_Intersection((SELECT ST_Union_Agg(geom) FROM b1917), f.g) AS g FROM frame f;
$old_b_sql
-- the buildings: today's, middle in a 1917 block and in this slice, each once (a tile edge repeats one), none on a
-- building the plan draws (a third or more of it under one)
CREATE TABLE out_b0 AS SELECT DISTINCT ON (a.uuid) a.uuid, a.storeys, a.use_today, a.geom, NULL::VARCHAR AS monument FROM alkis a, b1917 b, frame f
WHERE ST_Contains(b.geom, ST_Centroid(a.geom)) AND ST_Contains(f.g, ST_Centroid(a.geom)) AND ST_Area(a.geom) >= 15
  AND NOT regexp_matches(coalesce(a.use_today, ''), 'Garage|Parkhaus|Carport|Tiefgarage|Überdachung|Schuppen|Gartenhaus|Laube');
-- the second route: on blank ground, inside a listed monument that stood by 1917 (half or more of the footprint in each)
$dm_sql
INSERT INTO out_b0 SELECT DISTINCT ON (a.uuid) a.uuid, a.storeys, a.use_today, a.geom, d.monument FROM alkis a, dm d, frame f, blank_u k
WHERE k.g IS NOT NULL AND ST_Intersects(d.geom, a.geom) AND ST_Contains(f.g, ST_Centroid(a.geom)) AND ST_Area(a.geom) >= 15
  AND ST_Area(ST_Intersection(d.geom, a.geom)) >= 0.5 * ST_Area(a.geom) AND ST_Area(ST_Intersection(k.g, a.geom)) >= 0.5 * ST_Area(a.geom)
  AND NOT regexp_matches(coalesce(a.use_today, ''), 'Garage|Parkhaus|Carport|Tiefgarage|Überdachung|Schuppen|Gartenhaus|Laube')
  AND a.uuid NOT IN (SELECT uuid FROM out_b0);
CREATE TABLE out_b AS SELECT * FROM out_b0 a WHERE a.uuid NOT IN (
  SELECT a.uuid FROM out_b0 a JOIN old_b o ON ST_Intersects(o.geom, a.geom)
  GROUP BY a.uuid, a.geom HAVING sum(ST_Area(ST_Intersection(o.geom, a.geom))) >= ST_Area(a.geom) / 3);
CREATE TABLE new_b AS SELECT
  (SELECT coalesce(max(id), 0) FROM old_b) + row_number() OVER (ORDER BY uuid) AS id,
  printf('%d_%d', round(ST_X(ST_Centroid(geom)) * 10)::BIGINT, round(ST_Y(ST_Centroid(geom)) * 10)::BIGINT) AS key,
  CASE WHEN regexp_matches(coalesce(use_today, ''), 'Schule|Kirche|Kapelle|Krankenhaus|Verwaltung|Rathaus|Gericht|Polizei|Post|Museum|Theater|Bahnhof|Kaserne|Feuerwehr|Hochschule|Bibliothek|Badeanstalt|Hallenbad')
       THEN 'public' ELSE 'private' END AS kind,
  'alkis-outside' AS source, storeys, CASE WHEN storeys BETWEEN 1 AND 9 THEN 'alkis' ELSE 'rule' END AS storeys_from,
  round(ST_Area(geom), 1) AS area_m2, use_today, monument, ST_SetCRS(geom, 'EPSG:25833') AS geom
FROM out_b;
COPY (SELECT COLUMNS(c -> c <> 'OGC_FID') FROM (SELECT * FROM old_b UNION ALL BY NAME SELECT * FROM new_b)) TO '$own/buildings.outside.geojson'
  WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
-- the ground: inside a 1917 block courtyard, within 30 m of one street, else as it was
CREATE TABLE nb_u AS SELECT ST_Union_Agg(geom) AS g FROM new_b;
CREATE TABLE near_u AS SELECT ST_Buffer(g, 30, 2) AS g FROM blk_u;
CREATE TABLE cut AS
  SELECT 'courtyard' AS kind, 'outside' AS source, UNNEST(ST_Dump(CASE WHEN n.g IS NULL THEN ST_Intersection(k.g, u.g) ELSE ST_Difference(ST_Intersection(k.g, u.g), n.g) END)).geom AS geom
    FROM blank_u k, blk_u u, nb_u n WHERE u.g IS NOT NULL
  UNION ALL SELECT 'street', 'outside', UNNEST(ST_Dump(ST_Difference(ST_Intersection(k.g, r.g), u.g))).geom
    FROM blank_u k, blk_u u, near_u r WHERE u.g IS NOT NULL
  UNION ALL SELECT CASE WHEN b.was = 'undrawn' THEN 'vacant' ELSE b.was END, CASE WHEN b.was = 'undrawn' THEN 'undrawn' END,
    UNNEST(ST_Dump(CASE WHEN r.g IS NULL THEN b.geom ELSE ST_Difference(b.geom, ST_Union(r.g, u.g)) END)).geom
    FROM blank b, blk_u u, near_u r;
CREATE TABLE open1 AS SELECT kind, CASE WHEN source = 'band' THEN 'band' END AS source, geom FROM open0
  UNION ALL SELECT kind, source, geom FROM cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 1;
COPY (SELECT kind, source, round(ST_Area(geom), 1) AS area_m2, geom FROM open1) TO '$own/open.outside.geojson'
  WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
CREATE TABLE water1 AS SELECT source, ST_SetCRS(geom::GEOMETRY, 'EPSG:25833') AS geom FROM old_w
  UNION ALL SELECT 'umweltatlas-today', ST_SetCRS(geom, 'EPSG:25833') FROM (SELECT UNNEST(ST_Dump(g)).geom AS geom FROM wat WHERE g IS NOT NULL)
  WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 1;
COPY (SELECT source, round(ST_Area(geom), 1) AS area_m2, geom FROM water1) TO '$own/water.outside.geojson'
  WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
SELECT 'outside: ' || (SELECT count(*) FROM b1917) || ' blocks of 1917, ' || (SELECT count(*) FROM new_b) || ' buildings (' || (SELECT count(*) FROM new_b WHERE monument IS NOT NULL) || ' in monuments; '
  || (SELECT round(coalesce(sum(area_m2), 0) / 1e6, 2) FROM new_b) || ' km2); ground '
  || (SELECT string_agg(kind || ' ' || round(a / 1e6, 2), ', ') FROM (SELECT kind, sum(ST_Area(geom)) a FROM open1 WHERE kind IN ('courtyard', 'street', 'vacant', 'beyond') AND (source = 'outside' OR kind IN ('vacant', 'beyond')) GROUP BY 1 ORDER BY 1)) || ' km2; off the plan '
  || (SELECT round(coalesce(ST_Area(g), 0) / 1e6, 2) FROM undrawn) || ' km2, water there '
  || (SELECT round(coalesce(ST_Area(g), 0) / 1e6, 2) FROM wat) || ' km2' AS outside;
SQL
} > "$sql"
duckdb -bail -noheader -list < "$sql"
mv "$own/buildings.outside.geojson" "$map/buildings.geojson"
mv "$own/open.outside.geojson" "$map/open.geojson"
mv "$own/water.outside.geojson" "$map/water.geojson"
