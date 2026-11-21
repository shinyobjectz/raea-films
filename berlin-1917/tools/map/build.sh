#!/bin/bash
# Assembles the 1917 map layers for a slice from what the other tools left in cache/<slice>/:
#   - inside the coverage of "Berlin um 1900" (vectors of 1899-1913), its polygons as they are;
#   - outside it, the Straube reader's traced polygons (traced.parquet), if trace.sh has run;
#   - open ground (all that is not built, water, green or rail) split into streets, courtyards and vacant land;
#   - names from the 1900 labels and from OpenHistoricalMap features dated to 1917 (CC0 ones only);
#   - storeys: 5 for private buildings (the 22 m eaves rule), 4 for public ones, unless a footprint of today
#     matches a building almost exactly (IoU >= 0.8), which marks it as a likely survivor with its storeys.
# Writes map/1917/{buildings,open,water,green,rail,trams,labels,boreholes}.geojson (EPSG:25833); then use1910.ts adds
# each building's use in 1910 to buildings.geojson.
# usage: build.sh [SLICE.json]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
source "$here/slicevars.sh"
slice_vars "$slice"
# "Berlin um 1900" covers only Alt-Berlin; a city sheet points at the copy fetched for friedrichstadt (.berlin1900).
b1900=$(jq -r ".berlin1900 // empty" "$slice")
b1900=${b1900:+$here/$b1900}
b1900=${b1900:-$cache/berlin1900}
# The frame: the slice's tiles the plan draws. Beyond the 1910 city boundary the WMS returns plain white, and open
# ground there is neither street nor yard (a city sheet at the plan's edge had 10 km2 of "courtyard"). Measured once
# per tile cache: a tile is drawn when its scan isn't one flat colour and the reader found something on it (its
# prediction isn't flat: 24 tiles of plan margin, paper and a border line, read as nothing and had become one 500 m
# "street"). A tile the boundary crosses still counts whole.
drawn=$cache/drawn-tiles.txt
touch "$drawn"
frame_rows=""
while read -r id x0 y0 x1 y1; do
  png=$cache/rasters/straube/$id.png
  [[ -s $png ]] || continue
  if ! grep -q "^$id " "$drawn"; then
    sd=$(magick "$png" -format "%[fx:standard_deviation]" info:)
    pred=$cache/pred/$id.png flat=1
    [[ -s $pred ]] && flat=$(magick "$pred" -format "%[fx:maxima == minima ? 1 : 0]" info:)
    echo "$id $(awk -v s="$sd" -v f="$flat" "BEGIN { print (s > 0.001 && f == 0) ? 1 : 0 }")" >> "$drawn"
  fi
  grep -q "^$id 1$" "$drawn" && frame_rows+="${frame_rows:+, }($x0, $y0, $x1, $y1)"
done < <("$here/tiles.sh" "$slice")
if [[ -z $frame_rows ]]; then echo "build: no tile of this slice is drawn on the plan" >&2; exit 0; fi
traced=$own/traced.parquet
[[ -s $traced ]] || traced=""
# a sheet whose drawn tiles are only the plan's margin (paper, the border line) traces nothing: there is nothing to build
if [[ -n $traced ]] && [[ $(duckdb -noheader -list -c "SELECT count(*) FROM '$traced'") == 0 ]]; then
  echo "build: the trace found nothing on this slice's drawn tiles (plan margin only)" >&2; exit 0
fi
sql=$own/build.sql

cat > "$sql" <<SQL
LOAD spatial;
SET geometry_always_xy = true;
CREATE TABLE frame AS SELECT ST_Union_Agg(ST_MakeEnvelope(x0, y0, x1, y1)) AS geom FROM (VALUES $frame_rows) t(x0, y0, x1, y1);
-- less the plan's insets (plan-insets.tsv: pieces of another sheet boxed away from their place)
UPDATE frame SET geom = COALESCE(ST_Difference(geom, (SELECT ST_Union_Agg(ST_MakeEnvelope(x0, y0, x1, y1)) FROM read_csv('$here/plan-insets.tsv', delim = '\t', header = true, comment = '#'))), geom);
CREATE TABLE cov AS SELECT ST_Union_Agg(geom) AS geom FROM ST_Read('$b1900/coverage.json');

-- Berlin um 1900, clipped to the slice.
CREATE TABLE a1900 AS
SELECT CASE klassenname
         WHEN 'Straßen und Plätze' THEN 'open' WHEN 'gewerbliche und private Gebäude, Wohnbebauung' THEN 'building'
         WHEN 'öffentliche Gebäude' THEN 'public' WHEN 'Gewässer' THEN 'water' WHEN 'Grünanlagen' THEN 'green'
         WHEN 'Bahnanlagen' THEN 'rail' END AS class,
       ST_Intersection(ST_MakeValid(s.geom), f.geom) AS geom
FROM ST_Read('$b1900/b_berlin1900_flaechen.json') s, frame f
WHERE ST_Intersects(s.geom, f.geom);

-- Traced polygons outside that coverage (none until the reader has run).
CREATE TABLE traced (class VARCHAR, geom GEOMETRY);
SQL
if [[ -n $traced ]]; then
  cat >> "$sql" <<SQL
INSERT INTO traced
SELECT t.class, ST_Intersection(ST_Difference(ST_MakeValid(t.geom), c.geom), f.geom)
FROM (SELECT class, ST_SetCRS(geom, 'EPSG:25833') AS geom FROM '$traced') t, cov c, frame f
WHERE ST_Intersects(t.geom, f.geom) AND NOT ST_Within(t.geom, c.geom);
SQL
fi
cat >> "$sql" <<SQL
CREATE TABLE areas AS
SELECT class, UNNEST(ST_Dump(geom)).geom AS geom, 'berlin1900' AS source FROM a1900 WHERE class <> 'open'
UNION ALL
SELECT class, UNNEST(ST_Dump(geom)).geom, 'straube-reader' FROM traced WHERE class <> 'roadway';
DELETE FROM areas WHERE ST_GeometryType(geom) NOT IN ('POLYGON', 'MULTIPOLYGON') OR ST_Area(geom) < 1;
-- The reader calls garden paths building (the plan draws both tan). Dropped from its buildings: pieces narrower
-- than about 2 m (area over perimeter under 1 m; 1,883 of 10,522 on 11-16, 21 m2 on average), and pieces under
-- 400 m2 at least half ringed by park within 3 m (99).
DELETE FROM areas WHERE source = 'straube-reader' AND class IN ('building', 'public') AND ST_Area(geom) / ST_Perimeter(geom) < 1.0;
-- The plan's blue U-Bahn band and the lettering along streets leave thin scraps of every class in the roadway, and
-- each scrap would cut a hole in the street (with a ring of sidewalk round it in the 3D). From the reader, also
-- dropped: anything under 15 m2, park pieces narrower than about 2 m, and water under 3,000 m2 narrower than about
-- 5 m (no river or basin of the inner city is either).
DELETE FROM areas WHERE source = 'straube-reader' AND ST_Area(geom) < 15;
DELETE FROM areas WHERE source = 'straube-reader' AND class = 'green' AND ST_Area(geom) / ST_Perimeter(geom) < 1.0;
DELETE FROM areas WHERE source = 'straube-reader' AND class = 'water' AND ST_Area(geom) < 3000 AND ST_Area(geom) / ST_Perimeter(geom) < 2.5;
-- Railway land from the reader comes as the yards (gated by the plan's lilac, gate.ts: ten pieces over 5,000 m2) and
-- as specks in courtyards where it misreads pale paper (257 pieces under 500 m2, 31,000 m2 on 11-17). A reader rail
-- piece under 500 m2 that doesn't touch a yard is dropped and becomes open ground.
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a
  WHERE a.source = 'straube-reader' AND a.class = 'rail' AND ST_Area(a.geom) < 500
    AND NOT EXISTS (SELECT 1 FROM areas b WHERE b.class = 'rail' AND ST_Area(b.geom) >= 5000 AND ST_DWithin(a.geom, b.geom, 2)));
SQL
# The plan draws the U-Bahn tunnel as a band of dashes along its path, which the reader takes for thin buildings (the
# strip under the Leipziger Platz garden). A reader building at least 60% within 5 m of a traced tunnel or ramp
# (city/ubahn.geojson, tunnels.ts) and under 2 m thick (area over perimeter) is the band: dropped, it becomes open
# ground. 12 pieces, 17-165 m2, on 11-17; houses over the tunnel are wide and stay.
ubahn=$here/../../map/1917/city/ubahn.geojson
if [[ -s $ubahn ]]; then
  cat >> "$sql" <<SQL
CREATE TABLE tunnel AS SELECT ST_Union_Agg(ST_Buffer(geom, 5)) AS geom FROM ST_Read('$ubahn') WHERE feature = 'stretch' AND kind IN ('tunnel', 'ramp');
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, tunnel t
  WHERE a.source = 'straube-reader' AND a.class IN ('building', 'public') AND ST_Area(a.geom) / ST_Perimeter(a.geom) < 2.0
    AND ST_Intersects(a.geom, t.geom) AND ST_Area(ST_Intersection(a.geom, t.geom)) >= 0.6 * ST_Area(a.geom));
SQL
fi
# read_json cannot build geometry; ST_Read each ALKIS tile instead. (Here, before open ground: the buildings put up after
# the plan's survey take today's footprints.)
{
  echo "CREATE TABLE alkis (uuid VARCHAR, storeys INTEGER, use_today VARCHAR, geom GEOMETRY);"
  "$here/tiles.sh" "$slice" | while read -r id _; do
    f=$cache/alkis/$id.json
    # A tile with no buildings has no columns to read. Only buildings above ground (AX_Gebaeude): a tile also holds their
    # parts (AX_Bauteil: a projecting or set-back storey, no storey count) and cellars and garages under the ground,
    # which lie inside a building and would come in as buildings of their own or hide its storeys.
    if [[ -s $f ]] && grep -q '"uuid"' "$f"; then echo "INSERT INTO alkis SELECT uuid, TRY_CAST(aog AS INTEGER), bezgfk, ST_MakeValid(geom) FROM ST_Read('$f') WHERE bezeich = 'AX_Gebaeude' AND coalesce(bezofl, '') <> 'Unter der Erdoberfläche' AND uuid NOT IN (SELECT uuid FROM alkis);"; fi
  done
} >> "$sql"
# Buildings put up between the plan's survey and 1917. The plan (1910) lacks them; a listed monument dated 1910-1917
# that stood in 1917 has them, and as it is listed it stands as built, so today's footprints (ALKIS) at least half
# inside its outline are its 1917 footprints (source "alkis-newer"; public for courts, ministries, offices, clinics,
# schools, institutes, churches, synagogues, museums). Older monuments the plan or the reader misses are listed by hand
# (newer-add.tsv); newer-skip.tsv leaves some out (the Pergamonmuseum, a building site). Monuments that are not
# buildings (bridges, stations, statues, canals) are left out by name. Where a monument has such footprints, the
# plan's building pieces at least half inside its outline (the empty plot, or the houses it replaced) are dropped, and
# every other piece is cut back from the footprints, never from the outline (a bridge's outline lies over water). A cut
# piece loses any part under 2 m across (opened by 1 m, square corners): where the plan draws a house line a metre or
# two off today's, the cut leaves a strip of the old house standing in front of the new one.
# Clipped to the slice. denkmale.geojson is read for outlines and dates only, which don't depend on the buildings.
den=$map/denkmale.geojson
if [[ -s $den ]]; then
  cat >> "$sql" <<SQL
CREATE TABLE newer AS SELECT d.id, d.title, ST_MakeValid(d.geom) AS geom FROM ST_Read('$den') d, frame f
WHERE ST_Within(ST_Centroid(d.geom), f.geom) AND starts_with(d.stood_1917, 'built by')
  AND (TRY_CAST(d.built AS INTEGER) BETWEEN 1910 AND 1917
       OR d.id IN (SELECT id FROM read_csv('$here/newer-add.tsv', delim = '\t', header = true, comment = '#', all_varchar = true)))
  AND NOT regexp_matches(lower(d.title), 'brücke|bahnhof|u-bhf|tunnel|standbild|denkmal|brunnen|grenzanlage|büste|allegorie|kanal|hafen|statue|skulptur|plastik|gedenk')
  AND d.id NOT IN (SELECT id FROM read_csv('$here/newer-skip.tsv', delim = '\t', header = true, comment = '#', all_varchar = true));
CREATE TABLE newer_b AS SELECT a.uuid, arg_max(n.id, ST_Area(ST_Intersection(n.geom, a.geom))) AS id,
  arg_max(n.title, ST_Area(ST_Intersection(n.geom, a.geom))) AS title, ST_Intersection(any_value(a.geom), any_value(f.geom)) AS geom
FROM newer n JOIN alkis a ON ST_Intersects(n.geom, a.geom), frame f
WHERE ST_Area(ST_Intersection(n.geom, a.geom)) >= 0.5 * ST_Area(a.geom) GROUP BY a.uuid;
CREATE TABLE newer_u AS SELECT ST_Union_Agg(geom) AS g FROM newer_b;
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, newer n WHERE a.class IN ('building', 'public') AND n.id IN (SELECT id FROM newer_b) AND ST_Intersects(a.geom, n.geom)
  GROUP BY a.rowid, a.geom HAVING sum(ST_Area(ST_Intersection(a.geom, n.geom))) >= 0.5 * ST_Area(a.geom));
-- (the opening made valid first: a double buffer can come back self-crossing, s-3929-58173's piece at 395081 5817635)
CREATE TABLE newer_cut AS SELECT class, UNNEST(ST_Dump(ST_Intersection(d,
  ST_MakeValid(ST_Buffer(ST_Buffer(d, -1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5), 1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5))))).geom AS geom, source
FROM (SELECT a.class, a.source, ST_Difference(a.geom, u.g) AS d FROM areas a, newer_u u WHERE ST_Intersects(a.geom, u.g));
DELETE FROM areas WHERE rowid IN (SELECT a.rowid FROM areas a, newer_u u WHERE ST_Intersects(a.geom, u.g));
INSERT INTO areas SELECT class, geom, source FROM newer_cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 15;
-- Boxes checked by eye (newer-cuts.tsv): a plan house left standing in front of a new building's face is cut back.
CREATE TABLE cutbox AS SELECT ST_Union_Agg(ST_MakeEnvelope(x0, y0, x1, y1)) AS g FROM read_csv('$here/newer-cuts.tsv', delim = '\\t', header = true, comment = '#');
CREATE TABLE cut_by_eye AS SELECT a.class, UNNEST(ST_Dump(ST_Difference(a.geom, c.g))).geom AS geom, a.source
FROM areas a, cutbox c WHERE a.class IN ('building', 'public') AND ST_Intersects(a.geom, c.g);
DELETE FROM areas WHERE rowid IN (SELECT a.rowid FROM areas a, cutbox c WHERE a.class IN ('building', 'public') AND ST_Intersects(a.geom, c.g));
INSERT INTO areas SELECT class, geom, source FROM cut_by_eye WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 15;
INSERT INTO areas SELECT CASE WHEN regexp_matches(lower(title), 'gericht|ministerium|amt\\b|klinik|schule|institut|kirche|synagoge|museum|akademie|polizei|station') THEN 'public' ELSE 'building' END,
  UNNEST(ST_Dump(geom)).geom, 'alkis-newer' FROM newer_b WHERE ST_Area(geom) >= 1;
SQL
fi
cat >> "$sql" <<SQL
CREATE TABLE green_all AS SELECT ST_Union_Agg(geom) AS geom FROM areas WHERE class = 'green';
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, green_all g
  WHERE a.source = 'straube-reader' AND a.class IN ('building', 'public') AND ST_Area(a.geom) < 400
    AND ST_Area(ST_Intersection(ST_Difference(ST_Buffer(a.geom, 3), a.geom), g.geom)) >= 0.5 * ST_Area(ST_Difference(ST_Buffer(a.geom, 3), a.geom)));
-- Park scraps out in the roadway (the U-Bahn band at Friedrichstraße / Leipziger Straße read as park): reader park
-- pieces under 500 m2, narrower than about 4 m, more than 1 m from any building. A courtyard garden touches its
-- buildings, so it stays.
CREATE TABLE bldg_near AS SELECT ST_Union_Agg(ST_Buffer(geom, 1.0, 1)) AS geom FROM areas WHERE class IN ('building', 'public');
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, bldg_near n
  WHERE a.source = 'straube-reader' AND a.class = 'green' AND ST_Area(a.geom) < 500
    AND ST_Area(a.geom) / ST_Perimeter(a.geom) < 2.0 AND NOT ST_Intersects(a.geom, n.geom));
-- Lettering and marks the reader takes for buildings: a reader building at least 80% on the plan's roadway tint
-- (roadway.ts) with no other building within 1.5 m (the reader parts houses by gaps of up to 1.2 m). On 11-17: street names (Bellevuestrasse's cut Hobrecht's sewer
-- there and with it the plate's whole west branch) and the marks on the U-Bahn band. The tint also takes in a few pale
-- houses whole, but a house has neighbours that close, so it stays; lettering is under 600 m2 and 2.5 m thick (area over
-- perimeter), which keeps out detached barracks wings whose tan stripes between hatching read as roadway; dark
-- (public) pieces only under 60 m2, the U-Bahn band's marks, since a dark piece on a square is more often a lodge or kiosk.
CREATE TABLE onroad AS
  SELECT a.rowid AS rid FROM areas a, traced r
  WHERE a.source = 'straube-reader' AND a.class IN ('building', 'public') AND r.class = 'roadway' AND ST_Intersects(a.geom, r.geom)
    AND ST_Area(a.geom) < 600 AND ST_Area(a.geom) / ST_Perimeter(a.geom) < 2.5 AND (a.class = 'building' OR ST_Area(a.geom) < 60)
  GROUP BY a.rowid, a.geom HAVING sum(ST_Area(ST_Intersection(a.geom, r.geom))) >= 0.8 * ST_Area(a.geom);
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM onroad o JOIN areas a ON a.rowid = o.rid
  WHERE NOT EXISTS (SELECT 1 FROM areas n WHERE n.rowid <> a.rowid AND n.class IN ('building', 'public') AND ST_DWithin(a.geom, n.geom, 1.5)));
-- Park pieces in the roadway that the rule above misses, checked by eye one by one (not-green.tsv).
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, read_csv('$here/not-green.tsv', delim = '\t', header = true, comment = '#') p
  WHERE a.source = 'straube-reader' AND a.class = 'green' AND ST_DWithin(a.geom, ST_Point(p.x, p.y), 2));
-- Pieces filed as public or building that are not buildings, checked by eye (not-built.tsv; any source).
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, read_csv('$here/not-built.tsv', delim = '\t', header = true, comment = '#') p
  WHERE a.class IN ('building', 'public') AND ST_Contains(a.geom, ST_Point(p.x, p.y)));
-- Houses the plan draws built that the reader missed, outlined by eye (missed-add.tsv): each takes its ground from
-- whatever reader scrap lay there (park, rail) and keeps out of any building already standing.
CREATE TABLE missed AS SELECT p.kind AS class, ST_GeomFromText(p.wkt) AS geom
  FROM read_csv('$here/missed-add.tsv', delim = '\t', header = true, comment = '#', all_varchar = true) p
  WHERE ST_Intersects(ST_GeomFromText(p.wkt), (SELECT geom FROM frame)); -- only this slice's (the file serves every sheet)
CREATE TABLE missed_cut AS SELECT a.rowid AS rid, a.class, a.source, UNNEST(ST_Dump(ST_Difference(a.geom, (SELECT ST_Union_Agg(m.geom) FROM missed m WHERE ST_Intersects(m.geom, a.geom))))).geom AS geom
  FROM areas a WHERE a.class NOT IN ('building', 'public') AND EXISTS (SELECT 1 FROM missed m WHERE ST_Intersects(m.geom, a.geom));
DELETE FROM areas WHERE rowid IN (SELECT rid FROM missed_cut);
INSERT INTO areas SELECT class, geom, source FROM missed_cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 15;
INSERT INTO areas SELECT m.class, UNNEST(ST_Dump(COALESCE(ST_Difference(m.geom, (SELECT ST_Union_Agg(a.geom) FROM areas a WHERE a.class IN ('building', 'public') AND ST_Intersects(a.geom, m.geom))), m.geom))).geom, 'straube-by-eye'
  FROM missed m;
SQL
# Pumpstation III's buildings as Hobrecht's Blatt 16 draws and dimensions them (station3.ts fits the plate onto the
# plan; the 1910 plan still draws the same buildings, so they stood in 1917). The reader's pieces there are cut back
# from them as the newer footprints cut the plan's (the reader ran the engine hall into the fire brigade depot next
# door): a piece at least half inside them goes, the rest loses any part under 2 m across. Source "hobrecht-blatt16";
# heights.ts gives them the plate's storeys and heights. station_iii.geojson is from a previous station3.ts run (it
# reads only the plate's table and the offset field for its buildings), so a first build without it skips this.
st3=$map/station_iii.geojson
if [[ -s $st3 ]]; then
  cat >> "$sql" <<SQL
CREATE TABLE plate3 AS SELECT ST_MakeValid(geom) AS geom FROM ST_Read('$st3') WHERE kind IN ('building', 'chimney');
CREATE TABLE plate3_u AS SELECT ST_Union_Agg(geom) AS g FROM plate3;
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, plate3_u u WHERE a.class IN ('building', 'public') AND ST_Intersects(a.geom, u.g)
    AND ST_Area(ST_Intersection(a.geom, u.g)) >= 0.5 * ST_Area(a.geom));
CREATE TABLE plate3_cut AS SELECT class, UNNEST(ST_Dump(ST_Intersection(d,
  ST_Buffer(ST_Buffer(d, -1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5), 1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5)))).geom AS geom, source
FROM (SELECT a.class, a.source, ST_Difference(a.geom, u.g) AS d FROM areas a, plate3_u u WHERE ST_Intersects(a.geom, u.g));
DELETE FROM areas WHERE rowid IN (SELECT a.rowid FROM areas a, plate3_u u WHERE ST_Intersects(a.geom, u.g));
INSERT INTO areas SELECT class, geom, source FROM plate3_cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 15;
INSERT INTO areas SELECT 'public', geom, 'hobrecht-blatt16' FROM plate3;
SQL
fi
# The Gitschiner Straße gasworks' holders as true circles (research/gasholders-1917.tsv: centre and diameter fitted to
# the reader's trace, heights measured on the 1933 aerials). The reader ran two touching holders into one piece and
# one into a neighbour; each goes in as its own 64-sided circle, a later row less any earlier one it touches, and the
# reader's pieces are cut back from them as from Pumpwerk III. Source "gasholder"; heights.ts gives the heights.
gas=$here/../../research/gasholders-1917.tsv
if [[ -s $gas ]]; then
  vals=$(awk -F'\t' '!/^#/ && $1 != "id" && NF > 5 { printf "%s(%d, %s, %s, %s)", (n ? ", " : ""), ++n, $3, $4, $5 / 2 }' "$gas")
  cat >> "$sql" <<SQL
CREATE TABLE gas0 AS SELECT i, ST_Buffer(ST_Point(x, y), r, 16) AS geom FROM (VALUES $vals) t(i, x, y, r)
  WHERE ST_Intersects(ST_Point(x, y), (SELECT geom FROM frame));
CREATE TABLE gas AS SELECT a.i, COALESCE(ST_Difference(a.geom, (SELECT ST_Union_Agg(b.geom) FROM gas0 b
  WHERE b.i < a.i AND ST_Intersects(a.geom, b.geom))), a.geom) AS geom FROM gas0 a;
CREATE TABLE gas_u AS SELECT ST_Union_Agg(geom) AS g FROM gas;
DELETE FROM areas WHERE rowid IN (
  SELECT a.rowid FROM areas a, gas_u u WHERE a.class IN ('building', 'public') AND ST_Intersects(a.geom, u.g)
    AND ST_Area(ST_Intersection(a.geom, u.g)) >= 0.5 * ST_Area(a.geom));
CREATE TABLE gas_cut AS SELECT class, UNNEST(ST_Dump(ST_Intersection(d,
  ST_Buffer(ST_Buffer(d, -1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5), 1, 8, 'CAP_FLAT', 'JOIN_MITRE', 5)))).geom AS geom, source
FROM (SELECT a.class, a.source, ST_Difference(a.geom, u.g) AS d FROM areas a, gas_u u WHERE ST_Intersects(a.geom, u.g));
DELETE FROM areas WHERE rowid IN (SELECT a.rowid FROM areas a, gas_u u WHERE ST_Intersects(a.geom, u.g));
INSERT INTO areas SELECT class, geom, source FROM gas_cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 15;
INSERT INTO areas SELECT 'building', geom, 'gasholder' FROM gas ORDER BY i;
SQL
fi
cat >> "$sql" <<SQL

-- Open ground: the slice minus everything else, in pieces.
CREATE TABLE open_ AS
SELECT UNNEST(ST_Dump(ST_Difference(f.geom, (SELECT ST_Union_Agg(geom) FROM areas)))).geom AS geom FROM frame f;
SQL
if [[ -n $traced ]]; then
  # Street and courtyard by the plan's tint: the roadway (trace.sh, roadway.ts) is street, the rest courtyard, but
  # for the strips and quays below; then the streets are merged, and the courtyards. (Before 11-17 a
  # piece was a street if over 2,500 m2 or touching the slice edge: most courtyards reach the street through gaps
  # between traced buildings, so they came out as street.) Within "Berlin um 1900" the same tint is used: that
  # vector set files courtyards and squares together and leaves the roadway out.
  cat >> "$sql" <<SQL
-- Done per 500 m cell: the roadway is one polygon of some 200,000 points, too big to overlay the open ground whole.
CREATE TABLE cells AS SELECT row_number() OVER () AS cid, ST_MakeEnvelope(x, y, x + 500, y + 500) AS g FROM range($X0, $X1, 500) a(x), range($Y0, $Y1, 500) b(y);
CREATE TABLE road_c AS
SELECT c.cid, ST_Union_Agg(ST_Intersection(r.geom, c.g)) AS geom
FROM (SELECT ST_MakeValid(ST_SimplifyPreserveTopology(ST_SetCRS(geom, 'EPSG:25833'), 0.3)) AS geom FROM '$traced' WHERE class = 'roadway') r, cells c
WHERE ST_Intersects(r.geom, c.g) GROUP BY c.cid;
CREATE TABLE open_c AS SELECT c.cid, UNNEST(ST_Dump(ST_Intersection(o.geom, c.g))).geom AS geom FROM open_ o, cells c WHERE ST_Intersects(o.geom, c.g);
CREATE TABLE split AS
SELECT 'street' AS kind, UNNEST(ST_Dump(ST_Intersection(o.geom, r.geom))).geom AS geom FROM open_c o JOIN road_c r USING (cid) WHERE ST_Intersects(o.geom, r.geom)
UNION ALL
SELECT 'courtyard', UNNEST(ST_Dump(ST_Difference(o.geom, r.geom))).geom FROM open_c o JOIN road_c r USING (cid) WHERE ST_Intersects(o.geom, r.geom)
UNION ALL
SELECT 'courtyard', o.geom FROM open_c o WHERE NOT EXISTS (SELECT 1 FROM road_c r WHERE r.cid = o.cid AND ST_Intersects(o.geom, r.geom));
DELETE FROM split WHERE ST_GeometryType(geom) <> 'POLYGON' OR ST_Area(geom) < 0.5;
-- Courtyard ground narrower than 3 m (what an inward then outward buffer of 1.5 m removes) within 2 m of the
-- roadway is a strip of street the mask missed: along the U-Bahn band, the plan's kerb and tram lines, a building
-- line. Left as courtyard, such strips ran courtyards of different blocks together (one piece of 178,000 m2 on
-- 11-17). The rest of that thin ground stays courtyard: chiefly the half-metre gaps between houses, where trace.sh
-- cuts the plan's party-wall lines, which reach the street only at their ends. Courtyard
-- pieces touching both a street and water are the pale promenades of the quays.
CREATE TABLE cy AS SELECT row_number() OVER () AS rid, geom FROM split WHERE kind = 'courtyard';
DELETE FROM split WHERE kind = 'courtyard';
CREATE TABLE cy_core AS SELECT rid, geom, ST_Buffer(ST_Buffer(geom, -1.5), 1.5) AS core FROM cy;
INSERT INTO split SELECT 'courtyard', UNNEST(ST_Dump(ST_Intersection(core, geom))).geom FROM cy_core WHERE NOT ST_IsEmpty(core);
INSERT INTO split SELECT 'thin', UNNEST(ST_Dump(CASE WHEN ST_IsEmpty(core) THEN geom ELSE ST_Difference(geom, core) END)).geom FROM cy_core;
DELETE FROM split WHERE ST_GeometryType(geom) <> 'POLYGON' OR ST_Area(geom) < 0.1;
CREATE TABLE road_b AS SELECT cid, ST_Buffer(geom, 2.0) AS geom FROM road_c;
CREATE TABLE thin AS SELECT row_number() OVER () AS tid, geom FROM split WHERE kind = 'thin';
DELETE FROM split WHERE kind = 'thin';
CREATE TABLE thin_r AS
SELECT t.tid, ST_Union_Agg(ST_Intersection(t.geom, r.geom)) AS g FROM thin t, road_b r WHERE ST_Intersects(t.geom, r.geom) GROUP BY t.tid;
INSERT INTO split SELECT 'street', UNNEST(ST_Dump(g)).geom FROM thin_r;
INSERT INTO split SELECT 'courtyard', UNNEST(ST_Dump(CASE WHEN r.g IS NULL THEN t.geom ELSE ST_Difference(t.geom, r.g) END)).geom
FROM thin t LEFT JOIN thin_r r USING (tid);
DELETE FROM split WHERE ST_GeometryType(geom) <> 'POLYGON' OR ST_Area(geom) < 0.1;
-- Islands: a courtyard piece with at least 80% of its outline within 1 m of the roadway lies in the street: the
-- strip between tram rails (3-5 m wide with the rails on Charlottenstraße), a refuge, a piece of the U-Bahn band.
CREATE TABLE road_1 AS SELECT cid, ST_Buffer(geom, 1.0) AS geom FROM road_c;
UPDATE split SET kind = 'street' WHERE rowid IN (
  SELECT c.rowid FROM split c, road_1 r WHERE c.kind = 'courtyard' AND ST_Intersects(c.geom, r.geom)
  GROUP BY c.rowid, c.geom HAVING sum(ST_Length(ST_Intersection(ST_Boundary(c.geom), r.geom))) >= 0.8 * ST_Perimeter(c.geom));
UPDATE split SET kind = 'street' WHERE rowid IN (
  SELECT c.rowid FROM split c WHERE c.kind = 'courtyard'
    AND EXISTS (SELECT 1 FROM areas w WHERE w.class = 'water' AND ST_DWithin(c.geom, w.geom, 1))
    AND EXISTS (SELECT 1 FROM split s WHERE s.kind = 'street' AND ST_DWithin(c.geom, s.geom, 1)));
-- Courtyard slivers under 4 m2 that touch the street are the street's (left between rounded parts, they were holes in
-- it: at Leipziger and Charlottenstrasse they put the centreline's half-width at 6.7 m instead of 12).
CREATE TABLE cy_u AS SELECT UNNEST(ST_Dump(ST_Union_Agg(geom))).geom AS g FROM split WHERE kind = 'courtyard';
CREATE TABLE cy_bit AS SELECT c.g FROM cy_u c WHERE ST_Area(c.g) < 4
  AND EXISTS (SELECT 1 FROM split s WHERE s.kind = 'street' AND ST_DWithin(c.g, s.geom, 0.5));
CREATE TABLE open_ground AS
SELECT 'street' AS kind, UNNEST(ST_Dump(ST_Union_Agg(geom))).geom AS geom FROM (SELECT geom FROM split WHERE kind = 'street' UNION ALL SELECT g FROM cy_bit)
UNION ALL
SELECT 'courtyard', c.g FROM cy_u c WHERE ST_Area(c.g) >= 1 AND NOT EXISTS (SELECT 1 FROM cy_bit b WHERE ST_Equals(b.g, c.g));
SQL
else
  # Without the reader's trace: a piece is a street if it is large or reaches the slice edge, otherwise a courtyard.
  cat >> "$sql" <<SQL
CREATE TABLE open_ground AS
SELECT CASE WHEN ST_Area(o.geom) > 2500 OR ST_Intersects(ST_Boundary(f.geom), o.geom) THEN 'street' ELSE 'courtyard' END AS kind,
       o.geom
FROM open_ o, frame f WHERE ST_Area(o.geom) >= 1;
SQL
fi
cat >> "$sql" <<SQL
-- Vacant land: open ground no block encloses. A Berlin yard lies within about 25 m of its houses; open ground
-- further from any building than that, in pieces of 2,000 m2 and more, is a field, a lot not yet built on, a coal or
-- timber yard: 'vacant', grown back to 2 m short of the houses so it takes the field's edge with it. (The city
-- sheets' outskirts, where the plan draws Hobrecht's planned streets over fields and the fields join into one open
-- piece through the gaps: one sheet had 8.3 km2 of "courtyard", 11-17.)
CREATE TABLE bbuf AS SELECT ST_Union_Agg(ST_Buffer(geom, 25, 2)) AS g FROM areas WHERE class IN ('building', 'public');
CREATE TABLE cy_big AS SELECT rowid AS rid, geom FROM open_ground WHERE kind = 'courtyard' AND ST_Area(geom) > 5000;
CREATE TABLE cy_far AS SELECT c.rid, UNNEST(ST_Dump(COALESCE(ST_Difference(c.geom, b.g), c.geom))).geom AS g FROM cy_big c, bbuf b;
CREATE TABLE vac0 AS SELECT rid, ST_Union_Agg(ST_Buffer(g, 23, 2)) AS g FROM cy_far WHERE ST_Area(g) >= 2000 GROUP BY rid;
CREATE TABLE vac AS SELECT c.rid, ST_Intersection(c.geom, v.g) AS g FROM cy_big c JOIN vac0 v USING (rid);
CREATE TABLE cy_rest AS SELECT c.rid, UNNEST(ST_Dump(ST_Difference(c.geom, v.g))).geom AS g FROM cy_big c JOIN vac v USING (rid);
DELETE FROM open_ground WHERE rowid IN (SELECT rid FROM vac);
INSERT INTO open_ground SELECT 'vacant', UNNEST(ST_Dump(g)).geom FROM vac;
INSERT INTO open_ground SELECT 'courtyard', g FROM cy_rest WHERE ST_GeometryType(g) = 'POLYGON' AND ST_Area(g) >= 1;
DELETE FROM open_ground WHERE kind = 'vacant' AND (ST_GeometryType(geom) <> 'POLYGON' OR ST_Area(geom) < 1);
-- Fields under the roadway's colour: on the outskirts the plan's paper between planned streets drawn as bare lines is
-- the roadway's colour, so whole fields came out as street (212,000 m2 of one 500 m tile by the Jungfernheide).
-- Street ground over 75 m from any building, in parts at least 40 m wide and of 20,000 m2, is vacant too, grown
-- back to 30 m short of the houses, so the street in front of the last row stays street. A square that size with no
-- building on it is drawn as a garden (Königsplatz, Lustgarten), not as roadway.
CREATE TABLE bbuf75 AS SELECT ST_Union_Agg(ST_Buffer(geom, 75, 2)) AS g FROM areas WHERE class IN ('building', 'public');
CREATE TABLE st AS SELECT rowid AS rid, geom FROM open_ground WHERE kind = 'street';
CREATE TABLE st_far AS SELECT UNNEST(ST_Dump(CASE WHEN b.g IS NULL THEN s.geom ELSE ST_Difference(s.geom, b.g) END)).geom AS g FROM st s, bbuf75 b;
CREATE TABLE fld AS SELECT ST_Union_Agg(ST_Buffer(g, 45, 2)) AS g FROM st_far
  WHERE ST_GeometryType(g) = 'POLYGON' AND ST_Area(g) >= 20000 AND NOT ST_IsEmpty(ST_Buffer(g, -20));
CREATE TABLE st_cut AS SELECT 'vacant' AS kind, UNNEST(ST_Dump(ST_Intersection(s.geom, f.g))).geom AS geom FROM st s, fld f WHERE f.g IS NOT NULL AND ST_Intersects(s.geom, f.g)
  UNION ALL SELECT 'street', UNNEST(ST_Dump(ST_Difference(s.geom, f.g))).geom FROM st s, fld f WHERE f.g IS NOT NULL AND ST_Intersects(s.geom, f.g);
DELETE FROM open_ground WHERE kind = 'street' AND rowid IN (SELECT s.rid FROM st s, fld f WHERE f.g IS NOT NULL AND ST_Intersects(s.geom, f.g));
INSERT INTO open_ground SELECT kind, geom FROM st_cut WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_Area(geom) >= 1;
SQL
cat >> "$sql" <<SQL
-- key: the footprint's centroid in decimetres ("3907334_58190219"), the same on every rebuild while the footprint is;
-- id: a number in key order, kept for older readers (it moves when a building is added or removed: use key).
CREATE TABLE b0 AS SELECT class, source, geom, printf('%d_%d', round(ST_X(ST_Centroid(geom)) * 10)::BIGINT, round(ST_Y(ST_Centroid(geom)) * 10)::BIGINT) AS k
FROM areas WHERE class IN ('building', 'public');
CREATE TABLE b AS SELECT row_number() OVER (ORDER BY key) AS id, key, class, source, geom
FROM (SELECT *, k || CASE WHEN row_number() OVER (PARTITION BY k ORDER BY ST_Area(geom), ST_AsText(geom)) > 1 THEN '_' || row_number() OVER (PARTITION BY k ORDER BY ST_Area(geom), ST_AsText(geom)) ELSE '' END AS key FROM b0);
CREATE TABLE match AS
SELECT b.id, arg_max(a.storeys, ST_Area(ST_Intersection(b.geom, a.geom))) AS storeys,
       max(ST_Area(ST_Intersection(b.geom, a.geom)) / ST_Area(ST_Union(b.geom, a.geom))) AS iou
FROM b JOIN alkis a ON ST_Intersects(b.geom, a.geom) GROUP BY b.id;

-- Names from OpenHistoricalMap: elements valid in 1917 with no licence tag of their own (those are CC0).
CREATE TABLE ohm AS
SELECT e.type, to_json(e.tags) AS tags, CASE WHEN len(e.geometry) >= 4 AND e.geometry[1].lat = e.geometry[-1].lat AND e.geometry[1].lon = e.geometry[-1].lon
         THEN ST_MakePolygon(ST_MakeLine(list_transform(e.geometry, lambda p: ST_Transform(ST_Point(p.lon, p.lat), 'EPSG:4326', 'EPSG:25833', always_xy := true))))
         ELSE ST_MakeLine(list_transform(e.geometry, lambda p: ST_Transform(ST_Point(p.lon, p.lat), 'EPSG:4326', 'EPSG:25833', always_xy := true))) END AS geom
FROM (SELECT UNNEST(elements) AS e FROM read_json('$own/ohm.json', maximum_object_size = 200000000))
WHERE e.type = 'way' AND len(e.geometry) >= 2
  AND json_extract_string(to_json(e.tags), '$.license') IS NULL
  AND coalesce(left(json_extract_string(to_json(e.tags), '$.start_date'), 4), '0000') <= '1917'
  AND coalesce(left(json_extract_string(to_json(e.tags), '$.end_date'), 4), '9999') > '1917';
CREATE TABLE names AS
SELECT b.id, arg_max(json_extract_string(o.tags, '$.name'), ST_Area(ST_Intersection(b.geom, o.geom))) AS name
FROM b JOIN ohm o ON json_extract_string(o.tags, '$.name') IS NOT NULL AND ST_GeometryType(o.geom) = 'POLYGON' AND ST_Intersects(b.geom, o.geom)
WHERE ST_Area(ST_Intersection(b.geom, o.geom)) > 0.5 * least(ST_Area(o.geom), ST_Area(b.geom))
GROUP BY b.id;

CREATE TABLE buildings AS
SELECT b.id, b.key, CASE b.class WHEN 'public' THEN 'public' ELSE 'private' END AS kind, b.source,
       CASE WHEN m.iou >= 0.8 AND m.storeys BETWEEN 1 AND 9 THEN m.storeys WHEN b.class = 'public' THEN 4 ELSE 5 END AS storeys,
       CASE WHEN m.iou >= 0.8 AND m.storeys BETWEEN 1 AND 9 THEN 'alkis' ELSE 'rule' END AS storeys_from,
       round(coalesce(m.iou, 0), 2) AS iou_today, n.name, round(ST_Area(b.geom), 1) AS area_m2, b.geom
FROM b LEFT JOIN match m USING (id) LEFT JOIN names n USING (id);

-- Labels: the 1900 street names and house numbers inside its coverage, OHM street names (1917) outside it.
CREATE TABLE labels AS
SELECT CASE objektart WHEN 'Straßenname' THEN 'street' ELSE 'house_number' END AS kind, text, winkel AS angle, 'berlin1900' AS source, s.geom
FROM ST_Read('$b1900/a_berlin1900_texte.json') s, frame f WHERE ST_Intersects(s.geom, f.geom)
UNION ALL
-- One OHM label per 600 m of each named street outside the coverage, turned along the street (degrees from east).
SELECT 'street', name, degrees(atan2(ST_Y(p1) - ST_Y(p0), ST_X(p1) - ST_X(p0))), 'ohm', ST_LineInterpolatePoint(geom, t)
FROM (SELECT name, geom, t, ST_LineInterpolatePoint(geom, greatest(0, t - 0.03)) AS p0, ST_LineInterpolatePoint(geom, least(1, t + 0.03)) AS p1
      FROM (SELECT name, geom, (r.i + 0.5) / greatest(1, floor(ST_Length(geom) / 600)) AS t
            FROM (SELECT name, d.geom AS geom
                  FROM (SELECT s.name, unnest(ST_Dump(ST_Difference(ST_Intersection(s.geom, f.geom), ST_Buffer(c.geom, 20)))) AS d
                        FROM (SELECT json_extract_string(o.tags, '$.name') AS name, ST_LineMerge(ST_Union_Agg(o.geom)) AS geom FROM ohm o
                              WHERE json_extract_string(o.tags, '$.highway') IS NOT NULL AND json_extract_string(o.tags, '$.name') IS NOT NULL AND ST_GeometryType(o.geom) = 'LINESTRING'
                              GROUP BY 1) s, frame f, cov c)
                  WHERE ST_GeometryType(d.geom) = 'LINESTRING' AND ST_Length(d.geom) > 120) parts,
                 range(0, 8) r(i)
            WHERE r.i < greatest(1, floor(ST_Length(geom) / 600))));

CREATE TABLE boreholes AS
SELECT schluessel AS key, langname AS name, endteufe AS depth_m, TRY_CAST(ansatzhoehe AS DOUBLE) AS top_m,
       bohrbeginn AS drilled, year(bohrbeginn) < 1946 AS before_1946, profil_lang AS log, s.geom
FROM ST_Read('$own/boreholes.json') s;

-- Trams standing in 1917 (OpenHistoricalMap ways tagged railway=tram, valid in 1917 as above; a way with no start date
-- is kept, and its source says what it was drawn from). OHM draws a double track either as two ways side by side or
-- as one; beside_another is the share of a way's length within 5 m of another tram way.
CREATE TABLE tram0 AS
SELECT row_number() OVER (ORDER BY ST_AsText(o.geom)) AS rid, json_extract_string(o.tags, '$.start_date') AS start_date,
       json_extract_string(o.tags, '$.end_date') AS end_date, json_extract_string(o.tags, '$.source') AS source,
       json_extract_string(o.tags, '$.name') AS name, ST_Intersection(o.geom, f.geom) AS geom
FROM ohm o, frame f
WHERE json_extract_string(o.tags, '$.railway') = 'tram' AND ST_GeometryType(o.geom) = 'LINESTRING' AND ST_Intersects(o.geom, f.geom);
CREATE TABLE trams AS
SELECT t.rid AS id, t.name, t.start_date, t.end_date, t.source, round(ST_Length(t.geom), 1) AS length_m,
       round(coalesce(ST_Length(ST_Intersection(t.geom, (SELECT ST_Buffer(ST_Union_Agg(u.geom), 5) FROM tram0 u WHERE u.rid <> t.rid AND ST_DWithin(u.geom, t.geom, 5)))), 0) / greatest(ST_Length(t.geom), 0.1), 2) AS beside_another,
       t.geom
FROM tram0 t WHERE NOT ST_IsEmpty(t.geom);
COPY (SELECT *, CASE WHEN beside_another >= 0.6 THEN 'one rail pair of a double track (the other runs beside it)' ELSE 'one line: a single track, or a double track drawn as one' END AS tracks,
             'OpenHistoricalMap (CC0), railway=tram valid in 1917' AS basis FROM trams) TO '$map/trams.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT * FROM buildings) TO '$map/buildings.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
-- Holes under 1 m2 are gaps where pieces from different rules meet (0.01-0.08 m2, in no layer); a 1 m raster can
-- still read one as an edge (skeleton.ts put a half-width of 6.7 m in the middle of a crossing).
CREATE MACRO drop_holes(g, mina) AS ST_MakePolygon(ST_ExteriorRing(g),
  list_filter([ST_InteriorRingN(g, i) FOR i IN range(1, ST_NInteriorRings(g) + 1)], lambda r: ST_Area(ST_MakePolygon(r)) >= mina));
UPDATE open_ground SET geom = drop_holes(geom, 1.0) WHERE ST_GeometryType(geom) = 'POLYGON' AND ST_NInteriorRings(geom) > 0;
COPY (SELECT kind, round(ST_Area(geom), 1) AS area_m2, geom FROM open_ground) TO '$map/open.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT source, round(ST_Area(geom), 1) AS area_m2, geom FROM areas WHERE class = 'water') TO '$map/water.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT source, round(ST_Area(geom), 1) AS area_m2, geom FROM areas WHERE class = 'green') TO '$map/green.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT source, round(ST_Area(geom), 1) AS area_m2, geom FROM areas WHERE class = 'rail') TO '$map/rail.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT * FROM labels WHERE geom IS NOT NULL) TO '$map/labels.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');
COPY (SELECT * FROM boreholes) TO '$map/boreholes.geojson' WITH (FORMAT GDAL, DRIVER 'GeoJSON', SRS 'EPSG:25833');

SELECT 'buildings' AS layer, kind AS what, source, count(*) AS n, round(sum(area_m2)) AS m2 FROM buildings GROUP BY ALL
UNION ALL SELECT 'storeys', storeys_from, NULL, count(*), NULL FROM buildings GROUP BY ALL
UNION ALL SELECT 'named', 'buildings with a 1917 name', NULL, count(name), NULL FROM buildings
UNION ALL SELECT 'open', kind, NULL, count(*), round(sum(ST_Area(geom))) FROM open_ground GROUP BY ALL
UNION ALL SELECT class, NULL, source, count(*), round(sum(ST_Area(geom))) FROM areas WHERE class NOT IN ('building', 'public') GROUP BY ALL
UNION ALL SELECT 'labels', kind, source, count(*), NULL FROM labels GROUP BY ALL
UNION ALL SELECT 'trams', CASE WHEN beside_another >= 0.6 THEN 'paired' ELSE 'single line' END, NULL, count(*), round(sum(length_m)) FROM trams GROUP BY ALL
UNION ALL SELECT 'boreholes', CASE WHEN before_1946 THEN 'before 1946' ELSE '1946 on' END, NULL, count(*), NULL FROM boreholes GROUP BY ALL
ORDER BY 1, 2, 3;
SQL
duckdb -bail < "$sql"
# Each building's use in 1910 (use1910.ts), when the slice has the land-use map's tiles.
# Then vacant land the land-use map draws built up becomes "beyond" (beyond.sh: the towns the plan leaves blank).
if [[ -d $cache/rasters/use1910 ]]; then bun "$here/use1910.ts" "$slice"; "$here/beyond.sh" "$slice"; fi
# Public or commercial: the plan's dark grey (state, municipal) or its hatched mid grey (commercial private), drawn.ts.
bun "$here/drawn.ts" "$slice"
# Beyond the plan: the blocks the Umweltatlas dates to 1917, with today's buildings (outside.sh).
"$here/outside.sh" "$slice"
# The Hochbahn's band: what the reader took for buildings on the elevated line and at its stations (bands.sh).
"$here/bands.sh" "$slice"
# and its own station buildings beside the deck, the plan's stair houses held to their height (stations.sh).
"$here/stations.sh" "$slice"
