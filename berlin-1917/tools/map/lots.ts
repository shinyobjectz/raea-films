// Splits the traced building masses into the lots the 1917 Adreßbuch reads along them. The Straube plan draws touching
// buildings as one hatched mass, so the reader traced Wilhelmstraße's palaces 70b-77 as one 19,000 m2 footprint; the
// directory places each house's front on it (tools/addr/place.ts, which names the building as building_key). A building
// two or more houses' fronts sit on is split among those houses only: every point of it within DEPTH of one of their
// fronts goes to the nearest (a Voronoi partition of points every metre along the fronts, so lots meet at
// perpendiculars between fronts and at bisectors in the corners); what lies deeper stays with the mass as its rest. Lot lines are not drawn on any source here: their run into the
// block is ASSUMED (perpendicular to the street, to DEPTH at most), and each piece says so in `lot`.
// A lot piece is named from its house's directory entries when one is an institution (a ministry, an embassy, a
// hotel, a bank, a theatre). Otherwise every piece of a split mass, its rest too, is named again from OpenHistoricalMap
// as build.sh names buildings, but strictly: a named OHM building standing in 1917 gives its name only to the piece
// holding most of it (the mass's own name was the largest OHM building it mostly contained, so the Ministergärten
// palaces carried "Reichspräsidentenpalais", a name of 1919). The rest keeps the mass's key.
// The unsplit buildings are kept in cache/<slice>/buildings.unsplit.geojson and every run splits from them, so this can
// run again after the houses are placed again. A rebuild (build.sh) writes unsplit buildings and starts over; lots.ts
// runs after every other step that writes buildings.geojson (heights, landmarks). A lot is a new building: its key is
// the mass's key with "~" and its street and house (wil77), its id a new one; the rest keeps the mass's key and id.
// Each house's building_key and building_id in businesses/*.geojson then name its own lot, which is what the world
// bake and the interiors' windows match shops by. Every building a read house with an institution stands on (its lot,
// or the building itself when unsplit) gets `institution` (parliament, court office, post, ministry, office, embassy,
// palace, museum, bank, hotel; a ministry is a Prussian ministry or a Reich office of that rank, an office any lesser
// one) and `institution_name` from the directory; `use` stays the 1910 land-use map's class.
//   bun lots.ts [SLICE.json]   in: map/1917/buildings.geojson, map/1917/businesses/*.geojson
//                              out: buildings.geojson and businesses/*.geojson in place
import { slicePaths } from "./paths";
import { readdirSync } from "node:fs";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { cache, own, map } = await slicePaths(slicePath);
const DEPTH = 80, MIN = 25, STEP = 1;
const file = `${map}/buildings.geojson`, base = `${cache}/buildings.unsplit.geojson`;
const now = await Bun.file(file).json();
if (!now.features.some((f: any) => f.properties.lot)) await Bun.write(base, JSON.stringify(now));
else if (!(await Bun.file(base).exists())) throw new Error(`${file} is split but ${base} is missing: rebuild the map first`);
const fc = await Bun.file(base).json();

// An institution's name from a house's entries: among the non-owner entries of an institutional kind, a ministry, a
// chancellery, an embassy or a parliament before any lesser office (Wilhelmstraße 73 lists the Hausministerium's
// bureau, its cash offices and the Heroldsamt), else the first; cleaned of the telephone mark ("T."), a leading
// "Büro d." and the closing full stop. A ministry's "E. Fiskus" (the owner) is not a name, and neither is a person or a
// trade: a hotel is named only by an entry that begins "Hotel" with its name, a bank only by a bank's own name.
// The war economy's offices, which the reader often files as residents or firms: the War Ministry's departments and
// reporting offices (Kautschuk-Meldestelle, Metall-Mobilmachungsstelle, "Kriegsminist., Abt. ...") and the war
// companies and committees it set up (Kriegsmetall AG, Kriegswollbedarf AG, the Kriegsausschüsse). Taken whatever kind
// the reader gave them, after a ministry and before any lesser office; each is an office.
const WAR = /^(Kriegsminist\.?,?\s+(Abt|Zentral)|Kriegs(ausschu|gesellsch|metall|woll|leder|chemikal|rohstoff|ernähr)|[\wäöüÄÖÜß-]*(melde|mobilmachungs)stelle\b)/i;
const INST = [/ministeri|kanzlei\b|botschaft|gesandtsch|herrenhaus|abgeordnetenhaus/i, WAR,
  /(?<!be)amt\b|konsulat|palais|^hotel\s+[A-ZÄÖÜ]|\bbank\b|bankhaus|theater|passage|panoptikum|akademie|bibliothek|universität|museum|kirche|\bpost/i];
const TRADE = /hotelbes|bedarf|betrieb|kommission|agentur|vertret|\bu\.?\s*Co\b|& Co\b/i;
const nameOf = (entries: { text: string; role: string | null; kind: string }[]) => {
  const ok = entries.filter((x) => (x.role !== "owner" && WAR.test(x.text)) || x.role !== "owner" && !/,/.test(x.text.split(" ").slice(0, 2).join(" ")) &&
    (x.kind === "state" || (x.kind === "hotel" && /^Hotel\s+[A-ZÄÖÜ]/.test(x.text)) || (x.kind === "bank" && /\bBank\b|Bankhaus|Disconto|Diskonto/.test(x.text))) && !TRADE.test(x.text));
  const e = INST.map((re) => ok.find((x) => re.test(x.text))).find(Boolean);
  if (!e) return null;
  const bureau = /^Büro d(es|er)?\.?\s+/.test(e.text);
  let n = e.text.replace(/\s+T\.?(\s.*)?$/, "").replace(/^Büro d(es|er)?\.?\s+/, "").replace(/\s+/g, " ").replace(/\.$/, "").trim();
  if (bureau) n = n.replace(/(ministeri|amt)(um)?s\b/, (_, a, b) => a + (b ?? ""));
  return n;
};
// The kind of an institution's name; the first that matches wins, and a building keeps the highest-ranked of its houses'.
const INST_KIND: [string, RegExp][] = [["parliament", /herrenhaus|abgeordnetenhaus|landtag|reichstag/i], ["court office", /hausministeri|hofmarschall|heroldsamt|hofstaat|kgl\. haus/i],
  ["post", /^post(amt)?\b|postamt\s*\d/i], ["ministry", /ministeri|kanzlei\b|reichs\w*amt|auswärtiges amt|kolonialamt|schatz-?\s?amt/i],
  ["office", /(?<!be)amt\b|amt\s|prüfungs/i], ["embassy", /botschaft|gesandtsch|konsulat/i], ["palace", /palais/i],
  ["museum", /museum|akademie|bibliothek|universität/i], ["bank", /bank|disconto|diskonto/i], ["hotel", /^hotel/i]];
const instKind = (n: string) => (WAR.test(n) ? "office" : INST_KIND.find(([, re]) => re.test(n))?.[0] ?? null);
const rank = (k: string | null) => (k ? INST_KIND.findIndex(([x]) => x === k) : 99);
const houses: { hid: number; street: string; house: string; name: string | null; front: number[][]; key: string; feat: any }[] = [];
const books = new Map<string, any>();
for (const f of readdirSync(`${map}/businesses`).filter((n) => n.endsWith(".geojson"))) {
  const book = await Bun.file(`${map}/businesses/${f}`).json();
  books.set(f, book);
  for (const h of book.features) {
    const p = h.properties;
    if (!p.front || !p.building_key || Math.hypot(p.front[1][0] - p.front[0][0], p.front[1][1] - p.front[0][1]) < 2) continue;
    // A house placed on an already split map names a lot: its mass is the key before the "~".
    houses.push({ hid: houses.length, street: p.street, house: p.house, name: nameOf(p.entries), front: p.front, key: String(p.building_key).split("~")[0], feat: h });
  }
}
const pts = houses.flatMap((h) => {
  const [[x0, y0], [x1, y1]] = h.front, n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / STEP));
  // Points between the ends only: neighbours share their corner, and a shared point would leave the cell to neither.
  return Array.from({ length: n }, (_, i) => ({ hid: h.hid, key: h.key, x: x0 + ((x1 - x0) * (i + 0.5)) / n, y: y0 + ((y1 - y0) * (i + 0.5)) / n }));
});
const tmp = `${cache}/lots.tmp`;
await Bun.$`mkdir -p ${tmp}`.quiet();
await Bun.write(`${tmp}/pts.json`, pts.map((p) => JSON.stringify(p)).join("\n"));
await Bun.write(`${tmp}/houses.json`, houses.map((h) => JSON.stringify({ hid: h.hid, wkt: `LINESTRING(${h.front.map((q) => q.join(" ")).join(",")})` })).join("\n"));
await Bun.write(`${tmp}/b.json`, fc.features.map((f: any, i: number) => JSON.stringify({ i, key: f.properties.key, g: JSON.stringify(f.geometry) })).join("\n"));
const sql = `LOAD spatial;
CREATE TABLE b AS SELECT i, key, ST_GeomFromGeoJSON(g) AS geom FROM read_json('${tmp}/b.json');
CREATE TABLE p AS SELECT hid, key, ST_Point(x, y) AS g FROM read_json('${tmp}/pts.json');
CREATE TABLE fr AS SELECT hid, ST_Buffer(ST_GeomFromText(wkt), ${DEPTH}) AS band FROM read_json('${tmp}/houses.json');
CREATE TABLE many AS SELECT key FROM p GROUP BY key HAVING count(DISTINCT hid) >= 2;
CREATE TABLE vd AS SELECT key, unnest(ST_Dump(ST_VoronoiDiagram(ST_Collect(list(g))))).geom AS cell FROM p JOIN many USING (key) GROUP BY key;
CREATE TABLE cells AS SELECT v.key, q.hid, ST_Intersection(ST_Union_Agg(v.cell), any_value(fr.band)) AS near
  FROM vd AS v JOIN p AS q ON q.key = v.key AND ST_Intersects(v.cell, q.g) JOIN fr USING (hid) GROUP BY v.key, q.hid;
CREATE TABLE claim AS SELECT b.i, c.hid, ST_Intersection(b.geom, c.near) AS g FROM b JOIN cells AS c USING (key);
CREATE TABLE ok AS SELECT * FROM claim WHERE ST_Area(g) >= ${MIN};
CREATE TABLE split AS SELECT i FROM ok GROUP BY i HAVING count(DISTINCT hid) >= 2;
CREATE TABLE pc0 AS SELECT o.i, o.hid, unnest(ST_Dump(o.g)).geom AS g FROM ok AS o JOIN split USING (i)
      UNION ALL
      SELECT b.i, NULL AS hid, unnest(ST_Dump(ST_Difference(b.geom, (SELECT ST_Union_Agg(o.g) FROM ok AS o WHERE o.i = b.i)))).geom AS g
      FROM b JOIN split USING (i);
CREATE TABLE pc AS SELECT row_number() OVER () AS pid, * FROM pc0 WHERE ST_GeometryType(g) IN ('POLYGON', 'MULTIPOLYGON');
-- The OHM buildings standing in 1917, as build.sh reads them.
CREATE TABLE ohm AS
SELECT json_extract_string(to_json(e.tags), '$.name') AS name,
       ST_MakePolygon(ST_MakeLine(list_transform(e.geometry, lambda p: ST_Transform(ST_Point(p.lon, p.lat), 'EPSG:4326', 'EPSG:25833', always_xy := true)))) AS geom
FROM (SELECT UNNEST(elements) AS e FROM read_json('${own}/ohm.json', maximum_object_size = 200000000))
WHERE e.type = 'way' AND len(e.geometry) >= 4 AND e.geometry[1].lat = e.geometry[-1].lat AND e.geometry[1].lon = e.geometry[-1].lon
  AND json_extract_string(to_json(e.tags), '$.name') IS NOT NULL
  AND json_extract_string(to_json(e.tags), '$.license') IS NULL
  AND coalesce(left(json_extract_string(to_json(e.tags), '$.start_date'), 4), '0000') <= '1917'
  AND coalesce(left(json_extract_string(to_json(e.tags), '$.end_date'), 4), '9999') > '1917';
CREATE TABLE onames AS SELECT pid, string_agg(name, '; ') AS ohm_name FROM (
  SELECT o.name, arg_max(pc.pid, ST_Area(ST_Intersection(pc.g, o.geom))) AS pid, max(ST_Area(ST_Intersection(pc.g, o.geom))) AS a, any_value(ST_Area(o.geom)) AS ao
  FROM ohm AS o JOIN pc ON ST_Intersects(pc.g, o.geom) GROUP BY o.name, ST_AsText(o.geom)) AS t
WHERE a > 0.5 * ao GROUP BY pid;
COPY (SELECT pc.i, pc.hid, n.ohm_name, ST_AsGeoJSON(pc.g) AS g FROM pc LEFT JOIN onames AS n USING (pid)) TO '${tmp}/pieces.json' (FORMAT JSON);`;
await Bun.write(`${tmp}/lots.sql`, sql);
const r = Bun.spawnSync(["duckdb", "-c", `.read ${tmp}/lots.sql`], { stderr: "pipe" });
if (r.exitCode !== 0) throw new Error(`duckdb: ${r.stderr}`);
const pieces = (await Bun.file(`${tmp}/pieces.json`).text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
  .map((p: any) => ({ ...p, geom: typeof p.g === "string" ? JSON.parse(p.g) : p.g }));
await Bun.$`rm -r ${tmp}`.quiet();

const area = (g: any) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).reduce((s: number, poly: number[][][]) =>
  s + poly.reduce((t, ring, k) => { let a = 0; for (let j = 0; j + 1 < ring.length; j++) a += ring[j][0] * ring[j + 1][1] - ring[j + 1][0] * ring[j][1]; return t + (k ? -1 : 1) * Math.abs(a / 2); }, 0), 0);
// DuckDB returns the pieces in no fixed order; ids and "-2" suffixes are given in this one, so a rerun keeps them.
const first = (g: any) => (g.type === "Polygon" ? g.coordinates[0][0] : g.coordinates[0][0][0]) as number[];
pieces.sort((a: any, b: any) => a.i - b.i || (a.hid ?? -1) - (b.hid ?? -1) || area(b.geom) - area(a.geom) || first(a.geom)[0] - first(b.geom)[0] || first(a.geom)[1] - first(b.geom)[1]);
const bySplit = new Map<number, any[]>();
for (const p of pieces) if (area(p.geom) >= (p.hid == null ? 10 : MIN)) (bySplit.get(p.i) ?? bySplit.set(p.i, []).get(p.i)!).push(p);
const out: any[] = [];
let split = 0, lots = 0, named = 0, nextId = Math.max(...fc.features.map((f: any) => Number(f.properties.id) || 0)) + 1;
const lotOf = new Map<number, { key: string; id: number; a: number }>();
for (const [i, f] of fc.features.entries()) {
  const ps = bySplit.get(i);
  if (!ps) { out.push(f); continue; }
  split++;
  const used = new Map<string, number>();
  // The rest keeps the mass's key (its largest part); every other piece gets the key with its street and house.
  const rest = ps.filter((p) => p.hid == null).sort((a, b) => area(b.geom) - area(a.geom));
  for (const [k, p] of rest.entries()) out.push({ ...f, geometry: p.geom, properties: { ...f.properties, id: k ? nextId++ : f.properties.id, key: k ? `${f.properties.key}~r${k}` : f.properties.key, name: p.ohm_name ?? null,
    area_m2: Math.round(area(p.geom) * 10) / 10, lot: { rest_of: f.properties.key, basis: `the part of a traced mass deeper than ${DEPTH} m from any read front (assumed)` } } });
  for (const p of ps.filter((q) => q.hid != null)) {
    const h = houses[p.hid], tag = `${h.street.replace(/[^A-Za-zÄÖÜäöüß]/g, "").slice(0, 3).toLowerCase()}${h.house.replace(/[^0-9a-z]/gi, "")}`;
    const n = (used.get(tag) ?? 0) + 1; used.set(tag, n);
    lots++; if (h.name) named++;
    const key = `${f.properties.key}~${tag}${n > 1 ? "-" + n : ""}`, id = nextId++, a = area(p.geom);
    if (a > (lotOf.get(p.hid)?.a ?? 0)) lotOf.set(p.hid, { key, id, a });
    out.push({ ...f, geometry: p.geom, properties: { ...f.properties, id, key, name: h.name ?? p.ohm_name ?? null,
      area_m2: Math.round(area(p.geom) * 10) / 10,
      lot: { street: h.street, house: h.house, split_from: f.properties.key, basis: `Adreßbuch 1917 house front (tools/addr/place.ts); its run into the block perpendicular to the street, to ${DEPTH} m at most (assumed)` } } });
  }
}
const before = fc.features.length;
// Each house on a split mass now stands on its own lot (its largest piece); a house on an unsplit building names it.
let moved = 0;
for (const h of houses) {
  const l = lotOf.get(h.hid), p = h.feat.properties;
  const want = l ? { key: l.key, id: l.id } : { key: h.key, id: fc.features.find((f: any) => f.properties.key === h.key)?.properties.id ?? p.building_id };
  if (p.building_key !== want.key) moved++;
  p.building_key = want.key; p.building_id = want.id;
}
const byKey = new Map(out.map((f: any) => [f.properties.key, f]));
for (const f of out) { delete f.properties.institution; delete f.properties.institution_name; }
let tagged = 0;
for (const h of houses) {
  const k = instKind(h.name ?? ""), f = byKey.get(lotOf.get(h.hid)?.key ?? h.key) as any;
  // A lower index ranks higher; a building keeps the best of its houses' kinds.
  if (!k || !f || rank(k) >= rank(f.properties.institution ?? null)) continue;
  if (!f.properties.institution) tagged++;
  f.properties.institution = k; f.properties.institution_name = h.name;
}
for (const [n, book] of books) await Bun.write(`${map}/businesses/${n}`, JSON.stringify(book));
await Bun.write(file, `${JSON.stringify({ ...fc, features: undefined }).replace(/}$/, ",")}"features": [\n${out.map((f) => JSON.stringify(f)).join(",\n")}\n]\n}\n`);
console.log(`lots: ${houses.length} read houses (${moved} moved to their own lot; ${tagged} buildings tagged with an institution); ${split} traced masses split into ${lots} lots (${named} named from the directory) and their rests; ${before} -> ${out.length} buildings`);
